export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    console.log(`Fetching data for ${symbol}`);
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.chart && data.chart.error) {
      throw new Error(`Yahoo Finance Error: ${data.chart.error.description}`);
    }
    
    console.log(`Successfully fetched ${symbol}`);
    res.status(200).json(data);
    
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    res.status(500).json({ 
      error: error.message,
      symbol: symbol 
    });
  }
}
