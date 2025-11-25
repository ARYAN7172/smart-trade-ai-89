import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Clock, 
  LineChart, 
  Bell, 
  Settings, 
  Maximize, 
  TrendingUp,
  Activity
} from "lucide-react";

interface Timeframe {
  label: string;
  value: number;
  display: string;
}

interface ChartTopToolbarProps {
  selectedTimeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  indicators: Record<string, any>;
  onIndicatorToggle: (indicator: string) => void;
  onFullscreen?: () => void;
  marketName: string;
  currentPrice: number;
  priceChange: number;
  children?: React.ReactNode;
}

const timeframes: Timeframe[] = [
  { label: "1m", value: 60000, display: "1 Minute" },
  { label: "5m", value: 300000, display: "5 Minutes" },
  { label: "15m", value: 900000, display: "15 Minutes" },
  { label: "1h", value: 3600000, display: "1 Hour" },
  { label: "4h", value: 14400000, display: "4 Hours" },
  { label: "1D", value: 86400000, display: "1 Day" },
  { label: "1W", value: 604800000, display: "1 Week" },
];

export const ChartTopToolbar = ({
  selectedTimeframe,
  onTimeframeChange,
  indicators,
  onIndicatorToggle,
  onFullscreen,
  marketName,
  currentPrice,
  priceChange,
  children,
}: ChartTopToolbarProps) => {
  return (
    <div className="h-12 border-b border-border bg-transparent flex items-center px-3 gap-3">
      {/* Left: Market Symbol */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary/70" />
        <span className="text-sm font-semibold">{marketName.split(' ')[0]}</span>
      </div>

      {/* Center: Timeframe Selector */}
      <div className="flex items-center gap-0.5 ml-4">
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            variant="ghost"
            size="sm"
            onClick={() => onTimeframeChange(tf)}
            className={`px-2.5 h-7 text-xs ${
              selectedTimeframe.value === tf.value
                ? "bg-muted/40 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
            }`}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Right: Minimal Tool Icons */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
          <LineChart className="w-3.5 h-3.5 mr-1" />
          Indicators
        </Button>
        {children}
      </div>
    </div>
  );
};