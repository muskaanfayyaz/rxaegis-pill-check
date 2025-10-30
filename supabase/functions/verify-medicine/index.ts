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
    const { medicineName, userId, extractedText } = await req.json();
    
    if (!medicineName) {
      return new Response(
        JSON.stringify({ error: "Medicine name is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying medicine:", medicineName);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean medicine name: extract only the medicine name, remove instructions
    // Split by comma to separate medicine name from dosage instructions
    const firstPart = medicineName.split(',')[0];
    
    const cleanName = firstPart
      .replace(/\d+\s*(mg|g|ml|mcg|iu|tablets?|capsules?|x)/gi, '') // Remove dosages
      .replace(/\(.*?\)/g, '') // Remove text in parentheses
      .replace(/\b(tablets?|capsules?|syrup|injection|ip|bp|usp|daily|times|days|take|with|after|before|food|water|morning|evening|night|do|not|skip|any)\b/gi, '') // Remove common instruction words
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 2) // Filter out short words
      .slice(0, 3) // Take only first 3 words (medicine names are typically 1-3 words)
      .join(' ');

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

    // Search for medicine in database by name or generic name
    const { data: medicines, error: searchError } = await supabase
      .from('medicines')
      .select('*')
      .or(`name.ilike.%${cleanName}%,generic_name.ilike.%${cleanName}%`)
      .limit(5);

    if (searchError) {
      console.error('Database search error:', searchError);
      throw new Error('Failed to search medicines database');
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
      throw new Error('LOVABLE_API_KEY not configured');
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
      console.error('AI API error:', aiResponse.status);
      throw new Error('Failed to get AI suggestions');
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
    console.error('Error in verify-medicine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
