import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink, Grid3x3, Edit3, MoreHorizontal } from "lucide-react";

interface MarketDetailPanelProps {
  marketName: string;
  currentPrice: number;
  priceChange: number;
  marketStatus?: string;
}

export const MarketDetailPanel = ({ 
  marketName, 
  currentPrice, 
  priceChange,
  marketStatus = "Market closed"
}: MarketDetailPanelProps) => {
  const performances = [
    { label: "1W", value: -3.60, color: "text-[hsl(0,84%,65%)]" },
    { label: "1M", value: 5.05, color: "text-[hsl(142,76%,50%)]" },
    { label: "3M", value: 23.38, color: "text-[hsl(142,76%,50%)]" },
    { label: "6M", value: 27.82, color: "text-[hsl(142,76%,50%)]" },
    { label: "YTD", value: 60.60, color: "text-[hsl(142,76%,50%)]" },
    { label: "1Y", value: 69.81, color: "text-[hsl(142,76%,50%)]" },
  ];

  return (
    <div className="h-full flex flex-col bg-card/30 border-t border-border">
      {/* Market Header */}
      <div className="px-3 py-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60">●</span>
            <span className="text-sm font-semibold">{marketName.split('/')[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Grid3x3 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-baseline gap-1.5 text-[10px] text-muted-foreground mb-1">
          <span>{marketName}</span>
          <ExternalLink className="w-2.5 h-2.5" />
          <span>• OANDA</span>
        </div>
        
        <div className="text-sm text-muted-foreground mb-1">Commodity • c/d</div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 3 })}</span>
          <span className="text-xs text-muted-foreground">USD</span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-medium ${priceChange >= 0 ? "text-[hsl(142,76%,50%)]" : "text-[hsl(0,84%,65%)]"}`}>
            {priceChange >= 0 ? "+" : ""}{(currentPrice * priceChange / 100).toFixed(3)}
          </span>
          <span className={`text-xs ${priceChange >= 0 ? "text-[hsl(142,76%,50%)]" : "text-[hsl(0,84%,65%)]"}`}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
          </span>
        </div>
        
        <div className="text-[10px] text-muted-foreground mt-1.5">
          <div>• {marketStatus}</div>
          <div>Last update at Nov 29 at 01:17 GMT+5:30</div>
        </div>
      </div>

      {/* News Section */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5">
          <TrendingUp className="w-3 h-3" />
          <span>2 days ago</span>
        </div>
        <div className="text-xs">Gold heads for fourth straight monthly gain...</div>
      </div>

      {/* Performance Section */}
      <div className="px-3 py-2.5 flex-1">
        <div className="text-xs font-medium mb-2">Performance</div>
        <div className="grid grid-cols-3 gap-2">
          {performances.map((perf) => (
            <div
              key={perf.label}
              className="bg-muted/20 rounded px-2 py-1.5 text-center"
            >
              <div className={`text-sm font-bold ${perf.color}`}>
                {perf.value >= 0 ? "+" : ""}{perf.value}%
              </div>
              <div className="text-[10px] text-muted-foreground">{perf.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
