import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Search,
  Settings,
  Bell,
  User,
  Activity,
  DollarSign,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MarketCard from "@/components/dashboard/MarketCard";
import TimeframeSelector from "@/components/dashboard/TimeframeSelector";
import TradingPanel from "@/components/dashboard/TradingPanel";
import TradeHistory from "@/components/dashboard/TradeHistory";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";

const Dashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [searchQuery, setSearchQuery] = useState("");

  const markets = [
    { name: "Bitcoin", symbol: "BTC/USD", price: 43250.82, change: 2.34, volume: "28.5B", trend: "up" as const },
    { name: "Ethereum", symbol: "ETH/USD", price: 2280.45, change: -1.23, volume: "12.3B", trend: "down" as const },
    { name: "Gold", symbol: "XAU/USD", price: 2045.30, change: 0.87, volume: "8.2B", trend: "up" as const },
    { name: "NIFTY 50", symbol: "NIFTY", price: 21850.45, change: 1.45, volume: "5.8B", trend: "up" as const },
    { name: "Bank NIFTY", symbol: "BANKNIFTY", price: 47520.30, change: -0.65, volume: "4.2B", trend: "down" as const },
    { name: "EUR/USD", symbol: "EURUSD", price: 1.0875, change: 0.12, volume: "15.7B", trend: "up" as const },
  ];

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
              <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredMarkets.map((market, i) => (
                  <MarketCard key={i} {...market} />
                ))}
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
