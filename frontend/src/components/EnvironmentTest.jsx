// src/components/EnvironmentTest.jsx - Simple environment test
// Create this file to verify your setup is working

import React, { useState, useEffect } from 'react';

const EnvironmentTest = () => {
  const [envStatus, setEnvStatus] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    // Check environment variables
    const apiKey = process.env.REACT_APP_TRADEMADE_API_KEY;
    const backendUrl = process.env.REACT_APP_API_BASE_URL;
    
    setEnvStatus({
      hasApiKey: !!apiKey && apiKey !== 'your_api_key_here',
      hasBackendUrl: !!backendUrl,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set',
      backendUrl: backendUrl || 'Not set'
    });

    // Test backend connection
    testBackendConnection(backendUrl);
  }, []);

  const testBackendConnection = async (url) => {
    if (!url) {
      setBackendStatus('no_url');
      return;
    }

    try {
      const response = await fetch(`${url}/`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'checking': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'error':
      case 'no_url': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'checking': return '⏳';
      case 'failed':
      case 'error':
      case 'no_url': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Backend Connected';
      case 'checking': return 'Checking Connection...';
      case 'failed': return 'Connection Failed';
      case 'error': return 'Backend Error';
      case 'no_url': return 'No Backend URL Set';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🔧 Environment Setup Test
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Environment Variables */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Environment Variables</h3>
            
            <div className={`p-4 rounded-lg border ${envStatus.hasApiKey ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">TradeMade API Key</span>
                <span className="text-2xl">{envStatus.hasApiKey ? '✅' : '❌'}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {envStatus.apiKeyPreview}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${envStatus.hasBackendUrl ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Backend URL</span>
                <span className="text-2xl">{envStatus.hasBackendUrl ? '✅' : '❌'}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {envStatus.backendUrl}
              </div>
            </div>
          </div>

          {/* Backend Connection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Backend Connection</h3>
            
            <div className={`p-4 rounded-lg border ${getStatusColor(backendStatus)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Backend Status</span>
                <span className="text-2xl">{getStatusIcon(backendStatus)}</span>
              </div>
              <div className="text-sm mt-1">
                {getStatusText(backendStatus)}
              </div>
            </div>

            <button
              onClick={() => testBackendConnection(envStatus.backendUrl)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Test Connection Again
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Setup Instructions</h3>
          
          {!envStatus.hasApiKey && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 font-medium">❌ TradeMade API Key Missing</p>
              <p className="text-red-600 text-sm mt-1">
                Add <code>REACT_APP_TRADEMADE_API_KEY=your_actual_key</code> to your .env file
              </p>
            </div>
          )}

          {!envStatus.hasBackendUrl && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 font-medium">❌ Backend URL Missing</p>
              <p className="text-red-600 text-sm mt-1">
                Add <code>REACT_APP_API_BASE_URL=http://localhost:8000</code> to your .env file
              </p>
            </div>
          )}

          {backendStatus !== 'connected' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700 font-medium">⚠️ Backend Not Connected</p>
              <p className="text-yellow-600 text-sm mt-1">
                Make sure your Python backend is running: <code>python main.py</code>
              </p>
            </div>
          )}

          {envStatus.hasApiKey && envStatus.hasBackendUrl && backendStatus === 'connected' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700 font-medium">🎉 Everything looks good!</p>
              <p className="text-green-600 text-sm mt-1">
                You can now proceed to test the TradeMade integration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentTest;