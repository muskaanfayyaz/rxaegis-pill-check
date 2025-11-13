import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, AlertTriangle, CheckCircle, Globe, Smartphone, Sparkles } from "lucide-react";
const Index = () => {
  return <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        <div className="container relative mx-auto px-4 py-20 sm:py-24 md:py-32 lg:py-40">
          <div className="text-center max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm mb-8 animate-fade-in shadow-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm sm:text-base font-semibold text-primary">
                🇵🇰 An idea made in Pakistan for Pakistan
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 sm:mb-10 px-4 leading-[1.1] animate-fade-in">
              <span className="text-foreground">Verify Your Medicines</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                with Confidence
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-10 sm:mb-12 max-w-4xl mx-auto px-4 leading-relaxed animate-fade-in font-medium">
              Verify medicine authenticity against Pakistan's DRAP database. 
              <span className="block mt-2 text-foreground/90">Upload prescriptions, scan packages, and ensure your health safety.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center px-4 animate-fade-in max-w-2xl mx-auto">
              <Link to="/auth" className="w-full sm:w-auto flex-1">
                <Button size="lg" className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold shadow-glow hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-primary border-0">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto flex-1">
                <Button size="lg" variant="outline" className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold backdrop-blur-sm bg-background/50 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 text-foreground">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
        
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <p className="text-sm font-semibold text-primary">Our Features</p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4 text-foreground">
              Protect Your Health with{" "}
              <span class="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Smart Verification
              </span>

            </h2>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto px-4">
              Our comprehensive platform ensures every medicine you take is safe, verified, and authentic
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">DRAP Verification</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Instantly check medicines against Pakistan's official Drug Regulatory Authority database
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Search className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">Smart OCR Scanning</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Advanced text recognition extracts medicine details from prescriptions and packages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">Risk Assessment</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Get detailed risk scores, safety warnings, and verified alternative suggestions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">Dosage Information</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Access proper dosage guidelines, usage instructions, and frequency recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">Bilingual Support</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Available in both English and Urdu for wider accessibility across Pakistan
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-2 shadow-glow hover:shadow-xl transition-smooth hover-scale group">
              <CardHeader className="p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Smartphone className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-foreground mb-3">Mobile Friendly</CardTitle>
                <CardDescription className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                  Fully responsive design works perfectly on smartphones, tablets, and desktops
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.1),transparent_70%)]" />
        
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <p className="text-sm font-semibold text-accent">Simple Process</p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4 text-foreground">
              How RxAegis Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto px-4">
              Three simple steps to verify your medicines and ensure your safety
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-primary rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto shadow-glow group-hover:scale-110 transition-smooth">
                  <span className="text-primary-foreground">1</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-primary rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-smooth" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">Upload</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed px-2">
                Upload your medicine package using your mobile device or web app      
              </p>
            </div>

            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-primary rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto shadow-glow group-hover:scale-110 transition-smooth">
                  <span className="text-primary-foreground">2</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-primary rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-smooth" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">Scan</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed px-2">
                Our advanced AI extracts medicine names and details automatically within seconds
              </p>
            </div>

            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-primary rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto shadow-glow group-hover:scale-110 transition-smooth">
                  <span className="text-primary-foreground">3</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-primary rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-smooth" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">Verify</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed px-2">
                Get instant verification results, safety scores, and personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
        
        <div className="container relative mx-auto px-4">
          <Card className="max-w-4xl mx-auto shadow-glow border-2 glass overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-smooth" />
            <CardContent className="relative p-8 sm:p-10 md:p-12 lg:p-16 text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <p className="text-sm font-semibold text-primary">Join Us Today</p>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground leading-tight">
                Start Verifying Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Medicines Today
                </span>
              </h2>
              
              <p className="text-base sm:text-lg md:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of users protecting their health with RxAegis. Get started for free and experience peace of mind.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg shadow-glow hover:shadow-xl transition-smooth hover-scale">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-12 sm:h-14 text-base sm:text-lg glass border-2 hover:bg-background/80 transition-smooth hover-scale">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>;
};
export default Index;
