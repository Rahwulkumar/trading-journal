// 🚀 App.jsx - Complete TradeSync Application with shadcn/ui
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

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';

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
import './globals.css';

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

  // Theme effect - force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('tradeSyncTheme', 'dark');
  }, []);

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
        setIsSidebarOpen(false);
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
      <div className="flex h-screen bg-black overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={handleSidebarClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-black 
            border-r border-gray-800
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:block
            flex flex-col
          `}
        >
          {/* Logo/Brand */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  TradeSync
                </h1>
                <p className="text-xs text-gray-400">
                  Professional Trading Journal
                </p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarClose}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => handleViewChange(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 h-auto
                    text-left justify-start transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-white' : 'text-gray-400'} 
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Theme Toggle & Settings */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            {/* Settings */}
            <Button
              variant="ghost"
              className="w-full flex items-center space-x-3 px-4 py-3 h-auto justify-start text-gray-300 hover:bg-gray-900 hover:text-white"
              aria-label="Settings"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header */}
          <header className="bg-black border-b border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              
              {/* Left side - Menu toggle and breadcrumb */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSidebarToggle}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </Button>
                
                <nav className="hidden lg:block" aria-label="Breadcrumb">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">TradeSync</span>
                    <span className="text-gray-600">/</span>
                    <span className="font-medium text-white">
                      {activeItem?.name || 'Dashboard'}
                    </span>
                  </div>
                </nav>
              </div>

              {/* Right side - Quick actions */}
              <div className="flex items-center space-x-4">
                
                {/* Add Trade Button */}
                <Button
                  onClick={handleTradeFormOpen}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm hover:shadow-md"
                  aria-label="Add new trade"
                >
                  <TrendingUp size={16} className="mr-2" />
                  Add Trade
                </Button>

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
          <main className="flex-1 overflow-auto bg-black">
            <ErrorBoundary>
              <ActiveComponent />
            </ErrorBoundary>
          </main>
        </div>

        {/* Trade Form Modal */}
        <Dialog open={showTradeForm} onOpenChange={setShowTradeForm}>
          <DialogContent className="bg-black border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Trade</DialogTitle>
            </DialogHeader>
            <TradeForm
              isOpen={showTradeForm}
              onClose={handleTradeFormClose}
              onSubmit={handleTradeSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default App;