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
      toast({
        title: "OCR Complete",
        description: "Text extracted successfully. Click 'Verify Medicines' to check.",
      });
      
      // Auto-verify after OCR
      await handleVerify();
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
    await handleVerify();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl">
        {/* Premium Hero Section */}
        <div className="mb-8 sm:mb-12 text-center relative">
          <div className="absolute inset-0 bg-gradient-premium opacity-10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-accent rounded-full mb-4 shadow-md">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">
                DRAP Verified System
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Medicine Verification Hub
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced AI-powered authentication system for pharmaceutical safety
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="shadow-xl border-2 border-primary/10 glass transition-smooth hover:shadow-glow">
            <CardHeader className="bg-gradient-accent">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="h-6 w-6" />
                Verification Methods
              </CardTitle>
              <CardDescription className="text-sm">
                Multiple ways to verify medicine authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                  <TabsTrigger value="manual" className="text-xs py-2">
                    <Search className="h-3 w-3 mr-1" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs py-2">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="text-xs py-2">
                    <ScanLine className="h-3 w-3 mr-1" />
                    QR Scan
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="text-xs py-2">
                    <Camera className="h-3 w-3 mr-1" />
                    Camera
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-primary/30 rounded-lg bg-gradient-accent">
                    <Search className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-center text-muted-foreground mb-4">
                      Enter medicine name to verify authenticity
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Paracetamol 500mg"
                        value={manualSearchQuery}
                        onChange={(e) => setManualSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                        className="flex-1"
                      />
                      <Button onClick={handleManualSearch} disabled={isVerifying}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary transition-smooth bg-gradient-accent">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload prescription or medicine image
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
                  <CameraCapture onCapture={handleCameraCapture} />
                </TabsContent>
              </Tabs>

              {isScanning && (
                <div className="p-4 bg-gradient-accent rounded-lg text-center border border-primary/20">
                  <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm font-medium">Processing with AI OCR...</p>
                </div>
              )}

              {ocrText && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Extracted Information:
                  </div>
                  <div className="p-4 bg-gradient-card rounded-lg text-sm border border-primary/20">
                    {ocrText}
                  </div>
                  <Button onClick={handleVerify} className="w-full shadow-md hover:shadow-glow transition-smooth">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Against DRAP Database
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-xl border-2 border-secondary/10 glass transition-smooth hover:shadow-glow">
            <CardHeader className="bg-gradient-accent">
              <CardTitle className="flex items-center gap-2 text-secondary">
                <CheckCircle className="h-6 w-6" />
                Verification Results
              </CardTitle>
              <CardDescription className="text-sm">
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
                  <p className="text-sm font-medium">Analyzing against DRAP database...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a few moments</p>
                </div>
              ) : verificationResults.length > 0 ? (
                <div className="space-y-4">
                  {verificationResults.map((result, idx) => (
                    <div key={idx} className="border-2 rounded-xl overflow-hidden shadow-md transition-smooth hover:shadow-lg" style={{
                      borderColor: result.registered ? 'hsl(157 44% 43%)' : 'hsl(38 92% 50%)'
                    }}>
                      <div className={`p-5 space-y-4 ${result.registered ? 'bg-gradient-card' : 'bg-warning/5'}`}>
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {result.name}
                            {result.registered && (
                              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">DRAP Verified</span>
                            )}
                          </h3>
                          {result.registered ? (
                            <CheckCircle className="h-7 w-7 text-success shadow-sm" />
                          ) : (
                            <AlertTriangle className="h-7 w-7 text-warning shadow-sm" />
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
                                <span className="font-medium">Category:</span>
                                <p className="text-muted-foreground">{result.medicine.category}</p>
                              </div>
                              <div>
                                <span className="font-medium">WHO Approved:</span>
                                <p className="text-muted-foreground">{result.medicine.who_approved ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <p className="text-muted-foreground">{result.medicine.authenticity_status}</p>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Manufacturer:</span>
                              <p className="text-muted-foreground">{result.medicine.manufacturer}</p>
                            </div>
                            <div>
                              <span className="font-medium">Registration:</span>
                              <p className="text-muted-foreground">{result.medicine.registration_number}</p>
                            </div>
                            {result.medicine.side_effects && result.medicine.side_effects.length > 0 && (
                              <div>
                                <span className="font-medium">Side Effects:</span>
                                <p className="text-muted-foreground">{result.medicine.side_effects.join(', ')}</p>
                              </div>
                            )}
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
                                        {alt.category}
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
                <div className="text-center py-16 text-muted-foreground">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <Shield className="h-20 w-20 mx-auto opacity-10" />
                    <Sparkles className="absolute top-0 right-0 h-6 w-6 text-primary opacity-50" />
                  </div>
                  <p className="font-medium">No verification performed yet</p>
                  <p className="text-sm mt-2">Use any method to verify medicines</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Past Checks */}
        <Card className="mt-8 shadow-xl border-2 border-accent/10 glass">
          <CardHeader className="bg-gradient-accent">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-accent" />
              Recent Verifications
            </CardTitle>
            <CardDescription>Your complete prescription check history</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {recentVerifications.map((verification) => (
                  <div key={verification.id} className="flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md transition-smooth bg-gradient-card">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{verification.medicine_name}</p>
                        {verification.verification_status === 'verified' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
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
                      <span className={`px-3 py-1.5 rounded-full font-medium shadow-sm ${
                        verification.verification_status === 'verified' 
                          ? 'bg-success/20 text-success border border-success/30'
                          : 'bg-warning/20 text-warning border border-warning/30'
                      }`}>
                        {verification.verification_status === 'verified' ? '✓ Verified' : '⚠ Not Found'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="font-medium">No verification history yet</p>
                <p className="text-sm mt-2">Start verifying medicines to build your history</p>
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
