// Service to fetch real-time market data from various APIs

export interface MarketDataResponse {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  trend: "up" | "down";
  category: "crypto" | "forex" | "commodities" | "indices";
}

export interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Fetch crypto prices from CoinGecko (free, no API key needed)
const fetchCryptoData = async (): Promise<Partial<Record<string, any>>> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,ripple,dogecoin,polkadot,avalanche-2&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true'
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return {};
  }
};

// Fetch stock/forex/indices data from Yahoo Finance (unofficial API)
const fetchYahooFinanceData = async (symbols: string[]): Promise<any[]> => {
  try {
    const symbolString = symbols.join(',');
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolString}`
    );
    const data = await response.json();
    return data.quoteResponse?.result || [];
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    return [];
  }
};

// Fetch gold price from alternative source
const fetchGoldPrice = async (): Promise<any> => {
  try {
    const response = await fetch(
      'https://api.metals.live/v1/spot/gold'
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gold data:', error);
    return null;
  }
};

export const fetchAllMarketData = async (): Promise<MarketDataResponse[]> => {
  try {
    // Fetch crypto data
    const cryptoData = await fetchCryptoData();
    
    // Fetch stocks/indices/forex from Yahoo Finance
    const yahooSymbols = [
      'GC=F',        // Gold Futures
      'SI=F',        // Silver Futures
      'CL=F',        // Crude Oil
      '^NSEI',       // NIFTY 50
      '^NSEBANK',    // Bank NIFTY
      '^GSPC',       // S&P 500
      '^DJI',        // Dow Jones
      '^IXIC',       // NASDAQ
      'EURUSD=X',    // EUR/USD
      'GBPUSD=X',    // GBP/USD
      'USDJPY=X',    // USD/JPY
      'AUDUSD=X',    // AUD/USD
      'USDCAD=X',    // USD/CAD
      'GBPJPY=X'     // GBP/JPY
    ];
    
    const yahooData = await fetchYahooFinanceData(yahooSymbols);
    
    // Process and structure the data
    const markets: MarketDataResponse[] = [];
    
    // Process crypto data
    const cryptoMap: Record<string, { id: string; name: string; symbol: string; category: "crypto" }> = {
      bitcoin: { id: 'btc', name: 'Bitcoin', symbol: 'BTC/USD', category: 'crypto' },
      ethereum: { id: 'eth', name: 'Ethereum', symbol: 'ETH/USD', category: 'crypto' },
      solana: { id: 'sol', name: 'Solana', symbol: 'SOL/USD', category: 'crypto' },
      cardano: { id: 'ada', name: 'Cardano', symbol: 'ADA/USD', category: 'crypto' },
      ripple: { id: 'xrp', name: 'Ripple', symbol: 'XRP/USD', category: 'crypto' },
      dogecoin: { id: 'doge', name: 'Dogecoin', symbol: 'DOGE/USD', category: 'crypto' },
      polkadot: { id: 'dot', name: 'Polkadot', symbol: 'DOT/USD', category: 'crypto' },
      'avalanche-2': { id: 'avax', name: 'Avalanche', symbol: 'AVAX/USD', category: 'crypto' },
    };

    Object.entries(cryptoMap).forEach(([key, info]) => {
      if (cryptoData[key]) {
        markets.push({
          id: info.id,
          name: info.name,
          symbol: info.symbol,
          price: cryptoData[key].usd,
          change: cryptoData[key].usd_24h_change || 0,
          volume: `${(cryptoData[key].usd_24h_vol / 1e9).toFixed(1)}B`,
          trend: (cryptoData[key].usd_24h_change || 0) > 0 ? 'up' : 'down',
          category: info.category
        });
      }
    });
    
    // Process Yahoo Finance data with proper mapping
    const yahooMap: Record<string, { id: string; name: string; symbol: string; category: "forex" | "commodities" | "indices" }> = {
      'GC=F': { id: 'gold', name: 'Gold', symbol: 'XAU/USD', category: 'commodities' },
      'SI=F': { id: 'silver', name: 'Silver', symbol: 'XAG/USD', category: 'commodities' },
      'CL=F': { id: 'oil', name: 'Crude Oil', symbol: 'WTI/USD', category: 'commodities' },
      '^NSEI': { id: 'nifty', name: 'NIFTY 50', symbol: 'NIFTY', category: 'indices' },
      '^NSEBANK': { id: 'banknifty', name: 'Bank NIFTY', symbol: 'BANKNIFTY', category: 'indices' },
      '^GSPC': { id: 'sp500', name: 'S&P 500', symbol: 'SPX', category: 'indices' },
      '^DJI': { id: 'dow', name: 'Dow Jones', symbol: 'DJI', category: 'indices' },
      '^IXIC': { id: 'nasdaq', name: 'NASDAQ', symbol: 'NDX', category: 'indices' },
      'EURUSD=X': { id: 'eurusd', name: 'Euro/Dollar', symbol: 'EUR/USD', category: 'forex' },
      'GBPUSD=X': { id: 'gbpusd', name: 'Pound/Dollar', symbol: 'GBP/USD', category: 'forex' },
      'USDJPY=X': { id: 'usdjpy', name: 'Dollar/Yen', symbol: 'USD/JPY', category: 'forex' },
      'AUDUSD=X': { id: 'audusd', name: 'Aussie/Dollar', symbol: 'AUD/USD', category: 'forex' },
      'USDCAD=X': { id: 'usdcad', name: 'Dollar/Loonie', symbol: 'USD/CAD', category: 'forex' },
      'GBPJPY=X': { id: 'gbpjpy', name: 'Pound/Yen', symbol: 'GBP/JPY', category: 'forex' },
    };

    yahooData.forEach((quote: any) => {
      const info = yahooMap[quote.symbol];
      
      if (info && quote.regularMarketPrice) {
        const changePercent = quote.regularMarketChangePercent || 0;
        markets.push({
          id: info.id,
          name: info.name,
          symbol: info.symbol,
          price: quote.regularMarketPrice,
          change: changePercent,
          volume: quote.regularMarketVolume 
            ? `${(quote.regularMarketVolume / 1e6).toFixed(1)}M`
            : 'N/A',
          trend: changePercent > 0 ? 'up' : 'down',
          category: info.category
        });
      }
    });
    
    return markets;
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Return fallback data if API fails
    return [];
  }
};

// Fetch historical candlestick data for a specific market
export const fetchCandlestickData = async (
  marketId: string,
  interval: string = '1h',
  limit: number = 100
): Promise<CandleData[]> => {
  try {
    // For crypto, use Binance API (free, no key needed)
    const cryptoIds = ['btc', 'eth', 'sol', 'ada', 'xrp', 'doge', 'dot', 'avax'];
    
    if (cryptoIds.includes(marketId)) {
      const symbolMap: Record<string, string> = {
        btc: 'BTCUSDT',
        eth: 'ETHUSDT',
        sol: 'SOLUSDT',
        ada: 'ADAUSDT',
        xrp: 'XRPUSDT',
        doge: 'DOGEUSDT',
        dot: 'DOTUSDT',
        avax: 'AVAXUSDT'
      };
      
      const binanceSymbol = symbolMap[marketId];
      const binanceInterval = interval === '1m' ? '1m' : '1h';
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`
      );
      
      const data = await response.json();
      
      return data.map((candle: any) => ({
        time: new Date(candle[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    }
    
    // For non-crypto assets, return simulated data based on current price
    return [];
  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return [];
  }
};
