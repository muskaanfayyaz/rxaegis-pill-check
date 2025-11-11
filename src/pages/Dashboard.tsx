import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Upload, Camera, Shield, AlertTriangle, CheckCircle, Pill, ScanLine, Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Scanner from "@/components/Scanner";
import CameraCapture from "@/components/CameraCapture";

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [manualSearchQuery, setManualSearchQuery] = useState("");
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

  const handleCameraCapture = async (imageFile: File) => {
    if (!imageFile) return;

    setFile(imageFile);
    setIsScanning(true);
    setOcrText("");
    setVerificationResults([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-extract', {
        body: { imageBase64 },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (ocrError) {
        console.error('OCR Error:', ocrError);
        toast({
          title: "Scan Failed",
          description: "Failed to extract text from image. Please try again.",
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
      
      // Auto-verify with the extracted text immediately
      await verifyMedicineText(extractedText);
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

  const verifyMedicineText = async (textToVerify: string) => {
    if (!textToVerify) {
      toast({
        title: "No data to verify",
        description: "Please provide medicine information first",
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
      // Extract medicine names from text
      const lines = textToVerify.split(/[\n\r]+/).map(m => m.trim()).filter(m => m.length > 0);
      
      // Filter to get only valid medicine names
      const medicines = lines.filter(line => {
        // Remove lines that are clearly not medicine names
        if (line.length < 3) return false;
        if (/^\d+$/.test(line)) return false;
        if (/^[\d\s\-x]+$/.test(line)) return false;
        if (/(tablets?|capsules?|syrup|strip|pack|box)$/i.test(line)) return false;
        if (/^(for|the|and|with|use|take|as|directed|by|doctor|physician)$/i.test(line)) return false;
        return /[a-zA-Z]{3,}/.test(line);
      }).slice(0, 5);

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
      const { data: { session } } = await supabase.auth.getSession();

      for (const medicine of medicines) {
        const { data, error } = await supabase.functions.invoke('verify-medicine', {
          body: { 
            medicineName: medicine,
            extractedText: textToVerify
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) {
          console.error('Verification Error:', error);
          results.push({
            name: medicine,
            status: "error",
            registered: false,
            error: error.message?.includes('Authentication required') ? 'Please log in to verify medicines' : 'Verification failed',
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

  const handleVerify = async () => {
    await verifyMedicineText(ocrText);
  };

  const handleManualSearch = async () => {
    if (!manualSearchQuery.trim()) {
      toast({
        title: "Enter medicine name",
        description: "Please enter a medicine name to search",
        variant: "destructive",
      });
      return;
    }

    setOcrText(manualSearchQuery);
    setVerificationResults([]);
    await verifyMedicineText(manualSearchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
        {/* Premium Hero Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              DRAP Verified System
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-foreground">
            Medicine Verification Hub
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Advanced AI-powered authentication system for pharmaceutical safety
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="shadow-lg border border-border bg-card transition-smooth hover:shadow-xl">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                <Shield className="h-6 w-6 text-primary" />
                Verification Methods
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Multiple ways to verify medicine authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted">
                  <TabsTrigger value="manual" className="text-xs py-3 data-[state=active]:bg-background data-[state=active]:text-foreground font-semibold">
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs py-3 data-[state=active]:bg-background data-[state=active]:text-foreground font-semibold">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="text-xs py-3 data-[state=active]:bg-background data-[state=active]:text-foreground font-semibold">
                    <ScanLine className="h-4 w-4 mr-1" />
                    QR Scan
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="text-xs py-3 data-[state=active]:bg-background data-[state=active]:text-foreground font-semibold">
                    <Camera className="h-4 w-4 mr-1" />
                    Camera
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                    <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-center text-foreground font-medium mb-4">
                      Enter medicine name to verify authenticity
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Paracetamol 500mg"
                        value={manualSearchQuery}
                        onChange={(e) => setManualSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                        className="flex-1 bg-background"
                      />
                      <Button onClick={handleManualSearch} disabled={isVerifying} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-smooth bg-muted/30">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="text-base font-semibold text-foreground">
                        Click to upload prescription or medicine image
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 font-medium">
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
                  <CameraCapture onCapture={handleCameraCapture} />
                </TabsContent>
              </Tabs>

              {isScanning && (
                <div className="p-6 bg-primary/10 rounded-lg text-center border border-primary/30">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-base font-semibold text-foreground">Processing with AI OCR...</p>
                </div>
              )}

              {ocrText && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Extracted Information:
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-sm border border-border font-medium text-foreground">
                    {ocrText}
                  </div>
                  <Button onClick={handleVerify} className="w-full shadow-md hover:shadow-lg transition-smooth bg-primary text-primary-foreground text-base h-11">
                    <Shield className="h-5 w-5 mr-2" />
                    Verify Against DRAP Database
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-lg border border-border bg-card transition-smooth hover:shadow-xl">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                <CheckCircle className="h-6 w-6" />
                Verification Results
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Real-time DRAP database verification
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isVerifying ? (
                <div className="text-center py-16">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full" />
                    <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Analyzing against DRAP database...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </div>
              ) : verificationResults.length > 0 ? (
                <div className="space-y-4">
                  {verificationResults.map((result, idx) => (
                    <div key={idx} className="border-2 rounded-xl overflow-hidden shadow-md transition-smooth hover:shadow-lg bg-card" style={{
                      borderColor: result.registered ? 'hsl(157 44% 43%)' : 'hsl(38 92% 50%)'
                    }}>
                      <div className={`p-5 space-y-4 ${result.registered ? 'bg-success/5' : 'bg-warning/5'}`}>
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            {result.name}
                            {result.registered && (
                              <span className="text-xs bg-success text-success-foreground px-2.5 py-1 rounded-full font-semibold">DRAP Verified</span>
                            )}
                          </h3>
                          {result.registered ? (
                            <CheckCircle className="h-7 w-7 text-success shadow-sm" />
                          ) : (
                            <AlertTriangle className="h-7 w-7 text-warning shadow-sm" />
                          )}
                        </div>

                        {result.found && result.medicine && (
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground block mb-1">Generic:</span>
                                <p className="text-foreground">{result.medicine.generic_name}</p>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground block mb-1">Category:</span>
                                <p className="text-foreground">{result.medicine.category}</p>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground block mb-1">WHO Approved:</span>
                                <p className="text-foreground">{result.medicine.who_approved ? 'Yes' : 'No'}</p>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground block mb-1">Status:</span>
                                <p className="text-foreground">{result.medicine.authenticity_status}</p>
                              </div>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <span className="font-semibold text-foreground block mb-1">Manufacturer:</span>
                              <p className="text-foreground">{result.medicine.manufacturer}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <span className="font-semibold text-foreground block mb-1">Registration:</span>
                              <p className="text-foreground">{result.medicine.registration_number}</p>
                            </div>
                            {result.medicine.side_effects && result.medicine.side_effects.length > 0 && (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground block mb-1">Side Effects:</span>
                                <p className="text-foreground">{result.medicine.side_effects.join(', ')}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {!result.found && (
                          <div className="space-y-3">
                            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                              <p className="text-sm font-semibold text-foreground">
                                ⚠️ Not found in DRAP database
                              </p>
                            </div>

                            {result.ai_analysis && (
                              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                                <p className="font-semibold text-sm text-foreground">AI Analysis:</p>
                                <p className="text-sm text-foreground whitespace-pre-line">
                                  {result.ai_analysis}
                                </p>
                              </div>
                            )}

                            {result.alternatives && result.alternatives.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                  <Pill className="h-4 w-4" />
                                  Suggested Alternatives:
                                </p>
                                <div className="space-y-2">
                                  {result.alternatives.map((alt: any, altIdx: number) => (
                                  <div key={altIdx} className="p-3 bg-muted/50 rounded-lg border border-border">
                                    <div className="flex items-start justify-between mb-1">
                                      <p className="font-semibold text-sm text-foreground">{alt.name}</p>
                                      <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded font-medium">
                                        {alt.category}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground">
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
                <div className="text-center py-16">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <Shield className="h-20 w-20 mx-auto text-muted-foreground/20" />
                    <Sparkles className="absolute top-0 right-0 h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-base">No verification performed yet</p>
                  <p className="text-sm mt-2 text-muted-foreground font-medium">Use any method to verify medicines</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Past Checks */}
        <Card className="mt-8 shadow-lg border border-border bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-foreground text-xl">
              <Pill className="h-6 w-6 text-primary" />
              Recent Verifications
            </CardTitle>
            <CardDescription className="font-medium">Your complete prescription check history</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {recentVerifications.map((verification) => (
                  <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-smooth bg-muted/30 border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{verification.medicine_name}</p>
                        {verification.verification_status === 'verified' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
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
                      <span className={`px-3 py-1.5 rounded-full font-semibold shadow-sm ${
                        verification.verification_status === 'verified' 
                          ? 'bg-success text-success-foreground'
                          : 'bg-warning text-warning-foreground'
                      }`}>
                        {verification.verification_status === 'verified' ? '✓ Verified' : '⚠ Not Found'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                <p className="font-semibold text-foreground">No verification history yet</p>
                <p className="text-sm mt-2 text-muted-foreground font-medium">Start verifying medicines to build your history</p>
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
