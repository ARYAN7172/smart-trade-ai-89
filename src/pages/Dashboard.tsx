import { useState } from "react";
import { AdvancedCandlestickChart } from "@/components/trading/AdvancedCandlestickChart";
import { VerticalDrawingToolbar, DrawingTool } from "@/components/trading/VerticalDrawingToolbar";
import { WatchlistPanel } from "@/components/trading/WatchlistPanel";
import { ChartTopToolbar } from "@/components/trading/ChartTopToolbar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TradingPanel from "@/components/dashboard/TradingPanel";
import TradeHistory from "@/components/dashboard/TradeHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      {/* TradingView-Style Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Vertical Drawing Toolbar */}
        <div className="w-14 flex-shrink-0">
          <VerticalDrawingToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClear={handleClearDrawings}
          />
        </div>

        {/* Center: Chart Area */}
        <div className="flex-1 flex flex-col min-w-0">
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
          <div className="flex-1 min-h-0 p-2">
            <AdvancedCandlestickChart
              marketId={selectedMarket}
              marketName={marketNames[selectedMarket] || "Market"}
            />
          </div>

          {/* Bottom Trading Panel */}
          <div className="h-64 border-t border-border">
            <Tabs defaultValue="trading" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none bg-card/50 border-b border-border justify-start">
                <TabsTrigger value="trading">Order Entry</TabsTrigger>
                <TabsTrigger value="history">Positions & Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="trading" className="flex-1 overflow-auto mt-0 p-3">
                <TradingPanel onAutoTradingChange={setIsAutoTradingEnabled} />
              </TabsContent>
              <TabsContent value="history" className="flex-1 overflow-auto mt-0 p-3">
                <TradeHistory />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: Watchlist Panel */}
        <div className="w-80 flex-shrink-0">
          <WatchlistPanel
            selectedMarket={selectedMarket}
            onMarketSelect={setSelectedMarket}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
