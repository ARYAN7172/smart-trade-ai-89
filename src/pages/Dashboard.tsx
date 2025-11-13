import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MarketCard from "@/components/dashboard/MarketCard";
import TimeframeSelector from "@/components/dashboard/TimeframeSelector";
import TradingPanel from "@/components/dashboard/TradingPanel";
import TradeHistory from "@/components/dashboard/TradeHistory";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";
import { useRealtimePrices } from "@/hooks/useRealtimePrices";

const Dashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [searchQuery, setSearchQuery] = useState("");
  const { markets, isLoading } = useRealtimePrices();

  const filteredMarkets = markets.filter(
    (market) =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-6">
        {/* Portfolio Stats */}
        <PortfolioOverview />

        {/* Search and Timeframe */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search markets (e.g., Bitcoin, Gold, NIFTY)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
          <TimeframeSelector selected={selectedTimeframe} onSelect={setSelectedTimeframe} />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Markets Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Market Overview</h2>
                {isLoading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    Loading live data...
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((market, i) => (
                    <MarketCard key={i} {...market} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No markets found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Trade History */}
            <TradeHistory />
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <TradingPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
