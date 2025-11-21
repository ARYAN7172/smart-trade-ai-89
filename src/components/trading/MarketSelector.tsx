import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface Market {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: number;
  category: "crypto" | "forex" | "commodities" | "indices";
}

const markets: Market[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC/USD", price: 92000, change: 2.5, volume: 45000000000, category: "crypto" },
  { id: "eth", name: "Ethereum", symbol: "ETH/USD", price: 3200, change: 3.2, volume: 20000000000, category: "crypto" },
  { id: "gold", name: "Gold", symbol: "XAU/USD", price: 2050, change: -0.5, volume: 150000000, category: "commodities" },
  { id: "silver", name: "Silver", symbol: "XAG/USD", price: 24.5, change: -1.2, volume: 80000000, category: "commodities" },
  { id: "eurusd", name: "Euro/Dollar", symbol: "EUR/USD", price: 1.085, change: 0.3, volume: 1200000000, category: "forex" },
  { id: "gbpusd", name: "Pound/Dollar", symbol: "GBP/USD", price: 1.265, change: -0.2, volume: 900000000, category: "forex" },
  { id: "sp500", name: "S&P 500", symbol: "SPX", price: 4850, change: 1.8, volume: 5000000000, category: "indices" },
  { id: "nasdaq", name: "NASDAQ", symbol: "NDX", price: 17200, change: 2.1, volume: 3500000000, category: "indices" },
];

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketSelect: (marketId: string) => void;
}

export const MarketSelector = ({ selectedMarket, onMarketSelect }: MarketSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "crypto", "forex", "commodities", "indices"];

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-lg mb-3">Markets</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Market List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredMarkets.map((market) => (
            <button
              key={market.id}
              onClick={() => onMarketSelect(market.id)}
              className={`w-full p-3 rounded-lg transition-all mb-1 text-left ${
                selectedMarket === market.id
                  ? "bg-primary/10 border-l-4 border-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{market.symbol}</div>
                  <div className="text-xs text-muted-foreground">{market.name}</div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    ${market.price.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    market.change >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {market.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {market.change >= 0 ? "+" : ""}{market.change}%
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
