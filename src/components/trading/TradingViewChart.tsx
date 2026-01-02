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

// Simple Moving Average calculation
const calculateSMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

// Bollinger Bands calculation
const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(Math.max(0, i - period + 1), i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { middle: sma, upper, lower };
};

// VWAP calculation (approximation without actual volume weighting per tick)
const calculateVWAP = (candleData: CandlestickData[]): (number | null)[] => {
  const result: (number | null)[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < candleData.length; i++) {
    const c = candleData[i];
    const typicalPrice = ((c.high ?? 0) + (c.low ?? 0) + (c.close ?? 0)) / 3;
    // Simulate volume based on price range
    const volume = Math.abs((c.high ?? 0) - (c.low ?? 0)) * 1000000 + 1000000;
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
    
    result.push(cumulativeTPV / cumulativeVolume);
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
  const [showMA9, setShowMA9] = useState(true);
  const [showMA45, setShowMA45] = useState(true);
  const [showEMA20, setShowEMA20] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);

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

    // Moving Averages on main chart
    const ma9Series = chart.addSeries(LineSeries, { color: '#f7931a', lineWidth: 2, title: 'MA 9' });
    const ma45Series = chart.addSeries(LineSeries, { color: '#627eea', lineWidth: 2, title: 'MA 45' });
    const ema20Series = chart.addSeries(LineSeries, { color: '#26a69a', lineWidth: 1, title: 'EMA 20' });
    
    // Bollinger Bands
    const bbUpperSeries = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
    const bbMiddleSeries = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1, title: 'BB Middle' });
    const bbLowerSeries = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1, lineStyle: 2, title: 'BB Lower' });
    
    // VWAP
    const vwapSeries = chart.addSeries(LineSeries, { color: '#ff5722', lineWidth: 2, lineStyle: 0, title: 'VWAP' });

    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2 });
    // RSI Overbought/Oversold lines
    const rsiOverbought = rsiChart.addSeries(LineSeries, { color: '#ef5350', lineWidth: 1, lineStyle: 2 });
    const rsiOversold = rsiChart.addSeries(LineSeries, { color: '#26a69a', lineWidth: 1, lineStyle: 2 });
    
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
      
      // Calculate and set Moving Averages
      const ma9Values = calculateSMA(closes, 9);
      const ma45Values = calculateSMA(closes, 45);
      const ema20Values = calculateEMA(closes, 20);
      
      if (showMA9) {
        ma9Series.setData(candleData.map((d, i) => ({ time: d.time, value: ma9Values[i] })).filter(d => d.value !== null) as LineData[]);
      }
      if (showMA45) {
        ma45Series.setData(candleData.map((d, i) => ({ time: d.time, value: ma45Values[i] })).filter(d => d.value !== null) as LineData[]);
      }
      if (showEMA20) {
        ema20Series.setData(candleData.map((d, i) => ({ time: d.time, value: ema20Values[i] })).filter(d => d.value !== null) as LineData[]);
      }
      
      // Bollinger Bands
      if (showBB) {
        const { middle, upper, lower } = calculateBollingerBands(closes, 20, 2);
        bbUpperSeries.setData(candleData.map((d, i) => ({ time: d.time, value: upper[i] })).filter(d => d.value !== null) as LineData[]);
        bbMiddleSeries.setData(candleData.map((d, i) => ({ time: d.time, value: middle[i] })).filter(d => d.value !== null) as LineData[]);
        bbLowerSeries.setData(candleData.map((d, i) => ({ time: d.time, value: lower[i] })).filter(d => d.value !== null) as LineData[]);
      }
      
      // VWAP
      if (showVWAP) {
        const vwapValues = calculateVWAP(candleData);
        vwapSeries.setData(candleData.map((d, i) => ({ time: d.time, value: vwapValues[i] })).filter(d => d.value !== null) as LineData[]);
      }
      
      // RSI with overbought/oversold
      const rsiValues = calculateRSI(closes);
      rsiSeries.setData(candleData.map((d, i) => ({ time: d.time, value: rsiValues[i] ?? 50 })).filter(d => d.value !== null) as LineData[]);
      rsiOverbought.setData(candleData.map(d => ({ time: d.time, value: 70 })) as LineData[]);
      rsiOversold.setData(candleData.map(d => ({ time: d.time, value: 30 })) as LineData[]);

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
  }, [marketId, basePrice, chartSettings, loading, timeframe, isCrypto, binanceSymbol, showMA9, showMA45, showEMA20, showBB, showVWAP]);

  const timeframes: TimeframeType[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

  const indicators = [
    { id: 'ma9', label: 'MA 9', color: '#f7931a', active: showMA9, toggle: () => setShowMA9(!showMA9) },
    { id: 'ma45', label: 'MA 45', color: '#627eea', active: showMA45, toggle: () => setShowMA45(!showMA45) },
    { id: 'ema20', label: 'EMA 20', color: '#26a69a', active: showEMA20, toggle: () => setShowEMA20(!showEMA20) },
    { id: 'bb', label: 'BB', color: '#9c27b0', active: showBB, toggle: () => setShowBB(!showBB) },
    { id: 'vwap', label: 'VWAP', color: '#ff5722', active: showVWAP, toggle: () => setShowVWAP(!showVWAP) },
  ];

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

      {/* Indicators Selector */}
      <div className="flex items-center gap-1 px-2 py-2 bg-[#131722] border-b border-[#2a2e39]">
        <span className="text-xs text-muted-foreground mr-2">Indicators:</span>
        {indicators.map((ind) => (
          <button
            key={ind.id}
            onClick={ind.toggle}
            className={`px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
              ind.active
                ? 'bg-[#2a2e39] text-white border border-[#3a3e49]'
                : 'bg-transparent text-[#6a6d78] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50'
            }`}
          >
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: ind.active ? ind.color : '#4a4d58' }}
            />
            {ind.label}
          </button>
        ))}
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
        <div className="px-2 text-xs text-[#d1d4dc] mb-1 flex items-center gap-2">
          RSI (14)
          <span className="text-[10px] text-muted-foreground">
            <span className="text-[#ef5350]">70</span> / <span className="text-[#26a69a]">30</span>
          </span>
        </div>
        <div ref={rsiContainerRef} className="w-full" />
      </div>
      <div className="w-full border-t border-[#2a2e39] pt-2">
        <div className="px-2 text-xs text-[#d1d4dc] mb-1 flex items-center gap-2">
          MACD (12, 26, 9)
          <span className="text-[10px]">
            <span className="text-[#2962ff]">●</span> MACD
            <span className="text-[#ff6d00] ml-1">●</span> Signal
          </span>
        </div>
        <div ref={macdContainerRef} className="w-full" />
      </div>
    </div>
  );
};
