// 🧪 TradeMade Hook Test Component
// Location: src/components/TradeMadeTest.jsx
// This is a temporary testing component - you can delete it after testing

import React, { useState, useEffect } from 'react';
import useTradeMade from '../hooks/useTradeMade';

const TradeMadeTest = () => {
  const {
    isConnected,
    isLoading,
    error,
    livePrices,
    liveTradesPnL,
    getLivePrice,
    getLivePrices,
    getLiveTradesPnL,
    connectWebSocket,
    disconnectWebSocket,
    getHistoricalData,
    clearError
  } = useTradeMade();

  const [testSymbol, setTestSymbol] = useState('EURUSD');
  const [testResults, setTestResults] = useState([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  // Add test result helper
  const addTestResult = (test, success, data = null, error = null) => {
    const result = {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Test 1: Single Live Price
  const testSinglePrice = async () => {
    try {
      addTestResult('Single Price Test', null, 'Starting...');
      const result = await getLivePrice(testSymbol);
      addTestResult('Single Price Test', true, result);
    } catch (err) {
      addTestResult('Single Price Test', false, null, err.message);
    }
  };

  // Test 2: Multiple Live Prices
  const testMultiplePrices = async () => {
    try {
      addTestResult('Multiple Prices Test', null, 'Starting...');
      const symbols = ['EURUSD', 'GBPUSD', 'USDJPY'];
      const result = await getLivePrices(symbols);
      addTestResult('Multiple Prices Test', true, result);
    } catch (err) {
      addTestResult('Multiple Prices Test', false, null, err.message);
    }
  };

  // Test 3: Live Trades P&L
  const testLiveTradesPnL = async () => {
    try {
      addTestResult('Live Trades P&L Test', null, 'Starting...');
      const result = await getLiveTradesPnL();
      addTestResult('Live Trades P&L Test', true, result);
    } catch (err) {
      addTestResult('Live Trades P&L Test', false, null, err.message);
    }
  };

  // Test 4: WebSocket Connection
  const testWebSocket = () => {
    try {
      addTestResult('WebSocket Test', null, 'Connecting...');
      const cleanup = connectWebSocket(['EURUSD', 'GBPUSD'], (priceData) => {
        addTestResult('WebSocket Price Update', true, priceData);
      });
      
      // Auto disconnect after 10 seconds
      setTimeout(() => {
        cleanup();
        disconnectWebSocket();
        addTestResult('WebSocket Test', true, 'Disconnected after 10 seconds');
      }, 10000);
      
    } catch (err) {
      addTestResult('WebSocket Test', false, null, err.message);
    }
  };

  // Test 5: Historical Data
  const testHistoricalData = async () => {
    try {
      addTestResult('Historical Data Test', null, 'Starting...');
      const result = await getHistoricalData('EURUSD', '1H');
      addTestResult('Historical Data Test', true, result);
    } catch (err) {
      addTestResult('Historical Data Test', false, null, err.message);
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    await testSinglePrice();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    await testMultiplePrices();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testLiveTradesPnL();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testHistoricalData();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testWebSocket(); // This runs in background
    
    setIsTestingAll(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🧪 TradeMade API Hook Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test all TradeMade API functions to ensure proper integration
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${isLoading ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading Status</div>
            <div className={`font-semibold ${isLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {isLoading ? '⏳ Loading...' : '✅ Ready'}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">WebSocket</div>
            <div className={`font-semibold ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${error ? 'bg-red-100 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Error Status</div>
            <div className={`font-semibold ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {error ? '❌ Error' : '✅ No Errors'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Live Prices</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              📊 {Object.keys(livePrices).length} Cached
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Error Detected</h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Individual Tests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Individual Tests</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={testSymbol}
                  onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol (e.g., EURUSD)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={testSinglePrice}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Test Single Price
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={testMultiplePrices}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Test Multiple Prices
                </button>
                
                <button
                  onClick={testLiveTradesPnL}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  Test Live Trades P&L
                </button>
                
                <button
                  onClick={testWebSocket}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  Test WebSocket (10s)
                </button>
                
                <button
                  onClick={testHistoricalData}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Test Historical Data
                </button>
              </div>
            </div>

            {/* Run All Tests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comprehensive Test</h3>
              
              <button
                onClick={runAllTests}
                disabled={isTestingAll}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-105 text-lg font-semibold"
              >
                {isTestingAll ? '🧪 Running All Tests...' : '🚀 Run All Tests'}
              </button>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Test Coverage:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Single price fetching</li>
                  <li>✓ Multiple prices fetching</li>
                  <li>✓ Live trades P&L calculation</li>
                  <li>✓ WebSocket real-time updates</li>
                  <li>✓ Historical data retrieval</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Live Prices Display */}
        {Object.keys(livePrices).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">💰 Cached Live Prices</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(livePrices).map(([symbol, price]) => (
                <div key={symbol} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{symbol}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Bid: {price.bid} | Ask: {price.ask}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated: {new Date(price.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Test Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No tests run yet. Click a test button to start!
              </div>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    result.success === true
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : result.success === false
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {result.success === true ? '✅' : result.success === false ? '❌' : '⏳'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.test}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <details>
                        <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                          View Data
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                          {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeMadeTest;