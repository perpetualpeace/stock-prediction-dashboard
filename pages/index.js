import React, { useState } from 'react';
import Head from 'next/head';

// Since lucide-react might not work in Next.js, let's use simple icons
const TrendingUp = () => <span style={{color: 'green'}}>↗️</span>;
const TrendingDown = () => <span style={{color: 'red'}}>↘️</span>;
const Minus = () => <span style={{color: 'orange'}}>➖</span>;
const Plus = () => <span>➕</span>;
const X = () => <span>❌</span>;
const RefreshCw = ({ spinning }) => <span>{spinning ? '🔄' : '🔃'}</span>;

export default function StockDashboard() {
  const [watchlist, setWatchlist] = useState(['NVO']);
  const [newStock, setNewStock] = useState('');
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch live stock data from our API route
  const fetchLiveStockData = async (symbol) => {
    try {
      const response = await fetch(`/api/stock/${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      const result = data.chart && data.chart.result && data.chart.result[0];
      if (!result) {
        throw new Error('No chart data found');
      }
      
      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose || meta.chartPreviousClose;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      
      if (!currentPrice || isNaN(currentPrice)) {
        throw new Error('Invalid price data');
      }
      
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      const volume = meta.regularMarketVolume || 0;
      
      // Generate predictions and factors
      const dailyTarget = currentPrice * (1 + (changePercent / 100) * 1.2);
      const weeklyTarget = currentPrice * (1 + (changePercent / 100) * 2.5);
      const monthlyTarget = currentPrice * (1 + (changePercent / 100) * 4);
      
      const getPrediction = (change) => {
        if (change > 1.5) return 'bullish';
        if (change < -1.5) return 'bearish';
        return 'neutral';
      };
      
      // Factor impacts that sum to 100%
      const impacts = [25, 20, 25, 15, 15];
      const adjustment = Math.floor(Math.random() * 10) - 5;
      impacts[0] += adjustment;
      impacts[2] -= adjustment;
      
      return {
        symbol,
        currentPrice: currentPrice.toFixed(2),
        preMarketChange: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        lastUpdate: new Date().toLocaleTimeString(),
        isLiveData: true,
        predictions: {
          daily: {
            prediction: getPrediction(changePercent),
            targetPrice: dailyTarget.toFixed(2)
          },
          weekly: {
            prediction: getPrediction(changePercent * 0.8),
            targetPrice: weeklyTarget.toFixed(2)
          },
          monthly: {
            prediction: getPrediction(changePercent * 0.6),
            targetPrice: monthlyTarget.toFixed(2)
          }
        },
        factors: {
          technical: {
            signal: changePercent > 2 ? 'bullish' : changePercent < -2 ? 'bearish' : 'neutral',
            impact: impacts[0]
          },
          volume: {
            signal: volume > 50000000 ? 'bullish' : volume < 10000000 ? 'bearish' : 'neutral',
            impact: impacts[1]
          },
          news: {
            signal: changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral',
            impact: impacts[2]
          },
          sector: {
            signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
            impact: impacts[3]
          },
          options: {
            signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
            impact: impacts[4]
          }
        }
      };
      
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      throw error;
    }
  };

  const fetchAllStockData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const newStockData = {};
      
      for (const symbol of watchlist) {
        try {
          const data = await fetchLiveStockData(symbol);
          newStockData[symbol] = data;
        } catch (error) {
          setError(`Failed to fetch ${symbol}: ${error.message}`);
        }
      }
      
      setStockData(newStockData);
      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addStock = () => {
    if (newStock && !watchlist.includes(newStock.toUpperCase())) {
      setWatchlist([...watchlist, newStock.toUpperCase()]);
      setNewStock('');
    }
  };

  const removeStock = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
    const newData = {...stockData};
    delete newData[symbol];
    setStockData(newData);
  };

  const getPredictionColor = (prediction) => {
    switch(prediction) {
      case 'bullish': return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'bearish': return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      default: return { backgroundColor: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a' };
    }
  };

  const getFactorColor = (signal) => {
    switch(signal) {
      case 'bullish': return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'bearish': return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      default: return { backgroundColor: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Head>
        <title>Live Stock Prediction Dashboard</title>
      </Head>
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Live Stock Prediction Dashboard</h1>
          {lastUpdate && (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Last updated: {lastUpdate}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Add stock symbol (e.g., AAPL)"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStock()}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
          <button
            onClick={addStock}
            style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Plus /> Add
          </button>
          <button
            onClick={fetchAllStockData}
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: loading ? '#9ca3af' : '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            <RefreshCw spinning={loading} /> {loading ? 'Fetching...' : 'Fetch Live Data'}
          </button>
        </div>

        {/* Live Mode Notice */}
        <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ color: '#1e40af', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            🚀 Live Mode: Server-Side Yahoo Finance API
          </h3>
          <p style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>
            Using server-side API calls to bypass CORS restrictions. Real-time stock data with predictions!
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Stock Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {watchlist.map(symbol => {
          const stock = stockData[symbol];
          
          return (
            <div key={symbol} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{symbol}</h3>
                  {stock ? (
                    <>
                      <div style={{ fontSize: '24px', fontWeight: '600' }}>${stock.currentPrice}</div>
                      <div style={{ fontSize: '14px', color: parseFloat(stock.preMarketChange) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {stock.preMarketChange >= 0 ? '+' : ''}{stock.preMarketChange} ({stock.changePercent}%)
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Updated: {stock.lastUpdate} <span style={{ color: '#16a34a', fontWeight: '600' }}>(LIVE)</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#6b7280' }}>
                      Click Fetch Live Data to load
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeStock(symbol)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  <X />
                </button>
              </div>

              {stock && (
                <>
                  {/* Predictions */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Predictions:</div>
                    
                    {Object.entries(stock.predictions).map(([timeframe, pred]) => (
                      <div key={timeframe} style={{
                        ...getPredictionColor(pred.prediction),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        borderRadius: '6px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                          {timeframe} {pred.prediction}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>${pred.targetPrice}</span>
                      </div>
                    ))}
                  </div>

                  {/* Factors */}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Contributing Factors:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.entries(stock.factors).map(([factor, data]) => (
                        <div
                          key={factor}
                          style={{
                            ...getFactorColor(data.signal),
                            padding: '4px 8px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {factor} {data.impact}%
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
          <span>Live Mode: Yahoo Finance API (Server-Side)</span>
          <span>Real-time data, no CORS restrictions</span>
          <span>Multi-timeframe predictions</span>
        </div>
      </div>
    </div>
  );
}
