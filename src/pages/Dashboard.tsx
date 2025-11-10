import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, Shield, AlertTriangle, CheckCircle, Pill, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Scanner from "@/components/Scanner";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchRecentVerifications(user.id);
      }
    };
    getUser();
  }, []);

  const fetchRecentVerifications = async (uid: string) => {
    const { data, error } = await supabase
      .from('verification_history')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentVerifications(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPEG, PNG, or WebP)",
        variant: "destructive",
      });
      return;
    }

    // Client-side size check
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    setIsScanning(true);
    setOcrText("");
    setVerificationResults([]);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(uploadedFile);
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      // Get authentication session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call OCR edge function
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-extract', {
        body: { imageBase64 },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (ocrError) {
        console.error('OCR Error:', ocrError);
        let errorMessage = "Failed to extract text from image. Please try again.";
        
        if (ocrError.message?.includes('Authentication required')) {
          errorMessage = "Please log in to use this feature.";
        } else if (ocrError.message?.includes('too large')) {
          errorMessage = "Image is too large. Please use an image smaller than 10MB.";
        }
        
        toast({
          title: "Scan Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      const extractedText = ocrData?.extractedText || '';
      
      if (!extractedText) {
        toast({
          title: "No text found",
          description: "Could not extract text from the image",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      setOcrText(extractedText);
      setIsScanning(false);
      toast({
        title: "OCR Complete",
        description: "Text extracted successfully",
      });
    } catch (error) {
      console.error('OCR error:', error);
      setIsScanning(false);
      toast({
        title: "OCR Failed",
        description: "Could not extract text from image",
        variant: "destructive",
      });
    }
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

    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to verify medicines",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    toast({
      title: "Verification started",
      description: "Checking medicines against DRAP database",
    });

    try {
      // Extract medicine names from OCR text
      const lines = ocrText.split(/[\n\r]+/).map(m => m.trim()).filter(m => m.length > 0);
      
      // Filter to get only valid medicine names
      const medicines = lines.filter(line => {
        // Remove lines that are clearly not medicine names
        if (line.length < 3) return false;
        if (/^\d+$/.test(line)) return false; // Only numbers
        if (/^[\d\s\-x]+$/.test(line)) return false; // Only numbers, spaces, dashes, x
        if (/(tablets?|capsules?|syrup|strip|pack|box)$/i.test(line)) return false; // Ends with common non-medicine words
        if (/^(for|the|and|with|use|take|as|directed|by|doctor|physician)$/i.test(line)) return false; // Common instruction words
        
        // Must contain at least 3 letters
        return /[a-zA-Z]{3,}/.test(line);
      }).slice(0, 5); // Limit to 5 medicines

      if (medicines.length === 0) {
        toast({
          title: "No medicines found",
          description: "Could not extract medicine names from text",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      const results = [];

      // Get authentication session
      const { data: { session } } = await supabase.auth.getSession();

      for (const medicine of medicines) {
        const { data, error } = await supabase.functions.invoke('verify-medicine', {
          body: { 
            medicineName: medicine,
            extractedText: ocrText
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) {
          console.error('Verification Error:', error);
          let errorMessage = 'Verification failed';
          
          if (error.message?.includes('Authentication required')) {
            errorMessage = 'Please log in to verify medicines';
          }
          
          results.push({
            name: medicine,
            status: "error",
            registered: false,
            error: errorMessage,
          });
        } else {
          results.push({
            name: medicine,
            status: data.found ? "verified" : "not_found",
            registered: data.verified,
            ...data,
          });
        }
      }

      setVerificationResults(results);
      setIsVerifying(false);
      
      // Refresh recent verifications
      fetchRecentVerifications(userId);
      
      toast({
        title: "Verification complete",
        description: `Checked ${results.length} medicine(s)`,
      });
    } catch (error) {
      console.error('Verification error:', error);
      setIsVerifying(false);
      toast({
        title: "Verification failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gradient-hero">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Medicine Verification Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload prescriptions or scan medicine packages to verify authenticity
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="qr">QR Scanner</TabsTrigger>
                  <TabsTrigger value="camera">Camera</TabsTrigger>
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

                <TabsContent value="qr" className="space-y-4">
                  <Scanner onScanComplete={(result) => {
                    toast({
                      title: "Scan Complete",
                      description: `Scanned: ${result.text.substring(0, 50)}...`,
                    });
                  }} />
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
              {isVerifying ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Verifying medicines...</p>
                </div>
              ) : verificationResults.length > 0 ? (
                <div className="space-y-4">
                  {verificationResults.map((result, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="p-4 bg-muted space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{result.name}</h3>
                          {result.registered ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>

                        {result.found && result.medicine && (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">Generic:</span>
                                <p className="text-muted-foreground">{result.medicine.generic_name}</p>
                              </div>
                              <div>
                                <span className="font-medium">Dosage:</span>
                                <p className="text-muted-foreground">{result.medicine.dosage}</p>
                              </div>
                              <div>
                                <span className="font-medium">Form:</span>
                                <p className="text-muted-foreground">{result.medicine.form}</p>
                              </div>
                              <div>
                                <span className="font-medium">Safety Score:</span>
                                <p className="text-muted-foreground">{result.medicine.safety_score}/100</p>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Manufacturer:</span>
                              <p className="text-muted-foreground">{result.medicine.manufacturer}</p>
                            </div>
                            <div>
                              <span className="font-medium">Registration:</span>
                              <p className="text-muted-foreground">{result.medicine.registration_no}</p>
                            </div>
                            <div>
                              <span className="font-medium">Indications:</span>
                              <p className="text-muted-foreground">{result.medicine.indications}</p>
                            </div>
                            <div>
                              <span className="font-medium">Side Effects:</span>
                              <p className="text-muted-foreground">{result.medicine.side_effects}</p>
                            </div>
                          </div>
                        )}

                        {!result.found && (
                          <div className="space-y-3">
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                ⚠️ Not found in DRAP database
                              </p>
                            </div>

                            {result.ai_analysis && (
                              <div className="space-y-2">
                                <p className="font-medium text-sm">AI Analysis:</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {result.ai_analysis}
                                </p>
                              </div>
                            )}

                            {result.alternatives && result.alternatives.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <Pill className="h-4 w-4" />
                                  Suggested Alternatives:
                                </p>
                                <div className="space-y-2">
                                  {result.alternatives.map((alt: any, altIdx: number) => (
                                    <div key={altIdx} className="p-3 bg-background rounded-md border">
                                      <div className="flex items-start justify-between mb-1">
                                        <p className="font-medium text-sm">{alt.name}</p>
                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                          Score: {alt.safety_score}/100
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {alt.generic_name} - {alt.manufacturer}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Upload a prescription to see verification results</p>
                </div>
              )}
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
            {recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {recentVerifications.map((verification) => (
                  <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{verification.medicine_name}</p>
                        {verification.verification_status === 'verified' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(verification.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        verification.verification_status === 'verified' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {verification.verification_status === 'verified' ? 'Verified' : 'Not Found'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No previous checks found</p>
              </div>
            )}
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
