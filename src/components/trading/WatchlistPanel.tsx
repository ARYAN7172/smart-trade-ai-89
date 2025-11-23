import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAllMarketData, MarketDataResponse } from "@/services/marketDataService";

interface WatchlistPanelProps {
  selectedMarket: string;
  onMarketSelect: (marketId: string) => void;
}

export const WatchlistPanel = ({ selectedMarket, onMarketSelect }: WatchlistPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [markets, setMarkets] = useState<MarketDataResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarkets = async () => {
      setLoading(true);
      const data = await fetchAllMarketData();
      setMarkets(data);
      setLoading(false);
    };

    loadMarkets();
    const interval = setInterval(loadMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter(
    (market) =>
      market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="flex flex-col h-full bg-card/95 backdrop-blur-sm border-l border-border">
      {/* Search Bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border"
          />
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[2fr,1fr,1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <div>Symbol</div>
        <div className="text-right">Last Price</div>
        <div className="text-right">Change</div>
      </div>

      {/* Market List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted/20 animate-pulse rounded"
              />
            ))
          ) : (
            filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => onMarketSelect(market.id)}
                className={`w-full grid grid-cols-[2fr,1fr,1fr] gap-2 px-3 py-2 rounded hover:bg-accent/10 transition-colors ${
                  selectedMarket === market.id ? "bg-accent/20 border border-accent/30" : ""
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm text-foreground">
                    {market.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {market.name}
                  </div>
                </div>
                
                <div className="text-right text-sm font-medium text-foreground">
                  ${market.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                
                <div
                  className={`text-right text-sm font-semibold flex items-center justify-end gap-1 ${
                    market.change >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {market.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {market.change >= 0 ? "+" : ""}
                  {market.change.toFixed(2)}%
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};