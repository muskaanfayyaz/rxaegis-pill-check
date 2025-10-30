import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, AlertTriangle, CheckCircle, Globe, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero border-b">
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <img src={logo} alt="RxAegis" className="h-16 sm:h-20 md:h-24 mx-auto mb-6 sm:mb-8 object-contain" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-primary bg-clip-text text-transparent px-4">
              Verify Your Medicines with Confidence
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
              RxAegis helps you verify medicine authenticity against Pakistan's DRAP database. 
              Upload prescriptions, scan packages, and ensure your health safety.
            </p>
            <p className="text-sm sm:text-base font-semibold text-primary mb-6 sm:mb-8 px-4">
              🇵🇰 An idea made in Pakistan for Pakistan
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full shadow-md">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
              Protect Your Health with Smart Verification
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Our comprehensive platform ensures every medicine you take is safe, verified, and authentic
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>DRAP Verification</CardTitle>
                <CardDescription>
                  Instantly check medicines against Pakistan's official Drug Regulatory Authority database
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Search className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Smart OCR Scanning</CardTitle>
                <CardDescription>
                  Advanced text recognition extracts medicine details from prescriptions and packages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-warning mb-4" />
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>
                  Get detailed risk scores, safety warnings, and verified alternative suggestions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-success mb-4" />
                <CardTitle>Dosage Information</CardTitle>
                <CardDescription>
                  Access proper dosage guidelines, usage instructions, and frequency recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Bilingual Support</CardTitle>
                <CardDescription>
                  Available in both English and Urdu for wider accessibility across Pakistan
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Mobile Friendly</CardTitle>
                <CardDescription>
                  Fully responsive design works perfectly on smartphones, tablets, and desktops
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
              How RxAegis Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Three simple steps to verify your medicines
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload</h3>
              <p className="text-muted-foreground">
                Take a photo or upload your prescription or medicine package
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Scan</h3>
              <p className="text-muted-foreground">
                Our AI extracts medicine names and details automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Verify</h3>
              <p className="text-muted-foreground">
                Get instant verification, safety scores, and recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto shadow-lg bg-gradient-primary text-primary-foreground">
            <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Start Verifying Your Medicines Today
              </h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
                Join thousands of users protecting their health with RxAegis
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full shadow-md">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
