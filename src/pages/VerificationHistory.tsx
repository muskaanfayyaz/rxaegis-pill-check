import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const VerificationHistory = () => {
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view your verification history",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from('verification_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching verifications:', error);
          toast({
            title: "Error loading history",
            description: "Could not load verification history",
            variant: "destructive",
          });
        } else {
          setRecentVerifications(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, [navigate]);

  return (
    <div className="bg-gradient-hero min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Verification History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your complete medicine verification history
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Past Verifications
            </CardTitle>
            <CardDescription>All your medicine verification checks</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading verification history...</p>
              </div>
            ) : recentVerifications.length > 0 ? (
              <div className="space-y-4">
                {recentVerifications.map((verification) => (
                  <div key={verification.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-muted space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{verification.medicine_name}</h3>
                            {verification.verification_status === 'verified' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(verification.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          verification.verification_status === 'verified' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}>
                          {verification.verification_status === 'verified' ? 'Verified' : 'Not Found'}
                        </span>
                      </div>

                      {verification.verified_data && (
                        <div className="mt-4 space-y-2 text-sm border-t pt-3">
                          {verification.verification_status === 'verified' && verification.verified_data.medicine && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="font-medium">Generic:</span>
                                <p className="text-muted-foreground">{verification.verified_data.medicine.generic_name}</p>
                              </div>
                              <div>
                                <span className="font-medium">Manufacturer:</span>
                                <p className="text-muted-foreground">{verification.verified_data.medicine.manufacturer}</p>
                              </div>
                              <div>
                                <span className="font-medium">Registration:</span>
                                <p className="text-muted-foreground">{verification.verified_data.medicine.registration_number}</p>
                              </div>
                              <div>
                                <span className="font-medium">Category:</span>
                                <p className="text-muted-foreground">{verification.verified_data.medicine.category}</p>
                              </div>
                            </div>
                          )}

                          {verification.verification_status !== 'verified' && verification.verified_data.ai_analysis && (
                            <div className="space-y-2">
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  ⚠️ Not found in DRAP database
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">AI Analysis:</p>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {verification.verified_data.ai_analysis}
                                </p>
                              </div>
                            </div>
                          )}

                          {verification.verified_data.alternatives && verification.verified_data.alternatives.length > 0 && (
                            <div className="space-y-2 border-t pt-3">
                              <p className="font-medium text-sm flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Suggested Alternatives:
                              </p>
                              <div className="space-y-2">
                                {verification.verified_data.alternatives.map((alt: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-background rounded-md border">
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
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No verification history found</p>
                <p className="text-sm mt-2">Start verifying medicines to see your history here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationHistory;
