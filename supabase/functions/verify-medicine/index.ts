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

    // Clean and sanitize the medicine name
    // Keep dosage info but extract the main medicine name
    const cleanName = medicineName
      .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses content
      .replace(/\d+\s*(?:mg|g|ml|mcg|tab|tablet|tablets|cap|capsule|capsules|x)\s*$/i, '') // Remove trailing dosage
      .replace(/\s+(?:for|three|twice|once|take|x\d+|daily|days|morning|evening|night|\d+x).*$/i, '') // Remove dosage instructions at end
      .replace(/[^a-zA-Z0-9\s\-+]/g, '') // Keep alphanumeric, spaces, hyphens, and plus signs
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 100);

    console.log("Cleaned medicine name:", cleanName);

    if (!cleanName || cleanName.length < 2) {
      console.log("Medicine name too short after cleaning");
      return new Response(
        JSON.stringify({
          found: false,
          verified: false,
          message: "Invalid medicine name",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create search patterns - try multiple approaches for better matching
    const searchTerms = [
      cleanName, // Full cleaned name
      cleanName.split(/\s+/)[0], // First word only (brand name)
      ...cleanName.split(/\s+/).filter(word => word.length > 3) // Individual significant words
    ].filter((term, index, self) => self.indexOf(term) === index); // Remove duplicates

    console.log("Search terms:", searchTerms);

    // Search for medicine using multiple strategies
    const searchPromises = searchTerms.slice(0, 3).map(term => 
      Promise.all([
        supabase.from('medicines').select('*').ilike('name', `%${term}%`).limit(10),
        supabase.from('medicines').select('*').ilike('generic_name', `%${term}%`).limit(10)
      ])
    );

    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    const allMedicines = new Map();
    searchResults.forEach(([nameResult, genericResult]) => {
      [...(nameResult.data || []), ...(genericResult.data || [])].forEach(med => {
        allMedicines.set(med.id, med);
      });
    });

    const medicines = Array.from(allMedicines.values());

    if (searchResults.some(([n, g]) => n.error || g.error)) {
      console.error('Database search error');
      return new Response(
        JSON.stringify({ error: 'Unable to verify medicine. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find best match using multiple matching strategies
    let foundMedicine = null;
    if (medicines && medicines.length > 0) {
      // Strategy 1: Exact match (case-insensitive)
      foundMedicine = medicines.find(m => 
        m.name.toLowerCase() === cleanName.toLowerCase() ||
        m.generic_name.toLowerCase() === cleanName.toLowerCase()
      );
      
      // Strategy 2: Exact match on first word (common for brand names)
      if (!foundMedicine) {
        const firstWord = cleanName.split(/\s+/)[0].toLowerCase();
        foundMedicine = medicines.find(m => 
          m.name.toLowerCase() === firstWord ||
          m.name.toLowerCase().startsWith(firstWord + ' ')
        );
      }
      
      // Strategy 3: Contains match with highest relevance
      if (!foundMedicine && medicines.length > 0) {
        // Score each medicine by match quality
        const scored = medicines.map(m => {
          const nameLower = m.name.toLowerCase();
          const genericLower = m.generic_name.toLowerCase();
          const cleanLower = cleanName.toLowerCase();
          
          let score = 0;
          if (nameLower.includes(cleanLower)) score += 10;
          if (genericLower.includes(cleanLower)) score += 8;
          if (cleanLower.includes(nameLower)) score += 7;
          if (cleanLower.includes(genericLower)) score += 6;
          
          // Bonus for shorter matches (more specific)
          if (nameLower.length < cleanLower.length * 1.5) score += 2;
          
          return { medicine: m, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        if (scored[0].score > 0) {
          foundMedicine = scored[0].medicine;
        }
      }
      
      if (foundMedicine) {
        console.log("Found medicine:", foundMedicine.name, "- Generic:", foundMedicine.generic_name);
      } else {
        console.log("No suitable match found among", medicines.length, "candidates");
      }
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

    // Determine the category/therapeutic use for better alternative suggestions
    // Try to infer from the medicine name
    let inferredCategory = 'general medicine';
    const categoryKeywords = {
      'Analgesic': ['paracetamol', 'aspirin', 'pain', 'ache', 'brufen', 'ibuprofen', 'panadol', 'disprin', 'ponstan'],
      'Antibiotic': ['antibiotic', 'amoxicillin', 'azithromycin', 'ciprofloxacin', 'augmentin', 'flagyl', 'levofloxacin'],
      'Antidiabetic': ['diabetic', 'metformin', 'glucophage', 'glimepiride', 'insulin'],
      'Antihypertensive': ['blood pressure', 'hypertension', 'amlodipine', 'losartan', 'enalapril'],
      'Antihistamine': ['allergy', 'cetirizine', 'loratadine', 'zyrtec', 'antihistamine'],
      'PPI': ['acid', 'omeprazole', 'esomeprazole', 'risek', 'nexum', 'heartburn', 'ulcer'],
      'Cold & Flu': ['cold', 'flu', 'cough', 'fever'],
      'Antiemetic': ['nausea', 'vomiting', 'motion sickness'],
      'Bronchodilator': ['asthma', 'breathing', 'inhaler', 'ventolin'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => medicineName.toLowerCase().includes(kw))) {
        inferredCategory = category;
        break;
      }
    }

    console.log("Inferred category:", inferredCategory);

    // Get alternatives from the same category
    const { data: categoryMedicines } = await supabase
      .from('medicines')
      .select('name, generic_name, category')
      .ilike('category', `%${inferredCategory}%`)
      .limit(30);

    // Also get some general medicines as fallback
    const { data: generalMedicines } = await supabase
      .from('medicines')
      .select('name, generic_name, category')
      .limit(20);

    // Deduplicate using name+generic_name combination
    const seenMedicines = new Set();
    const availableMedicines = [...(categoryMedicines || []), ...(generalMedicines || [])]
      .filter((item) => {
        const key = `${item.name}-${item.generic_name}`;
        if (seenMedicines.has(key)) return false;
        seenMedicines.add(key);
        return true;
      });

    const medicineList = availableMedicines.map(m => `${m.name} (${m.generic_name}) - treats ${m.category}`).join('\n') || '';

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
            content: `You are a pharmaceutical expert for Pakistan's DRAP database. When a medicine is not found, suggest 2-3 DRAP-registered alternatives that treat THE SAME ILLNESS or condition. 

CRITICAL: Only suggest alternatives that have the SAME therapeutic use and treat the SAME medical condition. For example:
- If the medicine is for pain relief, only suggest pain relievers
- If it's an antibiotic, only suggest antibiotics for similar infections
- If it's for diabetes, only suggest diabetes medications
- If it's for blood pressure, only suggest blood pressure medications

Available DRAP-registered medicines:
${medicineList}

Format your response as:
1. [Medicine Name] ([Generic Name]) - [Brief reason why it treats the same condition]
2. [Medicine Name] ([Generic Name]) - [Brief reason why it treats the same condition]
3. [Medicine Name] ([Generic Name]) - [Brief reason why it treats the same condition]

Keep explanations brief and focused on therapeutic equivalence.`
          },
          {
            role: 'user',
            content: `Medicine not found in DRAP: "${medicineName}". The medicine appears to be used for: ${inferredCategory}. Suggest alternatives that treat the same condition.`
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

    // Get top alternatives from the same category
    const { data: alternatives } = await supabase
      .from('medicines')
      .select('*')
      .ilike('category', `%${inferredCategory}%`)
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
