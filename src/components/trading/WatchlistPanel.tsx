import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { fetchAllMarketData, MarketDataResponse } from "@/services/marketDataService";
import { ChevronDown, Plus } from "lucide-react";

interface WatchlistPanelProps {
  selectedMarket: string;
  onMarketSelect: (marketId: string) => void;
}

const categoryIcons: Record<string, string> = {
  'btc': '₿',
  'eth': 'Ξ',
  'sol': '◎',
  'ada': '₳',
  'xrp': 'XRP',
  'doge': 'Ð',
  'dot': '●',
  'avax': '▲',
};

export const WatchlistPanel = ({ selectedMarket, onMarketSelect }: WatchlistPanelProps) => {
  const [markets, setMarkets] = useState<MarketDataResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    STOCKS: true,
    FUTURES: true,
    FOREX: true,
    CRYPTO: true,
  });

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

  const categorizeMarkets = () => {
    const crypto = markets.filter(m => ['btc', 'eth', 'sol', 'ada', 'xrp', 'doge', 'dot', 'avax'].includes(m.id));
    const stocks = markets.filter(m => ['sp500', 'nasdaq', 'dow', 'nifty', 'banknifty'].includes(m.id));
    const forex = markets.filter(m => ['eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'gbpjpy'].includes(m.id));
    const futures = markets.filter(m => ['gold', 'silver', 'oil'].includes(m.id));
    
    return { STOCKS: stocks, FUTURES: futures, FOREX: forex, CRYPTO: crypto };
  };

  const categorizedMarkets = categorizeMarkets();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Watchlist</h3>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[1.2fr,0.8fr,0.6fr,0.7fr] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/50">
        <div>Symbol</div>
        <div className="text-right">Last</div>
        <div className="text-right">Chg</div>
        <div className="text-right">Chg%</div>
      </div>

      {/* Market List with Categories */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-muted/20 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div>
            {Object.entries(categorizedMarkets).map(([category, categoryMarkets]) => (
              categoryMarkets.length > 0 && (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-3 py-1.5 text-[10px] text-muted-foreground font-medium text-left hover:bg-muted/20 flex items-center gap-1"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedCategories[category] ? '' : '-rotate-90'}`} />
                    {category}
                  </button>
                  {expandedCategories[category] && categoryMarkets.map((market) => {
                    const isSelected = market.id === selectedMarket;
                    const changeValue = (market.price * market.change) / 100;
                    return (
                      <div
                        key={market.id}
                        onClick={() => onMarketSelect(market.id)}
                        className={`grid grid-cols-[1.2fr,0.8fr,0.6fr,0.7fr] gap-2 px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs opacity-60">{categoryIcons[market.id] || '●'}</span>
                          <span className="text-xs font-medium truncate">{market.symbol}</span>
                        </div>
                        <div className="text-xs text-right">
                          {market.price.toLocaleString('en-US', {
                            minimumFractionDigits: market.price < 1 ? 4 : 2,
                            maximumFractionDigits: market.price < 1 ? 4 : 2,
                          })}
                        </div>
                        <div className={`text-xs text-right font-medium ${market.change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                          {market.change >= 0 ? "+" : ""}{changeValue.toFixed(2)}
                        </div>
                        <div className={`text-xs text-right ${market.change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                          {market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
