import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface ScannerProps {
  onScanComplete?: (result: { text: string; format: string }) => void;
}

const Scanner = ({ onScanComplete }: ScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const elementId = "qr-reader";

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const verifyMedicine = async (barcode: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Search for medicine by barcode in the medicines table
      const { data: medicine, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error searching medicine:', error);
        throw error;
      }

      if (medicine) {
        // Medicine found - it's authentic
        setVerificationResult({
          status: 'authentic',
          medicine: medicine,
          message: '✅ AUTHENTIC MEDICINE VERIFIED',
          details: `This medicine is registered in the DRAP database and is safe to use. 
          
Verified Details:
• Medicine: ${medicine.name}
• Generic: ${medicine.generic_name}
• Manufacturer: ${medicine.manufacturer}
• Registration: ${medicine.registration_number}
• Category: ${medicine.category}
• WHO Approved: ${medicine.who_approved ? 'Yes' : 'No'}

This product has been verified against Pakistan's official drug regulatory database.`
        });

        toast({
          title: "✅ Authentic Medicine",
          description: `${medicine.name} verified successfully`,
        });
      } else {
        // Medicine not found - potentially counterfeit
        setVerificationResult({
          status: 'counterfeit',
          message: '⚠️ WARNING: POTENTIAL COUNTERFEIT DETECTED',
          details: `This medicine's barcode (${barcode}) is NOT registered in the DRAP (Drug Regulatory Authority of Pakistan) database.

⚠️ CRITICAL WARNINGS:
• This product may be counterfeit or unregistered
• Using unverified medicines can be extremely dangerous
• Counterfeit drugs may contain harmful ingredients
• They may not contain the correct dosage or active ingredients
• Can lead to treatment failure or serious health complications

🛡️ RECOMMENDED ACTIONS:
1. DO NOT use this medicine
2. Report to DRAP immediately
3. Return to the pharmacy/supplier
4. Consult with your healthcare provider
5. Purchase medicines only from licensed pharmacies

📞 Report Counterfeit Medicines:
• DRAP Helpline: 111-332-111
• Email: complaint@dra.gov.pk

Your safety is our priority. Always verify medicines before use.`
        });

        toast({
          title: "⚠️ Counterfeit Warning",
          description: "Medicine not found in DRAP database",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScan = async (decodedText: string, decodedResult: any) => {
    console.log("Scan result:", decodedText);
    
    // Immediately verify the scanned barcode
    await verifyMedicine(decodedText);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await (supabase as any)
          .from("scan_history")
          .insert({
            user_id: user.id,
            scan_data: decodedText,
            scan_format: decodedResult.result?.format?.formatName || "QR_CODE",
            scanned_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Error saving scan:", error);
        }
      }

      if (onScanComplete) {
        onScanComplete({
          text: decodedText,
          format: decodedResult.result?.format?.formatName || "QR_CODE",
        });
      }
    } catch (error) {
      console.error("Error processing scan:", error);
    }
  };

  const startScanner = async () => {
    try {
      setVerificationResult(null);
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        (error) => {
          // Continuous scanning - errors are expected
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast({
        title: "Scanner Error",
        description: "Could not start scanner. Please check camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setVerificationResult(null);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div id={elementId} className="w-full rounded-lg overflow-hidden border-2 border-border" />
      
      {isVerifying && (
        <Card className="p-4 bg-secondary/10">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Verifying medicine in DRAP database...</p>
          </div>
        </Card>
      )}

      {verificationResult && (
        <Card className={`p-6 ${
          verificationResult.status === 'authentic' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-600' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-600'
        }`}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {verificationResult.status === 'authentic' ? (
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  verificationResult.status === 'authentic' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {verificationResult.message}
                </h3>
                <div className={`text-sm whitespace-pre-line ${
                  verificationResult.status === 'authentic' 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {verificationResult.details}
                </div>
              </div>
            </div>

            {verificationResult.medicine && (
              <div className="mt-4 p-4 bg-background rounded-md space-y-2">
                <h4 className="font-semibold text-sm">Additional Information:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Dosage Form:</span>
                    <p className="text-muted-foreground">{verificationResult.medicine.category}</p>
                  </div>
                  <div>
                    <span className="font-medium">WHO Approved:</span>
                    <p className="text-muted-foreground">
                      {verificationResult.medicine.who_approved ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          onClick={startScanner}
          disabled={isScanning}
          className="flex-1"
        >
          {isScanning ? "Scanning..." : "Start Scanner"}
        </Button>
        {isScanning && (
          <Button onClick={stopScanner} variant="destructive">
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  );
};

export default Scanner;
