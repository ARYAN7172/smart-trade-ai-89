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
import { Canvas as FabricCanvas, Line, IText, FabricObject } from "fabric";
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

// Generate 1 year of daily candlestick data
const generateCandleData = (basePrice: number, days: number = 365): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice * 0.7; // Start 30% lower to show growth
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    const time = Math.floor(date.getTime() / 1000) as Time;
    
    // Daily volatility varies by asset type
    const volatility = basePrice * 0.025;
    const trend = (basePrice - currentPrice) / days * 0.3; // Slight trend toward current price
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

export const TradingViewChart = ({ marketId, marketName, chartSettings, activeTool = "select", onClearDrawings }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  
  const candleSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const rsiSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const macdSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const macdSignalSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const macdHistogramSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);

  const [basePrice, setBasePrice] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);

  // Fetch real market data to get current price
  useEffect(() => {
    const loadMarketPrice = async () => {
      try {
        const markets = await fetchAllMarketData();
        const market = markets.find(m => m.id === marketId);
        
        if (market) {
          setBasePrice(market.price);
        } else {
          const fallbackPrices: Record<string, number> = {
            btc: 97000, eth: 3600, sol: 190, ada: 1.05, xrp: 2.35,
            doge: 0.38, dot: 7.5, avax: 42, gold: 2650, silver: 31,
            oil: 72, eurusd: 1.05, gbpusd: 1.27, usdjpy: 150, audusd: 0.64, usdcad: 1.40, gbpjpy: 190,
            sp500: 6050, nasdaq: 21500, dow: 44800, nifty: 24500, banknifty: 52000
          };
          setBasePrice(fallbackPrices[marketId] || 100);
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
      } finally {
        setLoading(false);
      }
    };

    loadMarketPrice();
  }, [marketId]);

  // Initialize Fabric.js canvas for drawing tools
  useEffect(() => {
    if (!canvasRef.current || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: 500,
      selection: activeTool === "select",
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas size on resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvasRef.current && chartContainerRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: chartContainerRef.current.clientWidth,
          height: 500,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drawing tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    canvas.selection = activeTool === "select";
    canvas.isDrawingMode = activeTool === "brush";
    
    if (activeTool === "brush" && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = '#2962ff';
      canvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool]);

  // Clear drawings function
  const clearAllDrawings = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  }, []);

  // Expose clear function
  useEffect(() => {
    if (onClearDrawings) {
      // This creates a way for parent to trigger clear
    }
  }, [onClearDrawings]);

  // Mouse handlers for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!fabricCanvasRef.current || activeTool === "select" || activeTool === "brush") return;
    
    const canvas = fabricCanvasRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });

    if (activeTool === "marker") {
      const text = new IText('📍', {
        left: x,
        top: y,
        fontSize: 24,
        selectable: true,
      });
      canvas.add(text);
      canvas.renderAll();
      return;
    }

    // Create initial line for trendline, horizontal, vertical
    const lineConfig = {
      stroke: activeTool === "fibonacci" ? '#ffeb3b' : '#2962ff',
      strokeWidth: 2,
      selectable: true,
      evented: true,
    };

    let line: Line;
    if (activeTool === "horizontal") {
      line = new Line([0, y, canvas.width || 800, y], lineConfig);
    } else if (activeTool === "vertical") {
      line = new Line([x, 0, x, canvas.height || 500], lineConfig);
    } else {
      line = new Line([x, y, x, y], lineConfig);
    }
    
    canvas.add(line);
    setCurrentLine(line);
  }, [activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentLine || !canvasRef.current || activeTool === "horizontal" || activeTool === "vertical") return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentLine.set({ x2: x, y2: y });
    fabricCanvasRef.current?.renderAll();

    // Draw fibonacci levels
    if (activeTool === "fibonacci" && drawStart) {
      // Remove old fib lines
      const objects = fabricCanvasRef.current?.getObjects() || [];
      objects.forEach(obj => {
        if ((obj as any).isFibLevel) {
          fabricCanvasRef.current?.remove(obj);
        }
      });

      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const colors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63'];
      
      levels.forEach((level, i) => {
        const levelY = drawStart.y + (y - drawStart.y) * level;
        const fibLine = new Line([0, levelY, fabricCanvasRef.current?.width || 800, levelY], {
          stroke: colors[i],
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        (fibLine as any).isFibLevel = true;
        fabricCanvasRef.current?.add(fibLine);
      });
    }
  }, [isDrawing, currentLine, activeTool, drawStart]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setCurrentLine(null);
    setDrawStart(null);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || 
        !rsiContainerRef.current || !macdContainerRef.current || loading) return;

    const bgColor = chartSettings?.colors.background || '#131722';
    const gridColor = chartSettings?.colors.gridLines || '#2a2e39';
    const textColor = '#d1d4dc';

    // Main candlestick chart - no watermark
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
        attributionLogo: false, // Remove TradingView logo
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
        secondsVisible: false,
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

    const volumeSeries = volumeChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
      priceScaleId: 'right',
    });

    const macdSeries = macdChart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
    });

    const macdSignalSeries = macdChart.addSeries(LineSeries, {
      color: '#ff6d00',
      lineWidth: 2,
    });

    const macdHistogramSeries = macdChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
    });

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    rsiSeriesRef.current = rsiSeries;
    macdSeriesRef.current = macdSeries;
    macdSignalSeriesRef.current = macdSignalSeries;
    macdHistogramSeriesRef.current = macdHistogramSeries;

    // Generate 1 year of daily data
    const candleData = generateCandleData(basePrice, 365);
    const volumeData = generateVolumeData(candleData);
    
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
      chart.remove();
      volumeChart.remove();
      rsiChart.remove();
      macdChart.remove();
    };
  }, [marketId, basePrice, chartSettings, loading]);

  // Expose clear function to parent
  useEffect(() => {
    (window as any).clearChartDrawings = clearAllDrawings;
  }, [clearAllDrawings]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative">
        <div ref={chartContainerRef} className="w-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-auto"
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