import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScanHistoryItem {
  id: string;
  scan_data: string;
  scan_format: string;
  scanned_at: string;
}

const ScanHistory = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchScans();
  }, []);

  const checkAuthAndFetchScans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      await fetchScanHistory();
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const fetchScanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_history" as any)
        .select("*")
        .order("scanned_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setScans(data as any || []);
    } catch (error) {
      console.error("Error fetching scan history:", error);
      toast({
        title: "Error",
        description: "Failed to load scan history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Scan History</h1>
        <p className="text-muted-foreground mt-2">View all your previous scans</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading scan history...</p>
          </CardContent>
        </Card>
      ) : scans.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No scans yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start scanning QR codes or barcodes to build your history
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan) => (
            <Card key={scan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {scan.scan_format || "Unknown Format"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(scan.scanned_at)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm break-all">{scan.scan_data}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
