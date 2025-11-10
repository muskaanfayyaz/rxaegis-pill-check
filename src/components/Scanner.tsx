import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ScanResult {
  text: string;
  format: string;
  timestamp: Date;
}

interface ScannerProps {
  onScanComplete?: (result: ScanResult) => void;
}

const Scanner = ({ onScanComplete }: ScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        setError("No camera found on your device");
        return;
      }

      const selectedCamera = devices[0].id;
      setCameraId(selectedCamera);

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText, decodedResult) => {
          const result: ScanResult = {
            text: decodedText,
            format: decodedResult.result.format?.formatName || "Unknown",
            timestamp: new Date(),
          };

          setScanResult(result);
          await saveScanToHistory(result);
          
          if (onScanComplete) {
            onScanComplete(result);
          }

          scanner.stop().catch(console.error);
          setIsScanning(false);
          
          toast({
            title: "Scan Successful",
            description: "Code scanned and saved to history",
          });
        },
        (errorMessage) => {
          // Scanning in progress, no action needed
        }
      );

      setIsScanning(true);
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      console.error("Scanner error:", err);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  };

  const saveScanToHistory = async (result: ScanResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const { error } = await supabase
        .from("scan_history")
        .insert({
          user_id: user.id,
          scan_data: result.text,
          scan_format: result.format,
          scanned_at: result.timestamp.toISOString(),
        });

      if (error) {
        console.error("Error saving scan:", error);
      }
    } catch (err) {
      console.error("Failed to save scan:", err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR & Barcode Scanner
        </CardTitle>
        <CardDescription>
          Scan QR codes or barcodes to extract medicine information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !scanResult && (
          <Button onClick={startScanning} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          </div>
        )}

        {scanResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-success/10 text-success rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Scan Successful!</p>
                <p className="text-xs mt-1 opacity-80">Format: {scanResult.format}</p>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Scanned Data:</p>
              <p className="text-sm break-all">{scanResult.text}</p>
            </div>

            <Button 
              onClick={() => {
                setScanResult(null);
                startScanning();
              }} 
              className="w-full"
            >
              Scan Another Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Scanner;
