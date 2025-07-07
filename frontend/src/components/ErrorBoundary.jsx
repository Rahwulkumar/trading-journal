// 🛡️ ErrorBoundary.jsx - Robust Error Handling System
// Location: components/ErrorBoundary.jsx

import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Mail,
  Copy,
  CheckCircle
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      isReported: false,
      errorId: null,
      showDetails: false,
      copySuccess: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `ERROR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In a real app, you would send this to your error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This would typically send to services like Sentry, LogRocket, or your own API
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Simulate API call
    console.log('Error reported to monitoring service:', errorReport);
    
    // You would replace this with actual error reporting
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      isReported: false,
      errorId: null,
      showDetails: false,
      copySuccess: false
    });
  };

  handleReportError = async () => {
    this.setState({ isReporting: true });
    
    // Simulate reporting delay
    setTimeout(() => {
      this.setState({ 
        isReporting: false, 
        isReported: true 
      });
    }, 2000);
  };

  handleCopyError = () => {
    const errorText = `
TradeSync Error Report
=====================
Error ID: ${this.state.errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}

Error Message: ${this.state.error?.message || 'Unknown error'}

Stack Trace:
${this.state.error?.stack || 'No stack trace available'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack available'}

User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copySuccess: true });
      setTimeout(() => {
        this.setState({ copySuccess: false });
      }, 2000);
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Something Went Wrong</h1>
                    <p className="text-red-100 mt-1">
                      TradeSync encountered an unexpected error
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                
                {/* Error Description */}
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Don't worry - your trading data is safe. This is likely a temporary issue.
                  </p>
                  {this.state.errorId && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Error ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                        {this.state.errorId}
                      </code>
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  
                  {/* Retry Button */}
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <RefreshCw size={18} className="mr-2" />
                    Try Again
                  </button>

                  {/* Go Home Button */}
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <Home size={18} className="mr-2" />
                    Go to Dashboard
                  </button>
                </div>

                {/* Error Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    
                    {/* Report Error Button */}
                    {!this.state.isReported ? (
                      <button
                        onClick={this.handleReportError}
                        disabled={this.state.isReporting}
                        className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        {this.state.isReporting ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Reporting...
                          </>
                        ) : (
                          <>
                            <Bug size={16} className="mr-2" />
                            Report Error
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                        <CheckCircle size={16} className="mr-2" />
                        Error Reported
                      </div>
                    )}

                    {/* Copy Error Button */}
                    <button
                      onClick={this.handleCopyError}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      {this.state.copySuccess ? (
                        <>
                          <CheckCircle size={16} className="mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-2" />
                          Copy Error Details
                        </>
                      )}
                    </button>

                    {/* Show Details Toggle */}
                    <button
                      onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <Bug size={16} className="mr-2" />
                      {this.state.showDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                </div>

                {/* Error Details (Collapsible) */}
                {this.state.showDetails && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Technical Details
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Error Message */}
                      {this.state.error && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Error Message:
                          </h4>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <code className="text-sm text-red-800 dark:text-red-200 break-all">
                              {this.state.error.message}
                            </code>
                          </div>
                        </div>
                      )}

                      {/* Stack Trace */}
                      {this.state.error?.stack && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Stack Trace:
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Component Stack */}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Component Stack:
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Support Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Need Help?
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        If this problem persists, please contact support with the error ID above.
                        Your trading data and account information remain secure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Recovery Options */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can also try refreshing the page or clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;