import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Bot, BarChart3, Shield, Zap, LineChart, Users } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";

// Animated section wrapper
const AnimatedSection = ({ 
  children, 
  className = "", 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </section>
  );
};

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "98.5%", label: "Accuracy Rate", color: "text-primary" },
    { value: "$2.5M+", label: "Trading Volume", color: "text-secondary" },
    { value: "10K+", label: "Active Traders", color: "text-accent" },
  ];

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Analysis",
      description: "Our advanced AI analyzes market patterns and executes trades automatically using Smart Money Concepts.",
    },
    {
      icon: LineChart,
      title: "Advanced Charting",
      description: "Professional TradingView-style charts with Fibonacci, trendlines, and multi-timeframe analysis.",
    },
    {
      icon: BarChart3,
      title: "Multi-Market Support",
      description: "Trade crypto, forex, commodities, and indices with real-time data across multiple timeframes.",
    },
    {
      icon: Zap,
      title: "Smart Execution",
      description: "Lightning-fast order execution with AI-optimized entry and exit points based on market conditions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">TRADEX</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button 
              onClick={() => navigate("/trade")}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AnimatedSection className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            AI-Powered Trading Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Trade Smarter with{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience the future of trading with our advanced AI bot that analyzes market patterns, 
            executes trades, and maximizes your profits using Smart Money Concepts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/trade")}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 gap-2 hover-scale"
            >
              Start Trading Free <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="text-lg px-8 py-6 border-border hover:bg-muted hover-scale"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection className="py-16 border-y border-border bg-card/30" delay={100}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection className="py-20 px-6" delay={150}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">TRADEX PRO</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to give you the edge in any market condition
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* About Section */}
      <AnimatedSection className="py-20 px-6 bg-card/30 border-y border-border" delay={200}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-primary">TRADEX PRO</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                  <p className="text-muted-foreground text-sm">Enterprise-grade security with encrypted data transmission and secure API connections to major exchanges.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <Users className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Community Driven</h3>
                  <p className="text-muted-foreground text-sm">Join thousands of traders sharing strategies, insights, and real-time market analysis.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <Bot className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Smart Money AI</h3>
                  <p className="text-muted-foreground text-sm">Our AI identifies institutional order flow, liquidity zones, and optimal entry points automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <BarChart3 className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Real-Time Analytics</h3>
                  <p className="text-muted-foreground text-sm">Live market data with candlestick charts, volume analysis, RSI, MACD, and custom indicators.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 px-6 relative overflow-hidden" delay={250}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 pointer-events-none" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of traders using AI to maximize their profits
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/trade")}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 gap-2 hover-scale"
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-card/30">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} TRADEX PRO. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
