import { useState } from "react";
import { MarketSelector } from "@/components/trading/MarketSelector";
import { AdvancedCandlestickChart } from "@/components/trading/AdvancedCandlestickChart";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TradingPanel from "@/components/dashboard/TradingPanel";
import TradeHistory from "@/components/dashboard/TradeHistory";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-4">
        {/* Portfolio Overview */}
        <div className="mb-4">
          <PortfolioOverview />
        </div>

        {/* TradingView-Style Layout */}
        <div className="flex gap-4 min-h-0 flex-1" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Market Selector Sidebar */}
          <div className="w-80 flex-shrink-0">
            <MarketSelector
              selectedMarket={selectedMarket}
              onMarketSelect={setSelectedMarket}
            />
          </div>

          {/* Chart and Trading Panel */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Main Chart */}
            <div className="flex-1 min-h-0">
              <AdvancedCandlestickChart
                marketId={selectedMarket}
                marketName={marketNames[selectedMarket] || "Market"}
              />
            </div>

            {/* Bottom Tabs for Trading Panel and History */}
            <div className="h-80 flex-shrink-0">
              <Tabs defaultValue="trading" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="trading">Trading Panel</TabsTrigger>
                  <TabsTrigger value="history">Trade History</TabsTrigger>
                </TabsList>
                <TabsContent value="trading" className="flex-1 overflow-auto mt-2">
                  <TradingPanel onAutoTradingChange={setIsAutoTradingEnabled} />
                </TabsContent>
                <TabsContent value="history" className="flex-1 overflow-auto mt-2">
                  <TradeHistory />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
