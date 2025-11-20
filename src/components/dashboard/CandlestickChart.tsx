import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Clock } from "lucide-react";

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  isEnabled: boolean;
}

const timeframes = [
  { label: "1s", value: 1000, display: "1 Second" },
  { label: "5s", value: 5000, display: "5 Seconds" },
  { label: "15s", value: 15000, display: "15 Seconds" },
  { label: "30s", value: 30000, display: "30 Seconds" },
  { label: "1m", value: 60000, display: "1 Minute" },
  { label: "5m", value: 300000, display: "5 Minutes" },
  { label: "15m", value: 900000, display: "15 Minutes" },
  { label: "30m", value: 1800000, display: "30 Minutes" },
  { label: "1h", value: 3600000, display: "1 Hour" },
];

const CandlestickChart = ({ isEnabled }: CandlestickChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[3]); // 30s default
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(92000);

  // Generate initial candle data
  useEffect(() => {
    const generateInitialCandles = () => {
      const candles: CandleData[] = [];
      let price = 92000;
      const now = Date.now();
      const numCandles = 30;

      for (let i = numCandles; i >= 0; i--) {
        const timestamp = now - (i * selectedTimeframe.value);
        const open = price;
        const close = price + (Math.random() - 0.5) * 300;
        const high = Math.max(open, close) + Math.random() * 150;
        const low = Math.min(open, close) - Math.random() * 150;
        
        candles.push({
          time: formatTime(timestamp, selectedTimeframe.value),
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.random() * 100
        });
        
        price = close;
      }
      
      return candles;
    };

    setCandleData(generateInitialCandles());
    setCurrentPrice(92000);
  }, [selectedTimeframe]);

  // Update candles in real-time
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setCandleData(prev => {
        const lastCandle = prev[prev.length - 1];
        const open = lastCandle.close;
        const close = open + (Math.random() - 0.5) * 200;
        const high = Math.max(open, close) + Math.random() * 100;
        const low = Math.min(open, close) - Math.random() * 100;
        const now = Date.now();

        const newCandle: CandleData = {
          time: formatTime(now, selectedTimeframe.value),
          timestamp: now,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.random() * 100
        };

        setCurrentPrice(close);
        
        // Keep last 30 candles
        return [...prev.slice(-29), newCandle];
      });
    }, selectedTimeframe.value);

    return () => clearInterval(interval);
  }, [isEnabled, selectedTimeframe]);

  const formatTime = (timestamp: number, interval: number) => {
    const date = new Date(timestamp);
    
    if (interval < 60000) {
      // Show seconds for intervals less than 1 minute
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else if (interval < 3600000) {
      // Show minutes for intervals less than 1 hour
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } else {
      // Show hours for longer intervals
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  };

  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, open, close, high, low } = props;
    const isUp = close > open;
    const color = isUp ? "hsl(var(--success))" : "hsl(var(--destructive))";
    
    const candleWidth = Math.max(width * 0.6, 2);
    const xCenter = x + width / 2;
    
    // Calculate positions
    const topWick = Math.min(y, y + height);
    const bottomWick = Math.max(y, y + height);
    const bodyTop = isUp ? y + height : y;
    const bodyBottom = isUp ? y : y + height;
    const bodyHeight = Math.abs(height);

    return (
      <g>
        {/* Wick */}
        <line
          x1={xCenter}
          y1={topWick}
          x2={xCenter}
          y2={bottomWick}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={xCenter - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isUp = data.close > data.open;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.time}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-semibold">${data.open.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="font-semibold text-success">${data.high.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-semibold text-destructive">${data.low.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className={`font-semibold ${isUp ? 'text-success' : 'text-destructive'}`}>
                ${data.close.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-border">
              <span className="text-muted-foreground">Change:</span>
              <span className={`font-semibold ${isUp ? 'text-success' : 'text-destructive'}`}>
                {isUp ? '+' : ''}{((data.close - data.open) / data.open * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isEnabled) return null;

  const latestCandle = candleData[candleData.length - 1];
  const priceChange = latestCandle ? latestCandle.close - latestCandle.open : 0;
  const priceChangePercent = latestCandle ? (priceChange / latestCandle.open * 100) : 0;
  const isUp = priceChange >= 0;

  return (
    <Card className="p-6 bg-card border-border animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isUp ? 'text-success' : 'text-destructive'}`} />
            Candlestick Chart - BTC/USD
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-semibold px-2 py-1 rounded ${isUp ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
              {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Timeframe:</span>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            size="sm"
            variant={selectedTimeframe.value === tf.value ? "default" : "outline"}
            onClick={() => setSelectedTimeframe(tf)}
            className={`transition-all ${
              selectedTimeframe.value === tf.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary/10"
            }`}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Candlestick Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={candleData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            domain={['dataMin - 200', 'dataMax + 200']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Candlesticks using custom shape */}
          <Bar
            dataKey="high"
            shape={(props: any) => {
              const data = candleData[props.index];
              if (!data) return null;
              
              const yScale = props.yAxis.scale;
              const xPos = props.x;
              const yHigh = yScale(data.high);
              const yLow = yScale(data.low);
              const yOpen = yScale(data.open);
              const yClose = yScale(data.close);
              
              return (
                <CustomCandlestick
                  x={xPos}
                  y={Math.min(yOpen, yClose)}
                  width={props.width}
                  height={Math.abs(yOpen - yClose)}
                  open={data.open}
                  close={data.close}
                  high={data.high}
                  low={data.low}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Volume</h4>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={candleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" hide />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="volume">
              {candleData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.close >= entry.open ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  opacity={0.6}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CandlestickChart;
