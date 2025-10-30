import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsScanning(true);

    // TODO: Implement OCR with Tesseract.js
    setTimeout(() => {
      setOcrText("Sample extracted text: Paracetamol 500mg, Take 1 tablet every 6 hours");
      setIsScanning(false);
      toast({
        title: "OCR Complete",
        description: "Text extracted successfully",
      });
    }, 2000);
  };

  const handleVerify = async () => {
    if (!ocrText) {
      toast({
        title: "No data to verify",
        description: "Please upload a prescription first",
        variant: "destructive",
      });
      return;
    }

    // TODO: Call verification API
    toast({
      title: "Verification started",
      description: "Checking medicines against DRAP database",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Medicine Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Upload prescriptions or scan medicine packages to verify authenticity
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload & Scan
              </CardTitle>
              <CardDescription>
                Upload prescription or capture medicine image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="camera">Use Camera</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG, PDF up to 10MB
                      </p>
                    </label>
                  </div>
                  {file && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="camera" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Camera feature coming soon
                    </p>
                    <Button variant="outline" size="sm">
                      Open Camera
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {isScanning && (
                <div className="p-4 bg-secondary/10 rounded-lg text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm">Scanning document...</p>
                </div>
              )}

              {ocrText && (
                <div className="space-y-2">
                  <Label>Extracted Text:</Label>
                  <div className="p-4 bg-muted rounded-lg text-sm">
                    {ocrText}
                  </div>
                  <Button onClick={handleVerify} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Medicines
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Verification Results
              </CardTitle>
              <CardDescription>
                Medicine safety and authenticity check
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Upload a prescription to see verification results</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Past Checks */}
        <Card className="mt-6 shadow-md">
          <CardHeader>
            <CardTitle>Recent Verifications</CardTitle>
            <CardDescription>Your prescription check history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No previous checks found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium">{children}</label>
);

export default Dashboard;
