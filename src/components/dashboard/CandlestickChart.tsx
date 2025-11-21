import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, Clock, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
  ma200?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_histogram?: number;
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
  
  // Indicator settings
  const [indicators, setIndicators] = useState({
    ma20: { enabled: true, period: 20 },
    ma50: { enabled: true, period: 50 },
    ma200: { enabled: false, period: 200 },
    bollingerBands: { enabled: true, period: 20, stdDev: 2 },
    rsi: { enabled: true, period: 14 },
    macd: { enabled: true, fast: 12, slow: 26, signal: 9 }
  });

  // Technical indicator calculations
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

  // Generate initial candle data
  useEffect(() => {
    const generateInitialCandles = () => {
      const candles: CandleData[] = [];
      let price = 92000;
      const now = Date.now();
      const numCandles = 250; // Increased for better indicator calculation

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
      
      // Calculate indicators
      if (indicators.ma20.enabled) {
        const ma20 = calculateSMA(candles, indicators.ma20.period);
        candles.forEach((c, i) => c.ma20 = ma20[i]);
      }
      if (indicators.ma50.enabled) {
        const ma50 = calculateSMA(candles, indicators.ma50.period);
        candles.forEach((c, i) => c.ma50 = ma50[i]);
      }
      if (indicators.ma200.enabled) {
        const ma200 = calculateSMA(candles, indicators.ma200.period);
        candles.forEach((c, i) => c.ma200 = ma200[i]);
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

      // Return only last 30 for display
      return candles.slice(-30);
    };

    setCandleData(generateInitialCandles());
    setCurrentPrice(92000);
  }, [selectedTimeframe, indicators]);

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
        
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Timeframe:</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Indicators
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-semibold">Technical Indicators</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ma20">MA 20</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="ma20-period"
                        type="number"
                        value={indicators.ma20.period}
                        onChange={(e) => setIndicators({...indicators, ma20: {...indicators.ma20, period: parseInt(e.target.value)}})}
                        className="w-16 h-8"
                        min="1"
                      />
                      <Switch
                        id="ma20"
                        checked={indicators.ma20.enabled}
                        onCheckedChange={(checked) => setIndicators({...indicators, ma20: {...indicators.ma20, enabled: checked}})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ma50">MA 50</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="ma50-period"
                        type="number"
                        value={indicators.ma50.period}
                        onChange={(e) => setIndicators({...indicators, ma50: {...indicators.ma50, period: parseInt(e.target.value)}})}
                        className="w-16 h-8"
                        min="1"
                      />
                      <Switch
                        id="ma50"
                        checked={indicators.ma50.enabled}
                        onCheckedChange={(checked) => setIndicators({...indicators, ma50: {...indicators.ma50, enabled: checked}})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bb">Bollinger Bands</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="bb-period"
                        type="number"
                        value={indicators.bollingerBands.period}
                        onChange={(e) => setIndicators({...indicators, bollingerBands: {...indicators.bollingerBands, period: parseInt(e.target.value)}})}
                        className="w-16 h-8"
                        min="1"
                      />
                      <Switch
                        id="bb"
                        checked={indicators.bollingerBands.enabled}
                        onCheckedChange={(checked) => setIndicators({...indicators, bollingerBands: {...indicators.bollingerBands, enabled: checked}})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rsi">RSI</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rsi-period"
                        type="number"
                        value={indicators.rsi.period}
                        onChange={(e) => setIndicators({...indicators, rsi: {...indicators.rsi, period: parseInt(e.target.value)}})}
                        className="w-16 h-8"
                        min="1"
                      />
                      <Switch
                        id="rsi"
                        checked={indicators.rsi.enabled}
                        onCheckedChange={(checked) => setIndicators({...indicators, rsi: {...indicators.rsi, enabled: checked}})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="macd">MACD</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="macd"
                        checked={indicators.macd.enabled}
                        onCheckedChange={(checked) => setIndicators({...indicators, macd: {...indicators.macd, enabled: checked}})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
          
          {/* Moving Averages */}
          {indicators.ma20.enabled && (
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2} 
              dot={false}
              name="MA 20"
            />
          )}
          {indicators.ma50.enabled && (
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2} 
              dot={false}
              name="MA 50"
            />
          )}
          
          {/* Bollinger Bands */}
          {indicators.bollingerBands.enabled && (
            <>
              <Line 
                type="monotone" 
                dataKey="bb_upper" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="BB Upper"
              />
              <Line 
                type="monotone" 
                dataKey="bb_middle" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={1}
                dot={false}
                name="BB Middle"
              />
              <Line 
                type="monotone" 
                dataKey="bb_lower" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="BB Lower"
              />
            </>
          )}
          
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

      {/* RSI Chart */}
      {indicators.rsi.enabled && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">RSI ({indicators.rsi.period})</h4>
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={candleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" hide />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="hsl(var(--success))" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.3} />
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Chart */}
      {indicators.macd.enabled && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">MACD ({indicators.macd.fast},{indicators.macd.slow},{indicators.macd.signal})</h4>
          <ResponsiveContainer width="100%" height={120}>
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
              <Line 
                type="monotone" 
                dataKey="macd" 
                stroke="hsl(var(--chart-5))" 
                strokeWidth={2}
                dot={false}
                name="MACD"
              />
              <Line 
                type="monotone" 
                dataKey="macd_signal" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={false}
                name="Signal"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

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
