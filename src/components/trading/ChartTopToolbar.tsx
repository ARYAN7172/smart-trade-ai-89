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
}: ChartTopToolbarProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Left: Market Info */}
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{marketName}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">
              ${currentPrice.toLocaleString()}
            </span>
            <span
              className={`flex items-center gap-1 ${
                priceChange >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Center: Timeframes */}
      <div className="flex items-center gap-1">
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            variant={selectedTimeframe.value === tf.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onTimeframeChange(tf)}
            className="h-8"
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-2">
        {/* Indicators */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="w-4 h-4" />
              Indicators
              <Badge variant="secondary" className="ml-1">
                {Object.values(indicators).filter((i: any) => i.enabled).length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Technical Indicators</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onIndicatorToggle("ma20")}>
              <div className="flex items-center justify-between w-full">
                <span>MA 20</span>
                {indicators.ma20?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onIndicatorToggle("ma50")}>
              <div className="flex items-center justify-between w-full">
                <span>MA 50</span>
                {indicators.ma50?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onIndicatorToggle("bollingerBands")}>
              <div className="flex items-center justify-between w-full">
                <span>Bollinger Bands</span>
                {indicators.bollingerBands?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onIndicatorToggle("rsi")}>
              <div className="flex items-center justify-between w-full">
                <span>RSI</span>
                {indicators.rsi?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onIndicatorToggle("macd")}>
              <div className="flex items-center justify-between w-full">
                <span>MACD</span>
                {indicators.macd?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onIndicatorToggle("vwap")}>
              <div className="flex items-center justify-between w-full">
                <span>VWAP</span>
                {indicators.vwap?.enabled && (
                  <Badge variant="default" className="text-xs">ON</Badge>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Alerts */}
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="w-4 h-4" />
          Alerts
        </Button>

        {/* Settings */}
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
        </Button>

        {/* Fullscreen */}
        {onFullscreen && (
          <Button variant="outline" size="sm" onClick={onFullscreen}>
            <Maximize className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};