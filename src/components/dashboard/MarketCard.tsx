import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  trend: "up" | "down";
  priceChange?: "up" | "down" | "none";
}

const MarketCard = ({ name, symbol, price, change, volume, trend, priceChange = "none" }: MarketCardProps) => {
  const isPositive = change > 0;

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
      {/* Price flash animation */}
      {priceChange !== "none" && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            priceChange === "up" ? "bg-success/10" : "bg-destructive/10",
            "animate-pulse"
          )}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
        </div>

        <div className="mb-3">
          <div
            className={cn(
              "text-2xl font-bold transition-all duration-300",
              priceChange === "up" && "text-success",
              priceChange === "down" && "text-destructive"
            )}
          >
            ${price.toLocaleString()}
          </div>
          <div className={`text-sm font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            <span>Vol: {volume}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-xs bg-muted px-2 py-1 rounded">Live</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketCard;
