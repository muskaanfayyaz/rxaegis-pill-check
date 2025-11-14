import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import medicinesData from "./medicines.json" with { type: "json" };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting import of ${medicinesData.medicines.length} medicines...`);

    // Transform the JSON data to match database schema
    const transformedMedicines = medicinesData.medicines.map((med: any) => ({
      id: med.id,
      name: med.name,
      generic_name: med.genericName,
      strength: med.strength,
      manufacturer: med.manufacturer,
      registration_number: med.registrationNumber,
      category: med.category,
      authenticity_status: med.authenticityStatus,
      who_approved: med.whoApproved,
      side_effects: med.sideEffects,
      alternatives: med.alternatives,
      barcode: med.barcode
    }));

    // Delete existing medicines first (optional - remove if you want to keep existing data)
    const { error: deleteError } = await supabase
      .from('medicines')
      .delete()
      .neq('id', ''); // Delete all records

    if (deleteError) {
      console.error('Error deleting existing medicines:', deleteError);
    }

    // Insert medicines in batches of 100 to avoid payload size limits
    const batchSize = 100;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedMedicines.length; i += batchSize) {
      const batch = transformedMedicines.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('medicines')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errorCount += batch.length;
      } else {
        insertedCount += data.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${data.length} medicines`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import completed. Inserted: ${insertedCount}, Errors: ${errorCount}`,
        total: medicinesData.medicines.length,
        inserted: insertedCount,
        errors: errorCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

