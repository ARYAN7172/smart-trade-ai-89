import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, Clock, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DrawingTools, DrawingTool } from "./DrawingTools";
import { toast } from "sonner";

interface Ohlc {
  open: number;
  high: number;
  low: number;
  close: number;
}

const calculateChange = (ohlc: Ohlc) => {
  return ohlc.close - ohlc.open;
};

const calculateChangePercent = (ohlc: Ohlc) => {
  const change = calculateChange(ohlc);
  return (change / ohlc.open) * 100;
};

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_histogram?: number;
  stochastic_k?: number;
  stochastic_d?: number;
  atr?: number;
  vwap?: number;
}

interface AdvancedCandlestickChartProps {
  marketId: string;
  marketName: string;
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

export const AdvancedCandlestickChart = ({ marketId, marketName }: AdvancedCandlestickChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[4]); // 1m default
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(92000);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Drawing tools state
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [lineColor, setLineColor] = useState("#3b82f6");
  const [lineWidth, setLineWidth] = useState(2);
  
  // Indicator settings
  const [indicators, setIndicators] = useState({
    ma20: { enabled: true, period: 20 },
    ma50: { enabled: true, period: 50 },
    bollingerBands: { enabled: true, period: 20, stdDev: 2 },
    rsi: { enabled: true, period: 14 },
    macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
    stochastic: { enabled: false, period: 14 },
    atr: { enabled: false, period: 14 },
    vwap: { enabled: false },
  });

  // Technical indicator calculations (same as before)
  const calculateSMA = (data: CandleData[], period: number) => {
    return data.map((_, index) => {
      if (index < period - 1) return undefined;
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
      return sum / period;
    });
  };

  const calculateBollingerBands = (data: CandleData[], period: number, stdDev: number) => {
    const sma = calculateSMA(data, period);
    return data.map((_, index) => {
      if (index < period - 1) return { upper: undefined, middle: undefined, lower: undefined };
      const slice = data.slice(index - period + 1, index + 1);
      const mean = sma[index]!;
      const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      return {
        upper: mean + (stdDev * std),
        middle: mean,
        lower: mean - (stdDev * std)
      };
    });
  };

  const calculateRSI = (data: CandleData[], period: number) => {
    return data.map((_, index) => {
      if (index < period) return undefined;
      const slice = data.slice(index - period, index + 1);
      let gains = 0, losses = 0;
      for (let i = 1; i < slice.length; i++) {
        const change = slice[i].close - slice[i - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    });
  };

  const calculateMACD = (data: CandleData[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
    const emaFast = calculateEMA(data.map(d => d.close), fastPeriod);
    const emaSlow = calculateEMA(data.map(d => d.close), slowPeriod);
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    return macdLine.map((macd, i) => ({
      macd,
      signal: signalLine[i],
      histogram: macd - signalLine[i]
    }));
  };

  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };

  const calculateStochastic = (data: CandleData[], period: number) => {
    return data.map((_, index) => {
      if (index < period - 1) return { k: undefined, d: undefined };
      const slice = data.slice(index - period + 1, index + 1);
      const highest = Math.max(...slice.map(d => d.high));
      const lowest = Math.min(...slice.map(d => d.low));
      const current = data[index].close;
      const k = ((current - lowest) / (highest - lowest)) * 100;
      return { k, d: undefined };
    });
  };

  const calculateATR = (data: CandleData[], period: number) => {
    return data.map((candle, index) => {
      if (index === 0) return undefined;
      const prevClose = data[index - 1].close;
      const tr = Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - prevClose),
        Math.abs(candle.low - prevClose)
      );
      if (index < period) return tr;
      const slice = data.slice(index - period + 1, index + 1);
      const atr = slice.reduce((sum, d, i) => {
        const pc = i > 0 ? data[index - period + i].close : prevClose;
        const tr = Math.max(d.high - d.low, Math.abs(d.high - pc), Math.abs(d.low - pc));
        return sum + tr;
      }, 0) / period;
      return atr;
    });
  };

  const calculateVWAP = (data: CandleData[]) => {
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    return data.map((candle) => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativePV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
      return cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : undefined;
    });
  };

  const formatTime = (timestamp: number, interval: number) => {
    const date = new Date(timestamp);
    
    if (interval < 60000) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else if (interval < 3600000) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } else {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  };

  // Generate initial candle data
  useEffect(() => {
    const generateInitialCandles = () => {
      const candles: CandleData[] = [];
      let price = marketId === "btc" ? 92000 : marketId === "eth" ? 3200 : 2050;
      const now = Date.now();
      const numCandles = 250;

      for (let i = numCandles; i >= 0; i--) {
        const timestamp = now - (i * selectedTimeframe.value);
        const open = price;
        const close = price + (Math.random() - 0.5) * (price * 0.003);
        const high = Math.max(open, close) + Math.random() * (price * 0.002);
        const low = Math.min(open, close) - Math.random() * (price * 0.002);
        
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
      
      // Calculate all indicators
      if (indicators.ma20.enabled) {
        const ma20 = calculateSMA(candles, indicators.ma20.period);
        candles.forEach((c, i) => c.ma20 = ma20[i]);
      }
      if (indicators.ma50.enabled) {
        const ma50 = calculateSMA(candles, indicators.ma50.period);
        candles.forEach((c, i) => c.ma50 = ma50[i]);
      }
      if (indicators.bollingerBands.enabled) {
        const bb = calculateBollingerBands(candles, indicators.bollingerBands.period, indicators.bollingerBands.stdDev);
        candles.forEach((c, i) => {
          c.bb_upper = bb[i].upper;
          c.bb_middle = bb[i].middle;
          c.bb_lower = bb[i].lower;
        });
      }
      if (indicators.rsi.enabled) {
        const rsi = calculateRSI(candles, indicators.rsi.period);
        candles.forEach((c, i) => c.rsi = rsi[i]);
      }
      if (indicators.macd.enabled) {
        const macd = calculateMACD(candles, indicators.macd.fast, indicators.macd.slow, indicators.macd.signal);
        candles.forEach((c, i) => {
          c.macd = macd[i].macd;
          c.macd_signal = macd[i].signal;
          c.macd_histogram = macd[i].histogram;
        });
      }
      if (indicators.stochastic.enabled) {
        const stoch = calculateStochastic(candles, indicators.stochastic.period);
        candles.forEach((c, i) => {
          c.stochastic_k = stoch[i].k;
          c.stochastic_d = stoch[i].d;
        });
      }
      if (indicators.atr.enabled) {
        const atr = calculateATR(candles, indicators.atr.period);
        candles.forEach((c, i) => c.atr = atr[i]);
      }
      if (indicators.vwap.enabled) {
        const vwap = calculateVWAP(candles);
        candles.forEach((c, i) => c.vwap = vwap[i]);
      }

      return candles.slice(-50);
    };

    setCandleData(generateInitialCandles());
    setCurrentPrice(marketId === "btc" ? 92000 : marketId === "eth" ? 3200 : 2050);
  }, [selectedTimeframe, indicators, marketId]);

  // Update candles in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCandleData(prev => {
        if (prev.length === 0) return prev;
        const lastCandle = prev[prev.length - 1];
        const open = lastCandle.close;
        const close = open + (Math.random() - 0.5) * (open * 0.002);
        const high = Math.max(open, close) + Math.random() * (open * 0.001);
        const low = Math.min(open, close) - Math.random() * (open * 0.001);
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
        return [...prev.slice(-49), newCandle];
      });
    }, selectedTimeframe.value);

    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const handleClearDrawings = () => {
    toast.success("All drawings cleared");
  };

  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, open, close } = props;
    const isUp = close > open;
    const color = isUp ? "hsl(var(--success))" : "hsl(var(--destructive))";
    
    const candleWidth = Math.max(width * 0.6, 2);
    const xCenter = x + width / 2;
    const bodyTop = isUp ? y + height : y;
    const bodyBottom = isUp ? y : y + height;
    const bodyHeight = Math.abs(height);

    return (
      <g>
        <line
          x1={xCenter}
          y1={Math.min(y, y + height)}
          x2={xCenter}
          y2={Math.max(y, y + height)}
          stroke={color}
          strokeWidth={1}
        />
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
              <span className="text-muted-foreground">O:</span>
              <span className="font-semibold">${data.open.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">H:</span>
              <span className="font-semibold text-success">${data.high.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">L:</span>
              <span className="font-semibold text-destructive">${data.low.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">C:</span>
              <span className={`font-semibold ${isUp ? 'text-success' : 'text-destructive'}`}>
                ${data.close.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const latestCandle = candleData[candleData.length - 1];
  const priceChange = latestCandle ? latestCandle.close - latestCandle.open : 0;
  const priceChangePercent = latestCandle ? (priceChange / latestCandle.open * 100) : 0;
  const isUp = priceChange >= 0;

  return (
    <Card className="p-4 bg-card border-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isUp ? 'text-success' : 'text-destructive'}`} />
            {marketName}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-semibold px-2 py-1 rounded ${isUp ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
              {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Indicators
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold">Technical Indicators</h4>
                
                <div className="space-y-3">
                  {Object.entries(indicators).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{key.toUpperCase()}</Label>
                      <Switch
                        checked={value.enabled}
                        onCheckedChange={(checked) => 
                          setIndicators({...indicators, [key]: {...value, enabled: checked}})
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {timeframes.map((tf) => (
          <Button
            key={tf.value}
            size="sm"
            variant={selectedTimeframe.value === tf.value ? "default" : "outline"}
            onClick={() => setSelectedTimeframe(tf)}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Drawing Tools */}
      <div className="mb-4">
        <DrawingTools
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onClear={handleClearDrawings}
          lineColor={lineColor}
          onLineColorChange={setLineColor}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
        />
      </div>

      {/* Main Chart */}
      <div className="flex-1 min-h-0" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
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
              domain={['dataMin - 50', 'dataMax + 50']}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Indicators */}
            {indicators.ma20.enabled && (
              <Line type="monotone" dataKey="ma20" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            )}
            {indicators.ma50.enabled && (
              <Line type="monotone" dataKey="ma50" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            )}
            {indicators.bollingerBands.enabled && (
              <>
                <Line type="monotone" dataKey="bb_upper" stroke="hsl(var(--chart-3))" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="bb_middle" stroke="hsl(var(--chart-3))" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="bb_lower" stroke="hsl(var(--chart-3))" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              </>
            )}
            {indicators.vwap.enabled && (
              <Line type="monotone" dataKey="vwap" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
            )}
            
            {/* Candlesticks */}
            <Bar
              dataKey="high"
              shape={(props: any) => {
                const data = candleData[props.index];
                if (!data || !props.yAxis || !props.yAxis.scale) return null;
                
                const yScale = props.yAxis.scale;
                const yOpen = yScale(data.open);
                const yClose = yScale(data.close);
                
                return (
                  <CustomCandlestick
                    x={props.x}
                    y={Math.min(yOpen, yClose)}
                    width={props.width}
                    height={Math.abs(yOpen - yClose)}
                    open={data.open}
                    close={data.close}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Indicator Charts */}
      <div className="space-y-4 mt-4">
        {indicators.rsi.enabled && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">RSI</h4>
            <ResponsiveContainer width="100%" height={100}>
              <ComposedChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rsi" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {indicators.macd.enabled && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">MACD</h4>
            <ResponsiveContainer width="100%" height={100}>
              <ComposedChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="macd_histogram">
                  {candleData.map((entry, index) => (
                    <Cell 
                      key={`macd-${index}`} 
                      fill={(entry.macd_histogram || 0) >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                      opacity={0.5}
                    />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="macd_signal" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};
