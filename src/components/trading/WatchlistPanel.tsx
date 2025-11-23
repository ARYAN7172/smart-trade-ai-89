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
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-semibold">Watchlist</h2>
        <button className="text-muted-foreground hover:text-foreground">⋯</button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[2fr,1.2fr,1fr] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <div>Symbol</div>
        <div className="text-right">Last</div>
        <div className="text-right">Change</div>
      </div>

      {/* Market List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted/20 animate-pulse rounded mb-1"
              />
            ))
          ) : (
            filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => onMarketSelect(market.id)}
                className={`w-full grid grid-cols-[2fr,1.2fr,1fr] gap-2 px-3 py-2.5 rounded hover:bg-muted/20 transition-colors text-sm ${
                  selectedMarket === market.id ? "bg-muted/30" : ""
                }`}
              >
                <div className="text-left font-medium text-foreground">
                  {market.symbol}
                </div>
                
                <div className="text-right font-medium text-foreground">
                  {market.price.toLocaleString(undefined, {
                    minimumFractionDigits: market.price < 100 ? 2 : 1,
                    maximumFractionDigits: market.price < 100 ? 2 : 1,
                  })}
                </div>
                
                <div
                  className={`text-right text-xs font-semibold ${
                    market.change >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {market.change >= 0 ? "+" : ""}
                  {market.change.toFixed(2)}%
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};