import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dummy DRAP database
const DRAP_MEDICINES = [
  {
    name: "Paracetamol 500mg",
    generic_name: "Paracetamol",
    registered: true,
    manufacturer: "GSK Pakistan",
    registration_no: "054321",
    dosage: "500mg",
    form: "Tablet",
    indications: "Fever, Pain relief",
    side_effects: "Rare: Liver damage with overdose",
    safety_score: 95,
  },
  {
    name: "Augmentin 625mg",
    generic_name: "Amoxicillin + Clavulanic Acid",
    registered: true,
    manufacturer: "GlaxoSmithKline",
    registration_no: "041256",
    dosage: "625mg",
    form: "Tablet",
    indications: "Bacterial infections",
    side_effects: "Diarrhea, nausea, skin rash",
    safety_score: 88,
  },
  {
    name: "Brufen 400mg",
    generic_name: "Ibuprofen",
    registered: true,
    manufacturer: "Abbott Laboratories",
    registration_no: "038912",
    dosage: "400mg",
    form: "Tablet",
    indications: "Pain, inflammation, fever",
    side_effects: "Stomach upset, heartburn",
    safety_score: 85,
  },
  {
    name: "Arinac Forte",
    generic_name: "Paracetamol + Pseudoephedrine",
    registered: true,
    manufacturer: "Hilton Pharma",
    registration_no: "052341",
    dosage: "500mg + 30mg",
    form: "Tablet",
    indications: "Cold, flu symptoms",
    side_effects: "Drowsiness, dry mouth",
    safety_score: 82,
  },
  {
    name: "Flagyl 400mg",
    generic_name: "Metronidazole",
    registered: true,
    manufacturer: "Sanofi",
    registration_no: "045678",
    dosage: "400mg",
    form: "Tablet",
    indications: "Bacterial and parasitic infections",
    side_effects: "Metallic taste, nausea",
    safety_score: 87,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicineName } = await req.json();
    
    if (!medicineName) {
      return new Response(
        JSON.stringify({ error: "Medicine name is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying medicine:", medicineName);

    // Check if medicine exists in DRAP database
    const foundMedicine = DRAP_MEDICINES.find(med => 
      med.name.toLowerCase().includes(medicineName.toLowerCase()) ||
      med.generic_name.toLowerCase().includes(medicineName.toLowerCase())
    );

    if (foundMedicine) {
      // Medicine found in DRAP
      return new Response(
        JSON.stringify({
          found: true,
          verified: true,
          medicine: foundMedicine,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Medicine not found - use AI to suggest alternatives
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `You are a pharmaceutical expert. Given a medicine name that is not in the DRAP (Drug Regulatory Authority of Pakistan) database, suggest 2-3 registered alternatives from this list: ${DRAP_MEDICINES.map(m => m.generic_name).join(', ')}. Provide reasoning for each suggestion based on similar therapeutic effects.`
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

    // Get top 2 alternatives from DRAP database
    const alternatives = DRAP_MEDICINES.slice(0, 2);

    return new Response(
      JSON.stringify({
        found: false,
        verified: false,
        message: "Medicine not found in DRAP database",
        ai_analysis: aiSuggestion,
        alternatives: alternatives,
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
