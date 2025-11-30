import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus,
  Clock, 
  BarChart3, 
  Bell, 
  RotateCcw,
  Undo,
  Redo,
  TrendingUp
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
    <div className="h-11 border-b border-border bg-card/20 flex items-center px-2 gap-2">
      {/* Left: Search and Tools */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="XAUUSD"
            className="h-7 pl-7 pr-2 w-28 text-xs bg-background/50 border-border/50"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-0.5" />
        
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {selectedTimeframe.label}
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <BarChart3 className="w-3.5 h-3.5" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Indicators
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Bell className="w-3.5 h-3.5" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Replay
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Undo className="w-3.5 h-3.5" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center gap-1 ml-auto">
        {children}
      </div>
    </div>
  );
};