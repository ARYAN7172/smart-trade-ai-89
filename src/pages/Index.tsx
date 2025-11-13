import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Brain, Lock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-cyber flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-background" />
              </div>
              <span className="text-2xl font-bold gradient-text">TRADEX</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-primary hover:opacity-90 border-0 shadow-glow-cyan">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-primary/30 bg-primary/10">
            <span className="text-sm text-primary font-medium">AI-Powered Trading Revolution</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            Trade Smarter with
            <br />
            <span className="gradient-text">Artificial Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Leverage advanced Smart Money Concepts, fractal structures, and AI-driven analysis to maximize your trading profits across all markets.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 border-0 shadow-glow-cyan text-lg px-8">
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Trading Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need for professional trading</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-primary" />}
              title="Smart Money Concepts"
              description="AI analyzes institutional order flow, liquidity zones, and market structure for optimal entry points."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-secondary" />}
              title="Multi-Timeframe Analysis"
              description="From 1-second to 1-year charts. Trade any timeframe with precision and confidence."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-accent" />}
              title="Lightning Fast Execution"
              description="Real-time market data and instant order execution across stocks, forex, and crypto."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-success" />}
              title="Advanced Indicators"
              description="Full suite of technical indicators, EMAs, Fibonacci tools, and custom drawing capabilities."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-primary" />}
              title="Risk Management"
              description="Automated stop-loss and take-profit calculations based on market conditions."
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8 text-secondary" />}
              title="Secure & Reliable"
              description="Bank-grade encryption and 24/7 monitoring to keep your trades and data safe."
            />
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-20 px-6 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trade Across All Markets</h2>
            <p className="text-muted-foreground text-lg">Stocks, Crypto, Forex, and Indices</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Bitcoin", "Gold", "NIFTY 50", "EUR/USD", "Ethereum", "Bank NIFTY", "S&P 500", "GBP/JPY"].map(
              (market, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{market}</div>
                  <div className="text-2xl font-bold text-success">+2.34%</div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="rounded-2xl bg-gradient-cyber p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Trading?</h2>
              <p className="text-lg mb-8 text-foreground/90">
                Join thousands of traders using AI to maximize their profits
              </p>
              <Link to="/login">
                <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 TRADEX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group">
    <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
