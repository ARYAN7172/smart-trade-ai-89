import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Welcome to TRADEX",
      description: "Redirecting to dashboard...",
    });
    // Redirect to dashboard immediately
    setTimeout(() => navigate("/dashboard"), 500);
  };

  const handleGoogleAuth = () => {
    toast({
      title: "Welcome to TRADEX",
      description: "Redirecting to dashboard...",
    });
    // Redirect to dashboard immediately
    setTimeout(() => navigate("/dashboard"), 500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-cyber relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute inset-0 bg-background/30 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <span className="text-3xl font-bold text-background">TRADEX</span>
          </Link>
          <div className="mt-20">
            <h1 className="text-5xl font-bold text-background mb-4">
              Trade Smarter
              <br />
              with AI Power
            </h1>
            <p className="text-xl text-background/90">
              Leverage Smart Money Concepts and advanced AI to maximize your trading profits
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex gap-8 text-background/90">
            <div>
              <div className="text-3xl font-bold text-background">98%</div>
              <div className="text-sm">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-background">$2.4M</div>
              <div className="text-sm">Daily Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-background">24/7</div>
              <div className="text-sm">Trading</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to your TRADEX account" : "Start your trading journey today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-card border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-card border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-end">
                <Button variant="link" className="text-primary hover:text-primary/80 p-0">
                  Forgot password?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 border-0 shadow-glow-cyan">
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">OR CONTINUE WITH</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-border hover:bg-card"
            onClick={handleGoogleAuth}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <Button
                variant="link"
                className="text-primary hover:text-primary/80 p-0"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
