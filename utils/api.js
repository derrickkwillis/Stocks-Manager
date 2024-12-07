const API_KEY = "ct9sq51r01quh43oro60ct9sq51r01quh43oro6g";
const BASE_URL = "https://finnhub.io/api/v1";

const LARGE_CAP_SYMBOLS = [
    "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "NVDA", "BRK.A", "UNH",
    "JNJ", "V", "XOM", "WMT", "JPM", "MA", "LLY", "PG", "HD", "MRK", "BAC",
    "CVX", "PFE", "ABBV", "PEP", "KO", "COST", "TMO", "AVGO", "DIS", "CSCO",
    "ADBE", "ABT", "NKE", "CMCSA", "WFC", "VZ", "ACN", "DHR", "INTC", "TXN",
    "MCD", "CRM", "HON", "LIN", "IBM", "AMGN", "MDT", "PM", "ORCL", "UPS"
  ];
  
  // Fetch marketCap for each symbol
  async function getMarketCap(symbol) {
    const url = `${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch market cap for ${symbol}`);
    }
    const data = await response.json();
    const cap = data.metric?.marketCapitalization;
    return typeof cap === "number" ? cap : null;
  }
  
  // Fetch current price for a symbol
  async function getCurrentPrice(symbol) {
    const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
    const data = await response.json();
    return data.c; // 'c' is the current price
  }
  
  export const fetchTopStocks = async () => {
    // Fetch market caps for all defined symbols
    const results = [];
    
    for (const symbol of LARGE_CAP_SYMBOLS) {
      try {
        const marketCap = await getMarketCap(symbol);
        if (marketCap !== null) {
          results.push({ symbol, marketCap });
        }
      } catch (error) {
        console.error(error);
        // continue fetching others even if one fails
      }
    }
  
    // Sort by marketCap descending
    results.sort((a, b) => b.marketCap - a.marketCap);
  
    // Take top 50
    const top50 = results.slice(0, 50);
  
    // Now fetch current prices for these top 50
    for (let i = 0; i < top50.length; i++) {
      const { symbol } = top50[i];
      try {
        const price = await getCurrentPrice(symbol);
        top50[i] = {
          ...top50[i],
          currentPrice: price
        };
      } catch (error) {
        console.error(error);
        // if price fails, set currentPrice to null
        top50[i] = { ...top50[i], currentPrice: null };
      }
    }

    console.log("All stocks:", top50.length);
    console.log(top50);
  
    return top50;
  };