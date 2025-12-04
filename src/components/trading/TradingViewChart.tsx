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

interface TradingViewChartProps {
  marketId: string;
  marketName: string;
  chartSettings?: ChartSettingsType;
  activeTool?: DrawingTool;
  onClearDrawings?: () => void;
}

interface DrawnObject {
  type: string;
  points: { x: number; y: number }[];
  color: string;
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

// Helper function to calculate technical indicators
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

const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }
    
    const change = data[i] - data[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
    
    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  }
  return result;
};

const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  const macdLine: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] === null || emaSlow[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(emaFast[i]! - emaSlow[i]!);
    }
  }
  
  const signalLine = calculateEMA(macdLine.filter(v => v !== null) as number[], signalPeriod);
  const histogram: (number | null)[] = [];
  
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i]! - signalLine[i]!);
    }
  }
  
  return { macdLine, signalLine, histogram };
};

const calculateEMA = (data: (number | null)[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] === null) {
      result.push(null);
      continue;
    }
    
    if (ema === null) {
      ema = data[i]!;
    } else {
      ema = (data[i]! - ema) * multiplier + ema;
    }
    result.push(ema);
  }
  return result;
};

// Generate simulated candlestick data for non-crypto markets
const generateCandleData = (basePrice: number, count: number = 365, intervalMinutes: number = 1440): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice * 0.85;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - (count - i) * intervalMinutes * 60 * 1000);
    const time = Math.floor(date.getTime() / 1000) as Time;
    
    const volatility = basePrice * 0.015;
    const trend = (basePrice - currentPrice) / count * 0.5;
    const change = (Math.random() - 0.45) * volatility + trend;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    
    data.push({ time, open, high, low, close });
    currentPrice = close;
  }
  
  return data;
};

// Generate volume data
const generateVolumeData = (candleData: CandlestickData[]): HistogramData[] => {
  return candleData.map(candle => ({
    time: candle.time,
    value: Math.random() * 50000000 + 10000000,
    color: (candle.close ?? 0) >= (candle.open ?? 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
  }));
};

// Fetch Binance klines data
const fetchBinanceKlines = async (symbol: string, interval: string, limit: number): Promise<CandlestickData[]> => {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    return data.map((kline: any[]) => ({
      time: Math.floor(kline[0] / 1000) as Time,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    }));
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    return [];
  }
};

// Fetch Binance volume data
const fetchBinanceVolume = async (symbol: string, interval: string, limit: number): Promise<HistogramData[]> => {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    return data.map((kline: any[]) => ({
      time: Math.floor(kline[0] / 1000) as Time,
      value: parseFloat(kline[5]),
      color: parseFloat(kline[4]) >= parseFloat(kline[1]) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    }));
  } catch (error) {
    console.error('Error fetching Binance volume:', error);
    return [];
  }
};

export const TradingViewChart = ({ marketId, marketName, chartSettings, activeTool = "select", onClearDrawings }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [basePrice, setBasePrice] = useState<number>(100);
  const [livePrice, setLivePrice] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeType>('1h');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawnObjects, setDrawnObjects] = useState<DrawnObject[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const rsiSeriesRef = useRef<any>(null);
  const macdSeriesRef = useRef<any>(null);
  const macdSignalSeriesRef = useRef<any>(null);
  const macdHistogramSeriesRef = useRef<any>(null);

  const isCrypto = BINANCE_SYMBOLS[marketId] !== undefined;
  const binanceSymbol = BINANCE_SYMBOLS[marketId];

  // Fetch initial price for non-crypto or setup
  useEffect(() => {
    const loadMarketPrice = async () => {
      try {
        const markets = await fetchAllMarketData();
        const market = markets.find(m => m.id === marketId);
        
        if (market) {
          setBasePrice(market.price);
          setLivePrice(market.price);
        } else {
          const fallbackPrices: Record<string, number> = {
            btc: 97000, eth: 3600, sol: 190, ada: 1.05, xrp: 2.35,
            doge: 0.38, dot: 7.5, avax: 42, gold: 2650, silver: 31,
            oil: 72, eurusd: 1.05, gbpusd: 1.27, usdjpy: 150, audusd: 0.64, usdcad: 1.40, gbpjpy: 190,
            sp500: 6050, nasdaq: 21500, dow: 44800, nifty: 24500, banknifty: 52000
          };
          setBasePrice(fallbackPrices[marketId] || 100);
          setLivePrice(fallbackPrices[marketId] || 100);
        }
      } catch (error) {
        console.error('Error loading market price:', error);
        const fallbackPrices: Record<string, number> = {
          btc: 97000, eth: 3600, sol: 190, ada: 1.05, xrp: 2.35,
          doge: 0.38, dot: 7.5, avax: 42, gold: 2650, silver: 31,
          oil: 72, eurusd: 1.05, gbpusd: 1.27, usdjpy: 150, audusd: 0.64, usdcad: 1.40, gbpjpy: 190,
          sp500: 6050, nasdaq: 21500, dow: 44800, nifty: 24500, banknifty: 52000
        };
        setBasePrice(fallbackPrices[marketId] || 100);
        setLivePrice(fallbackPrices[marketId] || 100);
      } finally {
        setLoading(false);
      }
    };

    loadMarketPrice();
  }, [marketId]);

  // WebSocket for real-time crypto price updates
  useEffect(() => {
    if (!isCrypto || !binanceSymbol) return;

    const wsInterval = TIMEFRAME_CONFIG[timeframe].interval;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${wsInterval}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const kline = data.k;
        const newPrice = parseFloat(kline.c);
        setLivePrice(newPrice);

        // Update current candle in real-time
        if (candleSeriesRef.current && volumeSeriesRef.current) {
          const updatedCandle: CandlestickData = {
            time: Math.floor(kline.t / 1000) as Time,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };
          candleSeriesRef.current.update(updatedCandle);
          lastCandleRef.current = updatedCandle;

          const volumeUpdate: HistogramData = {
            time: Math.floor(kline.t / 1000) as Time,
            value: parseFloat(kline.v),
            color: parseFloat(kline.c) >= parseFloat(kline.o) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
          };
          volumeSeriesRef.current.update(volumeUpdate);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isCrypto, binanceSymbol, timeframe]);

  // Clear drawings function
  const clearAllDrawings = useCallback(() => {
    setDrawnObjects([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Expose clear function globally
  useEffect(() => {
    (window as any).clearChartDrawings = clearAllDrawings;
  }, [clearAllDrawings]);

  // Redraw all objects
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawnObjects.forEach(obj => {
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (obj.type === 'trendline' && obj.points.length >= 2) {
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        ctx.lineTo(obj.points[1].x, obj.points[1].y);
        ctx.stroke();
      } else if (obj.type === 'horizontal' && obj.points.length >= 1) {
        ctx.moveTo(0, obj.points[0].y);
        ctx.lineTo(canvas.width, obj.points[0].y);
        ctx.stroke();
      } else if (obj.type === 'vertical' && obj.points.length >= 1) {
        ctx.moveTo(obj.points[0].x, 0);
        ctx.lineTo(obj.points[0].x, canvas.height);
        ctx.stroke();
      } else if (obj.type === 'brush' && obj.points.length >= 2) {
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      } else if (obj.type === 'fibonacci' && obj.points.length >= 2) {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const colors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63'];
        const startY = obj.points[0].y;
        const endY = obj.points[1].y;
        
        levels.forEach((level, i) => {
          const y = startY + (endY - startY) * level;
          ctx.strokeStyle = colors[i];
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = colors[i];
          ctx.font = '10px sans-serif';
          ctx.fillText(`${(level * 100).toFixed(1)}%`, 5, y - 2);
        });
      } else if (obj.type === 'marker' && obj.points.length >= 1) {
        ctx.fillStyle = obj.color;
        ctx.font = '20px sans-serif';
        ctx.fillText('📍', obj.points[0].x - 10, obj.points[0].y + 10);
      }
    });
  }, [drawnObjects]);

  useEffect(() => {
    redrawCanvas();
  }, [drawnObjects, redrawCanvas]);

  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = chartContainerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = 500;
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  // Mouse handlers for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === "select") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });

    if (activeTool === "marker") {
      setDrawnObjects(prev => [...prev, {
        type: 'marker',
        points: [{ x, y }],
        color: '#2962ff'
      }]);
      setIsDrawing(false);
      return;
    }

    if (activeTool === "horizontal") {
      setDrawnObjects(prev => [...prev, {
        type: 'horizontal',
        points: [{ x, y }],
        color: '#2962ff'
      }]);
      setIsDrawing(false);
      return;
    }

    if (activeTool === "vertical") {
      setDrawnObjects(prev => [...prev, {
        type: 'vertical',
        points: [{ x, y }],
        color: '#2962ff'
      }]);
      setIsDrawing(false);
      return;
    }

    if (activeTool === "brush") {
      setCurrentPath([{ x, y }]);
    }
  }, [activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw existing objects
    redrawCanvas();

    if (activeTool === "brush") {
      setCurrentPath(prev => [...prev, { x, y }]);
      
      // Draw current path
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const fullPath = [...currentPath, { x, y }];
      if (fullPath.length > 0) {
        ctx.moveTo(fullPath[0].x, fullPath[0].y);
        for (let i = 1; i < fullPath.length; i++) {
          ctx.lineTo(fullPath[i].x, fullPath[i].y);
        }
        ctx.stroke();
      }
    } else if (activeTool === "trendline") {
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === "fibonacci") {
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const colors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63'];
      
      levels.forEach((level, i) => {
        const levelY = drawStart.y + (y - drawStart.y) * level;
        ctx.strokeStyle = colors[i];
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, levelY);
        ctx.lineTo(canvas.width, levelY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = colors[i];
        ctx.font = '10px sans-serif';
        ctx.fillText(`${(level * 100).toFixed(1)}%`, 5, levelY - 2);
      });
    }
  }, [isDrawing, drawStart, activeTool, currentPath, redrawCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) {
      setIsDrawing(false);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "trendline") {
      setDrawnObjects(prev => [...prev, {
        type: 'trendline',
        points: [drawStart, { x, y }],
        color: '#2962ff'
      }]);
    } else if (activeTool === "fibonacci") {
      setDrawnObjects(prev => [...prev, {
        type: 'fibonacci',
        points: [drawStart, { x, y }],
        color: '#ffeb3b'
      }]);
    } else if (activeTool === "brush") {
      setDrawnObjects(prev => [...prev, {
        type: 'brush',
        points: [...currentPath, { x, y }],
        color: '#2962ff'
      }]);
      setCurrentPath([]);
    }

    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, activeTool, currentPath]);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || 
        !rsiContainerRef.current || !macdContainerRef.current || loading) return;

    const bgColor = chartSettings?.colors.background || '#131722';
    const gridColor = chartSettings?.colors.gridLines || '#2a2e39';
    const textColor = '#d1d4dc';

    // Main candlestick chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#363c4e',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#363c4e',
        },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: timeframe === '1m',
      },
    });

    // Volume chart
    const volumeChart = createChart(volumeContainerRef.current, {
      width: volumeContainerRef.current.clientWidth,
      height: 100,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        visible: false,
      },
    });

    // RSI chart
    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 120,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        visible: false,
      },
    });

    // MACD chart
    const macdChart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: 150,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
      },
    });

    chartRef.current = chart;
    volumeChartRef.current = volumeChart;
    rsiChartRef.current = rsiChart;
    macdChartRef.current = macdChart;

    // Create series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartSettings?.colors.bullish || '#26a69a',
      downColor: chartSettings?.colors.bearish || '#ef5350',
      borderUpColor: chartSettings?.colors.bullish || '#26a69a',
      borderDownColor: chartSettings?.colors.bearish || '#ef5350',
      wickUpColor: chartSettings?.colors.bullish || '#26a69a',
      wickDownColor: chartSettings?.colors.bearish || '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = volumeChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeriesRef.current = volumeSeries;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
      priceScaleId: 'right',
    });
    rsiSeriesRef.current = rsiSeries;

    const macdSeries = macdChart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
    });
    macdSeriesRef.current = macdSeries;

    const macdSignalSeries = macdChart.addSeries(LineSeries, {
      color: '#ff6d00',
      lineWidth: 2,
    });
    macdSignalSeriesRef.current = macdSignalSeries;

    const macdHistogramSeries = macdChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
    });
    macdHistogramSeriesRef.current = macdHistogramSeries;

    // Load data based on market type
    const loadChartData = async () => {
      let candleData: CandlestickData[] = [];
      let volumeData: HistogramData[] = [];

      if (isCrypto && binanceSymbol) {
        const { interval, limit } = TIMEFRAME_CONFIG[timeframe];
        candleData = await fetchBinanceKlines(binanceSymbol, interval, limit);
        volumeData = await fetchBinanceVolume(binanceSymbol, interval, limit);
      }
      
      // Fallback to simulated data if fetch fails or non-crypto
      if (candleData.length === 0) {
        const intervalMinutes = {
          '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1D': 1440
        }[timeframe];
        candleData = generateCandleData(basePrice, TIMEFRAME_CONFIG[timeframe].limit, intervalMinutes);
        volumeData = generateVolumeData(candleData);
      }
      
      // Store last candle for live updates
      lastCandleRef.current = candleData[candleData.length - 1];
      
      candleSeries.setData(candleData);
      volumeSeries.setData(volumeData);

      // Calculate and set RSI
      const closePrices = candleData.map(d => d.close ?? 0);
      const rsiValues = calculateRSI(closePrices);
      const rsiData: LineData[] = candleData
        .map((d, i) => ({ time: d.time, value: rsiValues[i] ?? 50 }))
        .filter(d => d.value !== null) as LineData[];
      rsiSeries.setData(rsiData);

      // Calculate and set MACD
      const { macdLine, signalLine, histogram } = calculateMACD(closePrices);
      const macdData: LineData[] = candleData
        .map((d, i) => ({ time: d.time, value: macdLine[i] ?? 0 }))
        .filter(d => d.value !== null) as LineData[];
      const signalData: LineData[] = candleData
        .map((d, i) => ({ time: d.time, value: signalLine[i] ?? 0 }))
        .filter(d => d.value !== null) as LineData[];
      const histogramData: HistogramData[] = candleData
        .map((d, i) => ({
          time: d.time,
          value: histogram[i] ?? 0,
          color: (histogram[i] ?? 0) >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }))
        .filter(d => d.value !== null) as HistogramData[];

      macdSeries.setData(macdData);
      macdSignalSeries.setData(signalData);
      macdHistogramSeries.setData(histogramData);
    };

    loadChartData();

    // Synchronize crosshair
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      const timeRange = chart.timeScale().getVisibleRange();
      if (timeRange) {
        volumeChart.timeScale().setVisibleRange(timeRange);
        rsiChart.timeScale().setVisibleRange(timeRange);
        macdChart.timeScale().setVisibleRange(timeRange);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        volumeChart.applyOptions({ width: chartContainerRef.current.clientWidth });
        rsiChart.applyOptions({ width: chartContainerRef.current.clientWidth });
        macdChart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      rsiSeriesRef.current = null;
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistogramSeriesRef.current = null;
      chart.remove();
      volumeChart.remove();
      rsiChart.remove();
      macdChart.remove();
    };
  }, [marketId, basePrice, chartSettings, loading, timeframe, isCrypto, binanceSymbol]);

  // Non-WebSocket live price update for non-crypto (polling fallback)
  useEffect(() => {
    if (isCrypto) return; // WebSocket handles crypto
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !lastCandleRef.current || loading) return;
    
    const lastCandle = lastCandleRef.current;
    const updatedCandle: CandlestickData = {
      time: lastCandle.time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, livePrice),
      low: Math.min(lastCandle.low, livePrice),
      close: livePrice,
    };
    
    candleSeriesRef.current.update(updatedCandle);
    lastCandleRef.current = updatedCandle;
    
    // Update volume with new color
    const volumeUpdate: HistogramData = {
      time: lastCandle.time,
      value: Math.random() * 50000000 + 10000000,
      color: livePrice >= (lastCandle.open ?? 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    };
    volumeSeriesRef.current.update(volumeUpdate);
  }, [livePrice, loading, isCrypto]);

  // Poll for non-crypto markets
  useEffect(() => {
    if (isCrypto) return;
    
    const interval = setInterval(async () => {
      try {
        const markets = await fetchAllMarketData();
        const market = markets.find(m => m.id === marketId);
        if (market) {
          setLivePrice(market.price);
        }
      } catch (error) {
        // Simulate small price movement for non-crypto
        setLivePrice(prev => prev * (1 + (Math.random() - 0.5) * 0.001));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [marketId, isCrypto]);

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
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ 
            cursor: activeTool === "select" ? "default" : "crosshair",
            pointerEvents: activeTool === "select" ? "none" : "auto"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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