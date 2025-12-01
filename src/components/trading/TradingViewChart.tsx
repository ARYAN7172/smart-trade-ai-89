import { useEffect, useRef, useState } from "react";
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

interface TradingViewChartProps {
  marketId: string;
  marketName: string;
  chartSettings?: ChartSettingsType;
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

// Generate realistic candlestick data
const generateCandleData = (basePrice: number, count: number = 200): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = Math.floor((now - (count - i) * 60000) / 1000) as Time;
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.48) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({ time, open, high, low, close });
    currentPrice = close;
  }
  
  return data;
};

// Generate volume data
const generateVolumeData = (candleData: CandlestickData[]): HistogramData[] => {
  return candleData.map(candle => ({
    time: candle.time,
    value: Math.random() * 5000 + 1000,
    color: (candle.close ?? 0) >= (candle.open ?? 0) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
  }));
};

export const TradingViewChart = ({ marketId, marketName, chartSettings }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  
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

  const [basePrice] = useState(() => {
    const prices: Record<string, number> = {
      btc: 92000, eth: 4200, sol: 180, ada: 0.85, xrp: 1.2,
      doge: 0.15, dot: 25, avax: 80, gold: 4220, silver: 28,
      oil: 85, eurusd: 1.08, gbpusd: 1.27, usdjpy: 150,
      sp500: 5800, nasdaq: 19500, dow: 43000, nifty: 26400, banknifty: 60200
    };
    return prices[marketId] || 100;
  });

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || 
        !rsiContainerRef.current || !macdContainerRef.current) return;

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

    // Generate and set data
    const candleData = generateCandleData(basePrice);
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
  }, [marketId, basePrice, chartSettings]);

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={chartContainerRef} className="w-full" />
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
