import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import medicinesData from "@/data/medicines.json";

const ImportMedicines = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const { toast } = useToast();

  const importMedicines = async () => {
    setIsImporting(true);
    setProgress("Starting import...");

    // Prefer server-side import to bypass RLS
    try {
      setProgress("Invoking backend import...");
      const { data: fnData, error: fnError } = await supabase.functions.invoke('import-medicines', { body: {} });
      if (!fnError && (fnData as any)?.success) {
        const d = fnData as any;
        setProgress(`Import completed! Inserted: ${d.inserted}, Errors: ${d.errors}`);
        toast({
          title: "Import Complete",
          description: `Imported ${d.inserted} medicines. Errors: ${d.errors}`,
        });
        setIsImporting(false);
        return;
      }
    } catch (e) {
      console.warn('Edge function import failed, falling back to client import.', e);
    }

    try {
      // Normalize and transform the JSON data to match database schema
      const toTextArray = (v: any): string[] => {
        if (Array.isArray(v)) return v.map((x) => String(x));
        if (v === null || v === undefined || v === "") return [];
        return [String(v)];
      };

      const transformedMedicines = medicinesData.medicines.map((med: any) => ({
        id: String(med.id ?? "").trim(),
        name: String(med.name ?? "").trim(),
        generic_name: String(med.genericName ?? med.generic_name ?? "").trim(),
        strength: toTextArray(med.strength),
        manufacturer: String(med.manufacturer ?? "").trim(),
        registration_number: String(med.registrationNumber ?? "").trim(),
        category: String(med.category ?? "general medicine").trim(),
        authenticity_status: String(med.authenticityStatus ?? "unknown").trim(),
        who_approved: med.whoApproved === true,
        side_effects: toTextArray(med.sideEffects),
        alternatives: toTextArray(med.alternatives),
        barcode: String(med.barcode ?? "").trim(),
      }));

      setProgress(`Preparing to import ${transformedMedicines.length} medicines...`);

      // Delete existing medicines first
      setProgress("Clearing existing medicines...");
      const { error: deleteError } = await supabase
        .from("medicines")
        .delete()
        .neq("id", "");

      if (deleteError) {
        console.error("Error deleting existing medicines:", deleteError);
      }

      // Insert medicines in batches of 100
      const batchSize = 100;
      let insertedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < transformedMedicines.length; i += batchSize) {
        const batch = transformedMedicines.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(transformedMedicines.length / batchSize);

        setProgress(
          `Importing batch ${batchNumber} of ${totalBatches} (${insertedCount}/${transformedMedicines.length})...`
        );

        const { data, error } = await supabase
          .from("medicines")
          .upsert(batch, { onConflict: "id" })
          .select();

        if (error) {
          console.error(`Error inserting batch ${batchNumber}:`, error);
          console.error(`Failed medicine IDs:`, batch.map(m => m.id).join(", "));
          errorCount += batch.length;
          
          // Try inserting one by one to find which specific records fail
          for (const medicine of batch) {
            const { data: singleData, error: singleError } = await supabase
              .from("medicines")
              .upsert([medicine], { onConflict: "id" })
              .select();
            
            if (singleError) {
              console.error(`Failed to insert ${medicine.id} (${medicine.name}):`, singleError.message);
            } else if (singleData) {
              insertedCount++;
              errorCount--;
            }
          }
        } else if (data) {
          insertedCount += data.length;
        }
      }

      setProgress(
        `Import completed! Inserted: ${insertedCount}, Errors: ${errorCount}`
      );

      toast({
        title: "Import Complete",
        description: `Successfully imported ${insertedCount} medicines. Errors: ${errorCount}`,
      });
    } catch (error) {
      console.error("Import error:", error);
      setProgress(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({
        title: "Import Failed",
        description: "An error occurred during import. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Import Medicines</h1>
        <p className="text-muted-foreground mb-6">
          This utility will import all medicines from the medicines.json file into
          the database. Any existing medicines will be replaced.
        </p>

        <div className="space-y-4">
          <Button
            onClick={importMedicines}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? "Importing..." : "Start Import"}
          </Button>

          {progress && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono">{progress}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ImportMedicines;
