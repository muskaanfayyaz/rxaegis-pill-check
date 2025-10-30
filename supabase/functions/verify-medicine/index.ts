import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract userId from authenticated JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { medicineName, extractedText } = await req.json();
    
    if (!medicineName || typeof medicineName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid medicine name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate medicine name length
    if (medicineName.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Medicine name too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying medicine:", medicineName);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean and sanitize the medicine name - remove dosage instructions
    const firstPart = medicineName.split(/\s+(?:for|three|twice|once|take|x\d+|daily|days|morning|evening|night|\d+x)/i)[0];
    const cleanName = firstPart
      .replace(/\d+\s*(?:mg|g|ml|mcg|tab|tablet|tablets|cap|capsule|capsules|x)?\s*$/i, '')
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/[^a-zA-Z0-9\s\-()]/g, '') // Remove special characters to prevent injection
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 100); // Limit length

    console.log("Cleaned medicine name:", cleanName);

    if (!cleanName || cleanName.length < 3) {
      console.log("Medicine name too short after cleaning, skipping");
      return new Response(
        JSON.stringify({
          found: false,
          verified: false,
          message: "Invalid medicine name",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for medicine in database using separate queries to avoid injection
    const { data: nameMatches, error: nameError } = await supabase
      .from('medicines')
      .select('*')
      .ilike('name', `%${cleanName}%`)
      .limit(3);

    const { data: genericMatches, error: genericError } = await supabase
      .from('medicines')
      .select('*')
      .ilike('generic_name', `%${cleanName}%`)
      .limit(3);

    const searchError = nameError || genericError;
    const medicines = [...(nameMatches || []), ...(genericMatches || [])]
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      )
      .slice(0, 5);

    if (searchError) {
      console.error('Database search error:', searchError);
      return new Response(
        JSON.stringify({ error: 'Unable to verify medicine at this time. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find best match using fuzzy matching
    let foundMedicine = null;
    if (medicines && medicines.length > 0) {
      // Try exact match first
      foundMedicine = medicines.find(m => 
        m.name.toLowerCase() === cleanName.toLowerCase() ||
        m.generic_name.toLowerCase() === cleanName.toLowerCase()
      );
      
      // If no exact match, use first partial match
      if (!foundMedicine) {
        foundMedicine = medicines[0];
      }
      
      console.log("Found medicine:", foundMedicine?.name);
    }

    if (foundMedicine) {
      // Medicine found in DRAP - store verification history
      if (userId) {
        await supabase.from('verification_history').insert({
          user_id: userId,
          medicine_name: medicineName,
          extracted_text: extractedText || medicineName,
          verification_status: 'verified',
          verified_data: {
            id: foundMedicine.id,
            name: foundMedicine.name,
            generic_name: foundMedicine.generic_name,
            strength: foundMedicine.strength,
            manufacturer: foundMedicine.manufacturer,
            registration_number: foundMedicine.registration_number,
            category: foundMedicine.category,
            who_approved: foundMedicine.who_approved,
            side_effects: foundMedicine.side_effects,
            alternatives: foundMedicine.alternatives,
          }
        });
      }

      return new Response(
        JSON.stringify({
          found: true,
          verified: true,
          medicine: {
            name: foundMedicine.name,
            generic_name: foundMedicine.generic_name,
            strength: foundMedicine.strength.join(', '),
            dosage: foundMedicine.strength[0],
            form: 'Tablet',
            manufacturer: foundMedicine.manufacturer,
            registration_no: foundMedicine.registration_number,
            category: foundMedicine.category,
            indications: foundMedicine.category,
            side_effects: foundMedicine.side_effects.join(', '),
            safety_score: foundMedicine.who_approved ? 95 : 75,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Medicine not found - use AI to suggest alternatives
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('AI service configuration missing');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get some alternatives from database for AI context
    const { data: allMedicines } = await supabase
      .from('medicines')
      .select('name, generic_name, category')
      .limit(20);

    const medicineList = allMedicines?.map(m => `${m.name} (${m.generic_name}) - ${m.category}`).join(', ') || '';

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a pharmaceutical expert. Given a medicine name that is not in the DRAP (Drug Regulatory Authority of Pakistan) database, suggest 2-3 registered alternatives from this list: ${medicineList}. Provide reasoning for each suggestion based on similar therapeutic effects. Keep your response concise and professional.`
          },
          {
            role: 'user',
            content: `Medicine not found in DRAP: "${medicineName}". Suggest alternatives and explain why.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI service error:', aiResponse.status, await aiResponse.text());
      return new Response(
        JSON.stringify({ error: 'Unable to process request. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiSuggestion = aiData.choices[0].message.content;

    // Get top 3 alternatives from database
    const { data: alternatives } = await supabase
      .from('medicines')
      .select('*')
      .limit(3);

    const formattedAlternatives = alternatives?.map(alt => ({
      name: alt.name,
      generic_name: alt.generic_name,
      manufacturer: alt.manufacturer,
      safety_score: alt.who_approved ? 95 : 75,
      dosage: alt.strength[0],
    })) || [];

    // Store verification history for not found
    if (userId) {
      await supabase.from('verification_history').insert({
        user_id: userId,
        medicine_name: medicineName,
        extracted_text: extractedText || medicineName,
        verification_status: 'not_found',
        verified_data: {
          ai_analysis: aiSuggestion,
          alternatives: formattedAlternatives,
        }
      });
    }

    return new Response(
      JSON.stringify({
        found: false,
        verified: false,
        message: "Medicine not found in DRAP database",
        ai_analysis: aiSuggestion,
        alternatives: formattedAlternatives,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to verify medicine. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
