import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicineName, userId } = await req.json();
    
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

    // Check if medicine exists in DRAP database
    const { data: medicines, error: dbError } = await supabase
      .from('medicines')
      .select('*')
      .or(`name.ilike.%${medicineName}%,generic_name.ilike.%${medicineName}%`)
      .limit(1);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to query medicines database');
    }

    let verificationResult;
    
    if (medicines && medicines.length > 0) {
      const foundMedicine = medicines[0];
      
      // Calculate safety score based on side effects
      const safetyScore = Math.max(70, 100 - (foundMedicine.side_effects?.length || 0) * 5);
      
      verificationResult = {
        found: true,
        verified: true,
        medicine: {
          name: foundMedicine.name,
          generic_name: foundMedicine.generic_name,
          dosage: foundMedicine.strength.join(', '),
          form: "Tablet",
          manufacturer: foundMedicine.manufacturer,
          registration_no: foundMedicine.registration_number,
          category: foundMedicine.category,
          indications: foundMedicine.category,
          side_effects: foundMedicine.side_effects.join(', '),
          safety_score: safetyScore,
          who_approved: foundMedicine.who_approved,
          alternatives: foundMedicine.alternatives,
        },
      };

      // Store verification in history if userId provided
      if (userId) {
        await supabase
          .from('verification_history')
          .insert({
            user_id: userId,
            medicine_name: medicineName,
            extracted_text: medicineName,
            verification_status: 'verified',
            verified_data: verificationResult,
          });
      }

      return new Response(
        JSON.stringify(verificationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Medicine not found - use AI to suggest alternatives
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get some sample medicines for AI context
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
            content: `You are a pharmaceutical expert. Given a medicine name that is not in the DRAP (Drug Regulatory Authority of Pakistan) database, suggest 2-3 registered alternatives from this list: ${medicineList}. Provide brief reasoning for each suggestion based on similar therapeutic effects.`
          },
          {
            role: 'user',
            content: `Medicine not found in DRAP: "${medicineName}". Suggest alternatives and explain why in 2-3 sentences.`
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

    // Get top 3 alternatives from DRAP database
    const { data: alternatives } = await supabase
      .from('medicines')
      .select('*')
      .limit(3);

    const altList = alternatives?.map(med => ({
      name: med.name,
      generic_name: med.generic_name,
      manufacturer: med.manufacturer,
      safety_score: Math.max(70, 100 - (med.side_effects?.length || 0) * 5),
    })) || [];

    verificationResult = {
      found: false,
      verified: false,
      message: "Medicine not found in DRAP database",
      ai_analysis: aiSuggestion,
      alternatives: altList,
    };

    // Store verification in history if userId provided
    if (userId) {
      await supabase
        .from('verification_history')
        .insert({
          user_id: userId,
          medicine_name: medicineName,
          extracted_text: medicineName,
          verification_status: 'not_found',
          verified_data: verificationResult,
        });
    }

    return new Response(
      JSON.stringify(verificationResult),
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
