import { useEffect, useRef, useState, useCallback } from "react";
import { 
  createChart, 
  IChartApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries
} from "lightweight-charts";
import { ChartSettingsType } from "./ChartSettings";
import { fetchAllMarketData } from "@/services/marketDataService";
import { DrawingTool } from "./VerticalDrawingToolbar";
import { ChartDrawingOverlay, ChartDrawingOverlayRef } from "./ChartDrawingOverlay";

interface TradingViewChartProps {
  marketId: string;
  marketName: string;
  chartSettings?: ChartSettingsType;
  activeTool?: DrawingTool;
  onClearDrawings?: () => void;
}

type TimeframeType = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

const TIMEFRAME_CONFIG: Record<TimeframeType, { interval: string; limit: number; label: string }> = {
  '1m': { interval: '1m', limit: 500, label: '1M' },
  '5m': { interval: '5m', limit: 500, label: '5M' },
  '15m': { interval: '15m', limit: 500, label: '15M' },
  '1h': { interval: '1h', limit: 500, label: '1H' },
  '4h': { interval: '4h', limit: 500, label: '4H' },
  '1D': { interval: '1d', limit: 365, label: '1D' },
};

// Map market IDs to Binance symbols
const BINANCE_SYMBOLS: Record<string, string> = {
  btc: 'BTCUSDT', eth: 'ETHUSDT', sol: 'SOLUSDT', ada: 'ADAUSDT',
  xrp: 'XRPUSDT', doge: 'DOGEUSDT', dot: 'DOTUSDT', avax: 'AVAXUSDT',
};

// Technical indicator calculations
const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(null); continue; }
    const change = data[i] - data[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
    
    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
};

const calculateEMA = (data: (number | null)[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] === null) { result.push(null); continue; }
    ema = ema === null ? data[i]! : (data[i]! - ema) * multiplier + ema;
    result.push(ema);
  }
  return result;
};

const calculateMACD = (data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  const macdLine: (number | null)[] = emaFast.map((f, i) => 
    f === null || emaSlow[i] === null ? null : f - emaSlow[i]!
  );
  const signalLine = calculateEMA(macdLine.filter(v => v !== null) as number[], signalPeriod);
  const histogram: (number | null)[] = macdLine.map((m, i) => 
    m === null || signalLine[i] === null ? null : m - signalLine[i]!
  );
  return { macdLine, signalLine, histogram };
};

// Generate simulated data for non-crypto
const generateCandleData = (basePrice: number, count: number, intervalMinutes: number): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice * 0.85;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = Math.floor((now - (count - i) * intervalMinutes * 60 * 1000) / 1000) as Time;
    const volatility = basePrice * 0.015;
    const trend = (basePrice - currentPrice) / count * 0.5;
    const change = (Math.random() - 0.45) * volatility + trend;
    const open = currentPrice;
    const close = currentPrice + change;
    data.push({
      time,
      open,
      high: Math.max(open, close) + Math.random() * volatility * 0.3,
      low: Math.min(open, close) - Math.random() * volatility * 0.3,
      close,
    });
    currentPrice = close;
  }
  return data;
};

const generateVolumeData = (candleData: CandlestickData[]): HistogramData[] => 
  candleData.map(c => ({
    time: c.time,
    value: Math.random() * 50000000 + 10000000,
    color: (c.close ?? 0) >= (c.open ?? 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
  }));

// Fetch Binance data
const fetchBinanceKlines = async (symbol: string, interval: string, limit: number): Promise<CandlestickData[]> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    return data.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000) as Time,
      open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
    }));
  } catch { return []; }
};

const fetchBinanceVolume = async (symbol: string, interval: string, limit: number): Promise<HistogramData[]> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    return data.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000) as Time,
      value: parseFloat(k[5]),
      color: parseFloat(k[4]) >= parseFloat(k[1]) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    }));
  } catch { return []; }
};

export const TradingViewChart = ({ marketId, marketName, chartSettings, activeTool = "select", onClearDrawings }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const drawingOverlayRef = useRef<ChartDrawingOverlayRef>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);

  const [basePrice, setBasePrice] = useState<number>(100);
  const [livePrice, setLivePrice] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeType>('1h');
  const [chartWidth, setChartWidth] = useState(800);

  const isCrypto = BINANCE_SYMBOLS[marketId] !== undefined;
  const binanceSymbol = BINANCE_SYMBOLS[marketId];

  // Expose clear function
  useEffect(() => {
    (window as any).clearChartDrawings = () => drawingOverlayRef.current?.clearAll();
  }, []);

  // Fetch initial price
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const markets = await fetchAllMarketData();
        const market = markets.find(m => m.id === marketId);
        const fallback: Record<string, number> = {
          btc: 97000, eth: 3600, sol: 190, ada: 1.05, xrp: 2.35, doge: 0.38, dot: 7.5, avax: 42,
          gold: 2650, silver: 31, oil: 72, eurusd: 1.05, gbpusd: 1.27, usdjpy: 150,
          audusd: 0.64, usdcad: 1.40, gbpjpy: 190, sp500: 6050, nasdaq: 21500, dow: 44800,
          nifty: 24500, banknifty: 52000
        };
        const price = market?.price || fallback[marketId] || 100;
        setBasePrice(price);
        setLivePrice(price);
      } catch {
        setBasePrice(100);
        setLivePrice(100);
      } finally {
        setLoading(false);
      }
    };
    loadPrice();
  }, [marketId]);

  // WebSocket for real-time crypto updates
  useEffect(() => {
    if (!isCrypto || !binanceSymbol) return;

    const wsInterval = TIMEFRAME_CONFIG[timeframe].interval;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${wsInterval}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const k = data.k;
        setLivePrice(parseFloat(k.c));

        if (candleSeriesRef.current && volumeSeriesRef.current) {
          const candle: CandlestickData = {
            time: Math.floor(k.t / 1000) as Time,
            open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c),
          };
          candleSeriesRef.current.update(candle);
          lastCandleRef.current = candle;

          volumeSeriesRef.current.update({
            time: Math.floor(k.t / 1000) as Time,
            value: parseFloat(k.v),
            color: parseFloat(k.c) >= parseFloat(k.o) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
          });
        }
      }
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [isCrypto, binanceSymbol, timeframe]);

  // Poll for non-crypto
  useEffect(() => {
    if (isCrypto) return;
    const interval = setInterval(async () => {
      try {
        const markets = await fetchAllMarketData();
        const market = markets.find(m => m.id === marketId);
        if (market) setLivePrice(market.price);
      } catch {
        setLivePrice(prev => prev * (1 + (Math.random() - 0.5) * 0.001));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [marketId, isCrypto]);

  // Update non-crypto chart
  useEffect(() => {
    if (isCrypto || !candleSeriesRef.current || !volumeSeriesRef.current || !lastCandleRef.current || loading) return;
    
    const last = lastCandleRef.current;
    const updated: CandlestickData = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, livePrice),
      low: Math.min(last.low, livePrice),
      close: livePrice,
    };
    candleSeriesRef.current.update(updated);
    lastCandleRef.current = updated;
  }, [livePrice, loading, isCrypto]);

  // Create charts
  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || 
        !rsiContainerRef.current || !macdContainerRef.current || loading) return;

    const bgColor = chartSettings?.colors.background || '#131722';
    const gridColor = chartSettings?.colors.gridLines || '#2a2e39';
    const textColor = '#d1d4dc';
    const width = chartContainerRef.current.clientWidth;
    setChartWidth(width);

    const chartOptions = {
      width,
      layout: { background: { color: bgColor }, textColor, attributionLogo: false },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      rightPriceScale: { borderColor: gridColor },
      crosshair: { mode: 1 as const, vertLine: { color: '#758696', width: 1 as const, style: 3 as const, labelBackgroundColor: '#363c4e' }, horzLine: { color: '#758696', width: 1 as const, style: 3 as const, labelBackgroundColor: '#363c4e' } },
    };

    const chart = createChart(chartContainerRef.current, { ...chartOptions, height: 500, timeScale: { borderColor: gridColor, timeVisible: true, secondsVisible: timeframe === '1m' } });
    const volumeChart = createChart(volumeContainerRef.current, { ...chartOptions, height: 100, timeScale: { borderColor: gridColor, visible: false } });
    const rsiChart = createChart(rsiContainerRef.current, { ...chartOptions, height: 120, timeScale: { borderColor: gridColor, visible: false } });
    const macdChart = createChart(macdContainerRef.current, { ...chartOptions, height: 150, timeScale: { borderColor: gridColor, timeVisible: true } });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartSettings?.colors.bullish || '#26a69a',
      downColor: chartSettings?.colors.bearish || '#ef5350',
      borderUpColor: chartSettings?.colors.bullish || '#26a69a',
      borderDownColor: chartSettings?.colors.bearish || '#ef5350',
      wickUpColor: chartSettings?.colors.bullish || '#26a69a',
      wickDownColor: chartSettings?.colors.bearish || '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = volumeChart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' });
    volumeSeriesRef.current = volumeSeries;

    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2 });
    const macdSeries = macdChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2 });
    const macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 2 });
    const macdHistSeries = macdChart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } });

    const loadData = async () => {
      let candleData: CandlestickData[] = [];
      let volumeData: HistogramData[] = [];

      if (isCrypto && binanceSymbol) {
        const { interval, limit } = TIMEFRAME_CONFIG[timeframe];
        candleData = await fetchBinanceKlines(binanceSymbol, interval, limit);
        volumeData = await fetchBinanceVolume(binanceSymbol, interval, limit);
      }

      if (candleData.length === 0) {
        const mins = { '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1D': 1440 }[timeframe];
        candleData = generateCandleData(basePrice, TIMEFRAME_CONFIG[timeframe].limit, mins);
        volumeData = generateVolumeData(candleData);
      }

      lastCandleRef.current = candleData[candleData.length - 1];
      candleSeries.setData(candleData);
      volumeSeries.setData(volumeData);

      const closes = candleData.map(d => d.close ?? 0);
      const rsiValues = calculateRSI(closes);
      rsiSeries.setData(candleData.map((d, i) => ({ time: d.time, value: rsiValues[i] ?? 50 })).filter(d => d.value !== null) as LineData[]);

      const { macdLine, signalLine, histogram } = calculateMACD(closes);
      macdSeries.setData(candleData.map((d, i) => ({ time: d.time, value: macdLine[i] ?? 0 })).filter(d => d.value !== null) as LineData[]);
      macdSignalSeries.setData(candleData.map((d, i) => ({ time: d.time, value: signalLine[i] ?? 0 })).filter(d => d.value !== null) as LineData[]);
      macdHistSeries.setData(candleData.map((d, i) => ({ time: d.time, value: histogram[i] ?? 0, color: (histogram[i] ?? 0) >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)' })).filter(d => d.value !== null) as HistogramData[]);
    };

    loadData();

    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      const range = chart.timeScale().getVisibleRange();
      if (range) {
        volumeChart.timeScale().setVisibleRange(range);
        rsiChart.timeScale().setVisibleRange(range);
        macdChart.timeScale().setVisibleRange(range);
      }
    });

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      const w = chartContainerRef.current.clientWidth;
      setChartWidth(w);
      chart.applyOptions({ width: w });
      volumeChart.applyOptions({ width: w });
      rsiChart.applyOptions({ width: w });
      macdChart.applyOptions({ width: w });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      volumeChart.remove();
      rsiChart.remove();
      macdChart.remove();
    };
  }, [marketId, basePrice, chartSettings, loading, timeframe, isCrypto, binanceSymbol]);

  const timeframes: TimeframeType[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Timeframe Selector */}
      <div className="flex items-center gap-1 px-2 py-2 bg-[#131722] border-b border-[#2a2e39]">
        <span className="text-xs text-muted-foreground mr-2">Timeframe:</span>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              timeframe === tf
                ? 'bg-primary text-primary-foreground shadow-glow-cyan'
                : 'bg-[#2a2e39] text-[#d1d4dc] hover:bg-[#363c4e]'
            }`}
          >
            {TIMEFRAME_CONFIG[tf].label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-mono ${livePrice >= basePrice ? 'text-green-400' : 'text-red-400'}`}>
            ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: livePrice < 1 ? 6 : 2 })}
          </span>
          {isCrypto && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
      </div>
      
      <div className="relative flex-1">
        <div ref={chartContainerRef} className="w-full" />
        <ChartDrawingOverlay
          ref={drawingOverlayRef}
          activeTool={activeTool}
          width={chartWidth}
          height={500}
        />
      </div>
      <div className="w-full border-t border-[#2a2e39] pt-2">
        <div className="px-2 text-xs text-[#d1d4dc] mb-1">Volume</div>
        <div ref={volumeContainerRef} className="w-full" />
      </div>
      <div className="w-full border-t border-[#2a2e39] pt-2">
        <div className="px-2 text-xs text-[#d1d4dc] mb-1">RSI</div>
        <div ref={rsiContainerRef} className="w-full" />
      </div>
      <div className="w-full border-t border-[#2a2e39] pt-2">
        <div className="px-2 text-xs text-[#d1d4dc] mb-1">MACD</div>
        <div ref={macdContainerRef} className="w-full" />
      </div>
    </div>
  );
};
