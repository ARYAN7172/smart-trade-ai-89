import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAllMarketData, MarketDataResponse } from "@/services/marketDataService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketSelect: (marketId: string) => void;
}

export const MarketSelector = ({ selectedMarket, onMarketSelect }: MarketSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [markets, setMarkets] = useState<MarketDataResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ["all", "crypto", "forex", "commodities", "indices"];

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllMarketData();
      setMarkets(data);
      if (data.length > 0) {
        toast.success("Market data loaded");
      }
    } catch (error) {
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || market.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Markets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMarketData}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
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
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-3 mb-1">
                <Skeleton className="h-12 w-full" />
              </div>
            ))
          ) : filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
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
                      ${market.price.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: market.price < 1 ? 4 : 2 
                      })}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      market.change >= 0 ? "text-success" : "text-destructive"
                    }`}>
                      {market.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No markets found
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
