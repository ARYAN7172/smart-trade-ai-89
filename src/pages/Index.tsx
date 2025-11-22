import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogIn, LayoutDashboard } from "lucide-react";
import { MarketSelector } from "@/components/trading/MarketSelector";
import { AdvancedCandlestickChart } from "@/components/trading/AdvancedCandlestickChart";

const marketNames: Record<string, string> = {
  btc: "Bitcoin (BTC/USD)",
  eth: "Ethereum (ETH/USD)",
  sol: "Solana (SOL/USD)",
  ada: "Cardano (ADA/USD)",
  xrp: "Ripple (XRP/USD)",
  doge: "Dogecoin (DOGE/USD)",
  dot: "Polkadot (DOT/USD)",
  avax: "Avalanche (AVAX/USD)",
  gold: "Gold (XAU/USD)",
  silver: "Silver (XAG/USD)",
  oil: "Crude Oil (WTI/USD)",
  eurusd: "Euro/Dollar (EUR/USD)",
  gbpusd: "Pound/Dollar (GBP/USD)",
  usdjpy: "Dollar/Yen (USD/JPY)",
  audusd: "Aussie/Dollar (AUD/USD)",
  usdcad: "Dollar/Loonie (USD/CAD)",
  gbpjpy: "Pound/Yen (GBP/JPY)",
  sp500: "S&P 500 Index",
  nasdaq: "NASDAQ Index",
  dow: "Dow Jones Index",
  nifty: "NIFTY 50",
  banknifty: "Bank NIFTY",
};

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState("btc");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-cyber flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-bold gradient-text">TRADEX PRO</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate("/login")}
              className="bg-gradient-primary hover:opacity-90 border-0 shadow-glow-cyan gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Trading View */}
      <div className="flex-1 container mx-auto px-4 py-4 flex gap-4 min-h-0 overflow-hidden">
        {/* Market Selector Sidebar */}
        <div className="w-80 flex-shrink-0">
          <MarketSelector
            selectedMarket={selectedMarket}
            onMarketSelect={setSelectedMarket}
          />
        </div>

        {/* Chart Area */}
        <div className="flex-1 min-w-0 overflow-auto">
          <AdvancedCandlestickChart
            marketId={selectedMarket}
            marketName={marketNames[selectedMarket] || "Market"}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
