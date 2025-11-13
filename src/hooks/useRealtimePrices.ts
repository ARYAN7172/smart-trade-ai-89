import { useState, useEffect } from "react";
import { fetchAllMarketData } from "@/services/marketDataService";

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
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch of real market data
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true);
      const realData = await fetchAllMarketData();
      if (realData.length > 0) {
        setMarkets(realData);
      }
      setIsLoading(false);
    };

    loadRealData();

    // Refresh every 30 seconds
    const refreshInterval = setInterval(loadRealData, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Simulate real-time updates between API calls
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setMarkets((prevMarkets) =>
        prevMarkets.map((market) => {
          // Very small random fluctuation to simulate tick-by-tick updates
          const microChange = (Math.random() - 0.5) * 0.1;
          const priceChange = market.price * (microChange / 100);
          const newPrice = market.price + priceChange;

          const priceChangeDirection = microChange > 0 ? "up" : microChange < 0 ? "down" : "none";

          return {
            ...market,
            price: parseFloat(newPrice.toFixed(market.symbol.includes("JPY") ? 2 : 
                                               market.symbol.includes("EUR") || market.symbol.includes("GBP") ? 4 : 2)),
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
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading]);

  return { markets, isLoading };
};
