import { useState, useEffect } from "react";

export interface MarketData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  trend: "up" | "down";
  priceChange?: "up" | "down" | "none";
}

const initialMarkets: MarketData[] = [
  { name: "Bitcoin", symbol: "BTC/USD", price: 43250.82, change: 2.34, volume: "28.5B", trend: "up" },
  { name: "Ethereum", symbol: "ETH/USD", price: 2280.45, change: -1.23, volume: "12.3B", trend: "down" },
  { name: "Gold", symbol: "XAU/USD", price: 2045.30, change: 0.87, volume: "8.2B", trend: "up" },
  { name: "NIFTY 50", symbol: "NIFTY", price: 21850.45, change: 1.45, volume: "5.8B", trend: "up" },
  { name: "Bank NIFTY", symbol: "BANKNIFTY", price: 47520.30, change: -0.65, volume: "4.2B", trend: "down" },
  { name: "EUR/USD", symbol: "EURUSD", price: 1.0875, change: 0.12, volume: "15.7B", trend: "up" },
  { name: "S&P 500", symbol: "SPX", price: 4783.35, change: 0.89, volume: "42.1B", trend: "up" },
  { name: "GBP/JPY", symbol: "GBPJPY", price: 188.45, change: -0.34, volume: "8.9B", trend: "down" },
];

export const useRealtimePrices = () => {
  const [markets, setMarkets] = useState<MarketData[]>(initialMarkets);

  useEffect(() => {
    // Update prices every 2-4 seconds randomly
    const interval = setInterval(() => {
      setMarkets((prevMarkets) =>
        prevMarkets.map((market) => {
          // Random price change between -0.5% and +0.5%
          const changePercent = (Math.random() - 0.5) * 1;
          const priceChange = market.price * (changePercent / 100);
          const newPrice = market.price + priceChange;

          // Update 24h change
          const newChange = market.change + changePercent * 0.1;

          // Determine trend
          const newTrend = changePercent > 0 ? "up" : "down";
          const priceChangeDirection = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "none";

          // Update volume slightly
          const volumeNum = parseFloat(market.volume.replace("B", ""));
          const newVolume = (volumeNum + (Math.random() - 0.5) * 0.2).toFixed(1) + "B";

          return {
            ...market,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            volume: newVolume,
            trend: newTrend as "up" | "down",
            priceChange: priceChangeDirection as "up" | "down" | "none",
          };
        })
      );

      // Reset price change indicator after animation
      setTimeout(() => {
        setMarkets((prevMarkets) =>
          prevMarkets.map((market) => ({
            ...market,
            priceChange: "none",
          }))
        );
      }, 500);
    }, Math.random() * 2000 + 2000); // Random interval between 2-4 seconds

    return () => clearInterval(interval);
  }, []);

  return markets;
};
