// 🚀 App.jsx - Complete TradeSync Application
// Location: App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  FileText, 
  Target, 
  Building2, 
  BookOpen,
  TrendingUp,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  User
} from 'lucide-react';

// Import all components
import Dashboard from './components/Dashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DailyJournal from './components/DailyJournal';
import Reports from './components/Reports';
import StrategyManager from './components/StrategyManager';
import AccountManager from './components/AccountManager';
import WeeklyBiasBoard from './components/WeeklyBiasBoard';
import TradeForm from './components/TradeForm';
import ErrorBoundary from './components/ErrorBoundary';

// Import styles
import './App.css';

const App = () => {
  // State management
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start with closed sidebar on mobile
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('tradeSyncTheme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showTradeForm, setShowTradeForm] = useState(false);

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      component: Dashboard,
      description: 'Overview and performance metrics'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrendingUp,
      component: AnalyticsDashboard,
      description: 'Advanced performance analysis'
    },
    {
      id: 'daily-journal',
      name: 'Daily Journal',
      icon: BookOpen,
      component: DailyJournal,
      description: 'Daily trading reflection and notes'
    },
    {
      id: 'weekly-bias',
      name: 'Weekly Bias',
      icon: Target,
      component: WeeklyBiasBoard,
      description: 'Market bias and analysis'
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: FileText,
      component: Reports,
      description: 'Comprehensive trade reports'
    },
    {
      id: 'strategies',
      name: 'Strategies',
      icon: Target,
      component: StrategyManager,
      description: 'Trading strategy management'
    },
    {
      id: 'accounts',
      name: 'Accounts',
      icon: Building2,
      component: AccountManager,
      description: 'Prop firm account management'
    }
  ];

  // Event handlers
  const handleSidebarToggle = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleViewChange = useCallback((viewId) => {
    setActiveView(viewId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleTradeFormOpen = useCallback(() => {
    setShowTradeForm(true);
  }, []);

  const handleTradeFormClose = useCallback(() => {
    setShowTradeForm(false);
  }, []);

  const handleTradeSubmit = useCallback(async (tradeData) => {
    try {
      console.log('Submitting trade:', tradeData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowTradeForm(false);
      alert('Trade logged successfully!');
      
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Error logging trade. Please try again.');
    }
  }, []);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tradeSyncTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tradeSyncTheme', 'light');
    }
  }, [isDarkMode]);

  // Global functions setup
  useEffect(() => {
    // Expose navigation functions globally if needed
    window.navigateToPage = handleViewChange;
    window.openTradeForm = handleTradeFormOpen;

    // Cleanup
    return () => {
      delete window.navigateToPage;
      delete window.openTradeForm;
    };
  }, [handleViewChange, handleTradeFormOpen]);

  // Handle window resize to close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Keep sidebar behavior consistent
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get active component
  const getActiveComponent = () => {
    const activeItem = navigationItems.find(item => item.id === activeView);
    return activeItem ? activeItem.component : Dashboard;
  };

  const ActiveComponent = getActiveComponent();
  const activeItem = navigationItems.find(item => item.id === activeView);

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={handleSidebarClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-white dark:bg-gray-900 
            border-r border-gray-200 dark:border-gray-800
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:block
            flex flex-col
          `}
        >
          {/* Logo/Brand */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  TradeSync
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Professional Trading Journal
                </p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={handleSidebarClose}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                    text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle & Settings */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Settings */}
            <button
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              
              {/* Left side - Menu toggle and breadcrumb */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSidebarToggle}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
                
                <nav className="hidden lg:block" aria-label="Breadcrumb">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">TradeSync</span>
                    <span className="text-gray-400 dark:text-gray-600">/</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activeItem?.name || 'Dashboard'}
                    </span>
                  </div>
                </nav>
              </div>

              {/* Right side - Quick actions */}
              <div className="flex items-center space-x-4">
                
                {/* Add Trade Button */}
                <button
                  onClick={handleTradeFormOpen}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Add new trade"
                >
                  <TrendingUp size={16} className="mr-2" />
                  Add Trade
                </button>

                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Trader
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Prop Firm Trader
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <ActiveComponent />
            </ErrorBoundary>
          </main>
        </div>

        {/* Trade Form Modal */}
        {showTradeForm && (
          <TradeForm
            isOpen={showTradeForm}
            onClose={handleTradeFormClose}
            onSubmit={handleTradeSubmit}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;