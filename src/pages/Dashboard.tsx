import { useState } from "react";
import { AdvancedCandlestickChart } from "@/components/trading/AdvancedCandlestickChart";
import { VerticalDrawingToolbar, DrawingTool } from "@/components/trading/VerticalDrawingToolbar";
import { WatchlistPanel } from "@/components/trading/WatchlistPanel";
import { ChartTopToolbar } from "@/components/trading/ChartTopToolbar";
import { OrderPanel } from "@/components/trading/OrderPanel";
import { Button } from "@/components/ui/button";

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

const Dashboard = () => {
  const [selectedMarket, setSelectedMarket] = useState("btc");
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");

  // Dummy state for toolbar props
  const [selectedTimeframe, setSelectedTimeframe] = useState({ 
    label: "1m", 
    value: 60000, 
    display: "1 Minute" 
  });
  const [indicators, setIndicators] = useState({
    ma20: { enabled: true },
    ma50: { enabled: true },
    bollingerBands: { enabled: false },
    rsi: { enabled: true },
    macd: { enabled: false },
    vwap: { enabled: false },
  });

  const handleIndicatorToggle = (indicator: string) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: { enabled: !prev[indicator as keyof typeof prev]?.enabled }
    }));
  };

  const handleClearDrawings = () => {
    console.log("Clear all drawings");
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center p-6">
      {/* Main Container with Blue Glow */}
      <div className="w-full max-w-[1600px] h-[900px] rounded-2xl overflow-hidden border-2 border-primary/30" 
           style={{ boxShadow: '0 0 40px hsl(217 91% 60% / 0.3), inset 0 0 20px hsl(217 91% 60% / 0.1)' }}>
        
        <div className="flex h-full">
          {/* Left: Vertical Drawing Toolbar */}
          <div className="w-12 flex-shrink-0 bg-card/50 border-r border-border">
            <VerticalDrawingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onClear={handleClearDrawings}
            />
          </div>

          {/* Center: Chart Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--chart-bg))]">
            {/* Top Toolbar */}
            <ChartTopToolbar
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              indicators={indicators}
              onIndicatorToggle={handleIndicatorToggle}
              marketName={marketNames[selectedMarket] || "Market"}
              currentPrice={84530}
              priceChange={1.36}
            />

            {/* Main Chart */}
            <div className="flex-1 min-h-0">
              <AdvancedCandlestickChart
                marketId={selectedMarket}
                marketName={marketNames[selectedMarket] || "Market"}
              />
            </div>

            {/* Bottom Buy/Sell Panel */}
            <div className="h-20 border-t border-border bg-card/30 flex items-center justify-center gap-6 px-6">
              <Button 
                size="lg"
                className="w-32 h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
                style={{ background: 'hsl(217 91% 60%)' }}
              >
                Buy
              </Button>
              <Button 
                size="lg"
                className="w-32 h-12 text-lg font-semibold"
                style={{ background: 'hsl(330 100% 70%)' }}
              >
                Sell
              </Button>
              
              <div className="flex items-center gap-4 ml-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Qty</span>
                  <input 
                    type="number" 
                    defaultValue="1"
                    className="w-16 px-2 py-1 bg-muted/30 border border-border rounded text-sm text-center"
                  />
                </div>
                <div className="text-2xl font-bold">51,650</div>
              </div>
            </div>
          </div>

          {/* Right: Watchlist + Order Panel */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-card/50 border-l border-border">
            {/* Watchlist */}
            <div className="flex-1 min-h-0">
              <WatchlistPanel
                selectedMarket={selectedMarket}
                onMarketSelect={setSelectedMarket}
              />
            </div>
            
            {/* Order Panel */}
            <div className="h-64 border-t border-border">
              <OrderPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
