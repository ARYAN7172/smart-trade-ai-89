import { useState, useEffect } from "react";
import { TradingViewChart } from "@/components/trading/TradingViewChart";
import { VerticalDrawingToolbar, DrawingTool } from "@/components/trading/VerticalDrawingToolbar";
import { WatchlistPanel } from "@/components/trading/WatchlistPanel";
import { MarketDetailPanel } from "@/components/trading/MarketDetailPanel";
import { ChartTopToolbar } from "@/components/trading/ChartTopToolbar";
import { ChartSettings, useChartSettings } from "@/components/trading/ChartSettings";
import { fetchAllMarketData, MarketDataResponse } from "@/services/marketDataService";
import TradingPanel from "@/components/dashboard/TradingPanel";

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
  const [marketData, setMarketData] = useState<MarketDataResponse[]>([]);
  const [currentMarket, setCurrentMarket] = useState<MarketDataResponse | null>(null);

  // Fetch market data
  useEffect(() => {
    const loadMarketData = async () => {
      const data = await fetchAllMarketData();
      setMarketData(data);
      
      const market = data.find(m => m.id === selectedMarket);
      if (market) {
        setCurrentMarket(market);
      }
    };

    loadMarketData();
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, [selectedMarket]);

  // Update current market when selection changes
  useEffect(() => {
    const market = marketData.find(m => m.id === selectedMarket);
    if (market) {
      setCurrentMarket(market);
    }
  }, [selectedMarket, marketData]);

  const [selectedTimeframe, setSelectedTimeframe] = useState({ 
    label: "1D", 
    value: 86400000, 
    display: "1 Day" 
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
    if ((window as any).clearChartDrawings) {
      (window as any).clearChartDrawings();
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,9%)] flex">
      <div className="flex h-screen w-full">
        {/* Left: Vertical Drawing Toolbar */}
        <div className="w-11 flex-shrink-0 bg-[hsl(222,47%,11%)] border-r border-[hsl(215,16%,20%)]">
          <VerticalDrawingToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClear={handleClearDrawings}
          />
        </div>

        {/* Center: Chart Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[hsl(222,47%,9%)]">
          {/* Top Toolbar */}
          <ChartTopToolbar
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            indicators={indicators}
            onIndicatorToggle={handleIndicatorToggle}
            marketName={marketNames[selectedMarket] || "Market"}
            currentPrice={currentMarket?.price || 0}
            priceChange={currentMarket?.change || 0}
          >
            <ChartSettings settings={chartSettings} onSettingsChange={setChartSettings} />
          </ChartTopToolbar>

          {/* Main Chart */}
          <div className="flex-1 min-h-0 overflow-auto">
            <TradingViewChart
              marketId={selectedMarket}
              marketName={marketNames[selectedMarket] || "Market"}
              chartSettings={chartSettings}
              activeTool={activeTool}
              onClearDrawings={handleClearDrawings}
            />
          </div>

          {/* Bottom Timeframe Buttons */}
          <div className="h-10 border-t border-[hsl(215,16%,20%)] bg-[hsl(222,47%,11%)] flex items-center justify-center gap-1 px-4">
            {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tf) => (
              <button
                key={tf}
                className="px-3 h-6 text-xs text-[hsl(217,10%,65%)] hover:text-foreground hover:bg-[hsl(215,25%,20%)] rounded transition-colors"
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Watchlist + Market Detail + Trading Panel */}
        <div className="w-96 flex-shrink-0 flex flex-col bg-[hsl(222,47%,11%)] border-l border-[hsl(215,16%,20%)]">
          {/* Watchlist */}
          <div className="flex-[2] min-h-0 overflow-auto">
            <WatchlistPanel
              selectedMarket={selectedMarket}
              onMarketSelect={setSelectedMarket}
            />
          </div>
          
          {/* Market Detail */}
          <div className="flex-[1] min-h-0 border-t border-[hsl(215,16%,20%)]">
            <MarketDetailPanel
              marketName={marketNames[selectedMarket] || "Market"}
              currentPrice={currentMarket?.price || 0}
              priceChange={currentMarket?.change || 0}
            />
          </div>

          {/* Trading Panel - Buy/Sell with AI and Manual modes */}
          <div className="flex-[2] min-h-0 border-t border-[hsl(215,16%,20%)] overflow-auto p-3">
            <TradingPanel onAutoTradingChange={setIsAutoTradingEnabled} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
