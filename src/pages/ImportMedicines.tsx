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

    try {
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
        barcode: med.barcode,
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
          .insert(batch)
          .select();

        if (error) {
          console.error(`Error inserting batch ${batchNumber}:`, error);
          errorCount += batch.length;
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
