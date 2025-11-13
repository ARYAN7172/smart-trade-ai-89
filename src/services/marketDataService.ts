// Service to fetch real-time market data from various APIs

export interface MarketDataResponse {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  trend: "up" | "down";
}

// Fetch crypto prices from CoinGecko (free, no API key needed)
const fetchCryptoData = async (): Promise<Partial<Record<string, any>>> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true'
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
      '^NSEI',       // NIFTY 50
      '^NSEBANK',    // Bank NIFTY
      'EURUSD=X',    // EUR/USD
      '^GSPC',       // S&P 500
      'GBPJPY=X'     // GBP/JPY
    ];
    
    const yahooData = await fetchYahooFinanceData(yahooSymbols);
    
    // Process and structure the data
    const markets: MarketDataResponse[] = [];
    
    // Bitcoin
    if (cryptoData.bitcoin) {
      markets.push({
        name: 'Bitcoin',
        symbol: 'BTC/USD',
        price: cryptoData.bitcoin.usd,
        change: cryptoData.bitcoin.usd_24h_change || 0,
        volume: `${(cryptoData.bitcoin.usd_24h_vol / 1e9).toFixed(1)}B`,
        trend: (cryptoData.bitcoin.usd_24h_change || 0) > 0 ? 'up' : 'down'
      });
    }
    
    // Ethereum
    if (cryptoData.ethereum) {
      markets.push({
        name: 'Ethereum',
        symbol: 'ETH/USD',
        price: cryptoData.ethereum.usd,
        change: cryptoData.ethereum.usd_24h_change || 0,
        volume: `${(cryptoData.ethereum.usd_24h_vol / 1e9).toFixed(1)}B`,
        trend: (cryptoData.ethereum.usd_24h_change || 0) > 0 ? 'up' : 'down'
      });
    }
    
    // Process Yahoo Finance data
    yahooData.forEach((quote: any) => {
      let name = '';
      let symbol = '';
      
      switch (quote.symbol) {
        case 'GC=F':
          name = 'Gold';
          symbol = 'XAU/USD';
          break;
        case '^NSEI':
          name = 'NIFTY 50';
          symbol = 'NIFTY';
          break;
        case '^NSEBANK':
          name = 'Bank NIFTY';
          symbol = 'BANKNIFTY';
          break;
        case 'EURUSD=X':
          name = 'EUR/USD';
          symbol = 'EURUSD';
          break;
        case '^GSPC':
          name = 'S&P 500';
          symbol = 'SPX';
          break;
        case 'GBPJPY=X':
          name = 'GBP/JPY';
          symbol = 'GBPJPY';
          break;
      }
      
      if (name && quote.regularMarketPrice) {
        const changePercent = quote.regularMarketChangePercent || 0;
        markets.push({
          name,
          symbol,
          price: quote.regularMarketPrice,
          change: changePercent,
          volume: quote.regularMarketVolume 
            ? `${(quote.regularMarketVolume / 1e9).toFixed(1)}B`
            : 'N/A',
          trend: changePercent > 0 ? 'up' : 'down'
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
