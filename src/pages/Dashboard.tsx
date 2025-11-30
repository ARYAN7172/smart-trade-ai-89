import { useState } from "react";
import { AdvancedCandlestickChart } from "@/components/trading/AdvancedCandlestickChart";
import { VerticalDrawingToolbar, DrawingTool } from "@/components/trading/VerticalDrawingToolbar";
import { WatchlistPanel } from "@/components/trading/WatchlistPanel";
import { MarketDetailPanel } from "@/components/trading/MarketDetailPanel";
import { ChartTopToolbar } from "@/components/trading/ChartTopToolbar";
import { ChartSettings, useChartSettings } from "@/components/trading/ChartSettings";

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
  const { settings: chartSettings, setSettings: setChartSettings } = useChartSettings();

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
    <div className="min-h-screen bg-background flex">
      <div className="flex h-screen w-full">
        {/* Left: Vertical Drawing Toolbar */}
        <div className="w-11 flex-shrink-0 bg-card/50 border-r border-border">
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
            currentPrice={4215.82}
            priceChange={1.36}
          >
            <ChartSettings settings={chartSettings} onSettingsChange={setChartSettings} />
          </ChartTopToolbar>

          {/* Main Chart */}
          <div className="flex-1 min-h-0">
            <AdvancedCandlestickChart
              marketId={selectedMarket}
              marketName={marketNames[selectedMarket] || "Market"}
              chartSettings={chartSettings}
            />
          </div>

          {/* Bottom Timeframe Buttons */}
          <div className="h-10 border-t border-border bg-card/20 flex items-center justify-center gap-1 px-4">
            {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tf) => (
              <button
                key={tf}
                className="px-3 h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded transition-colors"
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Watchlist + Market Detail */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-card/50 border-l border-border">
          {/* Watchlist - 60% */}
          <div className="flex-[3] min-h-0">
            <WatchlistPanel
              selectedMarket={selectedMarket}
              onMarketSelect={setSelectedMarket}
            />
          </div>
          
          {/* Market Detail - 40% */}
          <div className="flex-[2] min-h-0">
            <MarketDetailPanel
              marketName={marketNames[selectedMarket] || "Market"}
              currentPrice={4215.82}
              priceChange={1.36}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
