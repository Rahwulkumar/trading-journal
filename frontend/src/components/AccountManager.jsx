// 🏦 AccountManager.jsx - Prop Firm Account Control Center
// Location: components/AccountManager.jsx

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import TradingCard from './ui/TradingCard';
import TradingButton from './ui/TradingButton';
import TradingInput from './ui/TradingInput';

const AccountManager = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 'ftmo-001',
      name: 'FTMO Challenge',
      propFirm: 'FTMO',
      accountType: 'Challenge',
      initialBalance: 100000,
      currentBalance: 103250,
      maxDailyLoss: 5000,
      maxTotalLoss: 10000,
      dailyPnL: 450,
      totalPnL: 3250,
      tradingDays: 28,
      phase: 'Phase 1',
      status: 'active',
      rules: {
        minTradingDays: 4,
        profitTarget: 10000,
        maxDailyDrawdown: 5,
        maxTotalDrawdown: 10,
        weekendHolding: false,
        newsTrading: false
      },
      metrics: {
        dailyDrawdown: 1.2,
        totalDrawdown: 2.1,
        profitProgress: 32.5,
        riskScore: 'low'
      }
    },
    {
      id: 'mff-002',
      name: 'MyForexFunds Evaluation',
      propFirm: 'MyForexFunds',
      accountType: 'Evaluation',
      initialBalance: 200000,
      currentBalance: 208750,
      maxDailyLoss: 10000,
      maxTotalLoss: 20000,
      dailyPnL: -250,
      totalPnL: 8750,
      tradingDays: 15,
      phase: 'Evaluation',
      status: 'active',
      rules: {
        minTradingDays: 5,
        profitTarget: 16000,
        maxDailyDrawdown: 5,
        maxTotalDrawdown: 10,
        weekendHolding: true,
        newsTrading: true
      },
      metrics: {
        dailyDrawdown: 0.1,
        totalDrawdown: 0.8,
        profitProgress: 54.7,
        riskScore: 'low'
      }
    }
  ]);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  // New account form state
  const [newAccount, setNewAccount] = useState({
    name: '',
    propFirm: '',
    accountType: '',
    initialBalance: '',
    maxDailyLoss: '',
    maxTotalLoss: '',
    profitTarget: '',
    minTradingDays: ''
  });

  const propFirms = [
    'FTMO', 'MyForexFunds', 'The Funded Trader', 'Apex Trader Funding', 
    'TopStep', 'Fidelcrest', 'FundedNext', 'True Forex Funds'
  ];

  // Load accounts from localStorage on component mount
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const savedAccounts = JSON.parse(localStorage.getItem('tradesync_accounts') || '[]');
        if (savedAccounts.length > 0) {
          setAccounts(savedAccounts);
          console.log('Loaded saved accounts:', savedAccounts.length);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  // Calculate risk status for an account
  const getRiskStatus = (account) => {
    const { dailyDrawdown, totalDrawdown } = account.metrics;
    
    if (dailyDrawdown >= 4 || totalDrawdown >= 8) return 'danger';
    if (dailyDrawdown >= 3 || totalDrawdown >= 6) return 'warning';
    return 'safe';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 dark:text-green-400',
      paused: 'text-amber-600 dark:text-amber-400',
      violated: 'text-red-600 dark:text-red-400',
      completed: 'text-blue-600 dark:text-blue-400'
    };
    return colors[status] || colors.active;
  };

  // Updated handleAddAccount function
  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.propFirm) {
      alert('Please fill in account name and prop firm');
      return;
    }

    const account = {
      id: `${newAccount.propFirm.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newAccount.name,
      propFirm: newAccount.propFirm,
      accountType: newAccount.accountType || 'Challenge',
      initialBalance: parseFloat(newAccount.initialBalance) || 100000,
      currentBalance: parseFloat(newAccount.initialBalance) || 100000,
      maxDailyLoss: parseFloat(newAccount.maxDailyLoss) || 5000,
      maxTotalLoss: parseFloat(newAccount.maxTotalLoss) || 10000,
      dailyPnL: 0,
      totalPnL: 0,
      tradingDays: 0,
      phase: 'Challenge',
      status: 'active',
      metrics: {
        dailyDrawdown: 0,
        totalDrawdown: 0,
        profitProgress: 0,
        riskScore: 'low'
      },
      createdAt: new Date().toISOString(),
      rules: {
        minTradingDays: parseInt(newAccount.minTradingDays) || 5,
        profitTarget: parseFloat(newAccount.profitTarget) || 10000,
        maxDailyDrawdown: 5,
        maxTotalDrawdown: 10,
        weekendHolding: false,
        newsTrading: true
      }
    };

    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    
    // Save to localStorage
    try {
      localStorage.setItem('tradesync_accounts', JSON.stringify(updatedAccounts));
      console.log('Account saved:', account);
      alert('Account added successfully!');
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error saving account');
    }

    // Reset form
    setNewAccount({
      name: '', propFirm: '', accountType: '', initialBalance: '',
      maxDailyLoss: '', maxTotalLoss: '', profitTarget: '', minTradingDays: ''
    });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Account Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your prop firm trading accounts and monitor compliance
            </p>
          </div>
          
          <TradingButton 
            variant="primary" 
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} className="mr-2" />
            Add Account
          </TradingButton>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {accounts.map((account) => {
          const riskStatus = getRiskStatus(account);
          const isDetailsVisible = showDetails[account.id];
          
          return (
            <TradingCard 
              key={account.id}
              variant={riskStatus === 'safe' ? 'account' : riskStatus === 'warning' ? 'warning' : 'loss'}
              title={account.name}
              subtitle={`${account.propFirm} • ${account.accountType}`}
              badge={account.phase}
              status={riskStatus === 'safe' ? 'success' : riskStatus === 'warning' ? 'warning' : 'error'}
              hoverable
              clickable
              onClick={() => setSelectedAccount(account)}
            >
              <div className="space-y-4">
                
                {/* Balance & P&L */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      ${account.currentBalance.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
                    <div className={`text-lg font-bold ${
                      account.totalPnL > 0 ? 'text-green-600 dark:text-green-400' : 
                      account.totalPnL < 0 ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {account.totalPnL > 0 ? '+' : ''}${account.totalPnL.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Daily P&L */}
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Today's P&L:</span>
                  <span className={`font-medium ${
                    account.dailyPnL > 0 ? 'text-green-600 dark:text-green-400' : 
                    account.dailyPnL < 0 ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {account.dailyPnL > 0 ? '+' : ''}${account.dailyPnL}
                  </span>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Daily Drawdown:</span>
                    <span className={`font-medium ${
                      account.metrics.dailyDrawdown < 3 ? 'text-green-600 dark:text-green-400' :
                      account.metrics.dailyDrawdown < 4 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {account.metrics.dailyDrawdown.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Drawdown:</span>
                    <span className={`font-medium ${
                      account.metrics.totalDrawdown < 6 ? 'text-green-600 dark:text-green-400' :
                      account.metrics.totalDrawdown < 8 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {account.metrics.totalDrawdown.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Profit Progress:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {account.metrics.profitProgress.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <TradingButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(prev => ({ ...prev, [account.id]: !prev[account.id] }));
                    }}
                  >
                    {isDetailsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </TradingButton>
                  
                  <TradingButton variant="ghost" size="sm">
                    <Edit size={14} />
                  </TradingButton>
                  
                  <TradingButton variant="ghost" size="sm">
                    <Settings size={14} />
                  </TradingButton>
                </div>

                {/* Detailed View */}
                {isDetailsVisible && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Account Rules & Limits
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Max Daily Loss:</span>
                        <div className="font-medium">${account.maxDailyLoss.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Max Total Loss:</span>
                        <div className="font-medium">${account.maxTotalLoss.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Trading Days:</span>
                        <div className="font-medium">{account.tradingDays}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <div className={`font-medium capitalize ${getStatusColor(account.status)}`}>
                          {account.status}
                        </div>
                      </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Rule Compliance
                      </div>
                      <div className="space-y-1">
                        {account.rules && Object.entries(account.rules).map(([rule, compliant]) => (
                          <div key={rule} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {rule.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            {typeof compliant === 'boolean' ? (
                              compliant ? (
                                <CheckCircle size={12} className="text-green-500" />
                              ) : (
                                <XCircle size={12} className="text-red-500" />
                              )
                            ) : (
                              <span className="text-gray-600 dark:text-gray-400">{compliant}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TradingCard>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Add New Prop Firm Account
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TradingInput
                  label="Account Name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., FTMO Challenge #1"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prop Firm *
                  </label>
                  <select
                    value={newAccount.propFirm}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, propFirm: e.target.value }))}
                    className="w-full h-10 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Prop Firm</option>
                    {propFirms.map(firm => (
                      <option key={firm} value={firm}>{firm}</option>
                    ))}
                  </select>
                </div>

                <TradingInput
                  label="Account Type"
                  value={newAccount.accountType}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, accountType: e.target.value }))}
                  placeholder="e.g., Challenge, Evaluation"
                  required
                />

                <TradingInput
                  label="Initial Balance"
                  type="number"
                  value={newAccount.initialBalance}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, initialBalance: e.target.value }))}
                  variant="currency"
                  prefix="$"
                  required
                />

                <TradingInput
                  label="Max Daily Loss"
                  type="number"
                  value={newAccount.maxDailyLoss}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, maxDailyLoss: e.target.value }))}
                  variant="loss"
                  prefix="$"
                  required
                />

                <TradingInput
                  label="Max Total Loss"
                  type="number"
                  value={newAccount.maxTotalLoss}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, maxTotalLoss: e.target.value }))}
                  variant="loss"
                  prefix="$"
                  required
                />

                <TradingInput
                  label="Profit Target"
                  type="number"
                  value={newAccount.profitTarget}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, profitTarget: e.target.value }))}
                  variant="profit"
                  prefix="$"
                />

                <TradingInput
                  label="Min Trading Days"
                  type="number"
                  value={newAccount.minTradingDays}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, minTradingDays: e.target.value }))}
                  suffix="days"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <TradingButton
                  variant="primary"
                  onClick={handleAddAccount}
                  disabled={!newAccount.name || !newAccount.propFirm || !newAccount.initialBalance}
                  className="flex-1"
                >
                  <Building2 size={16} className="mr-2" />
                  Add Account
                </TradingButton>
                
                <TradingButton
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </TradingButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <TradingCard title="Total Accounts" variant="info">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {accounts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active trading accounts
          </div>
        </TradingCard>

        <TradingCard title="Total Balance" variant="account">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${accounts.reduce((sum, acc) => sum + acc.currentBalance, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Combined account value
          </div>
        </TradingCard>

        <TradingCard title="Total P&L" variant="auto" pnl={accounts.reduce((sum, acc) => sum + acc.totalPnL, 0)}>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${accounts.reduce((sum, acc) => sum + acc.totalPnL, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Combined profit/loss
          </div>
        </TradingCard>

        <TradingCard title="Active Challenges" variant="performance">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {accounts.filter(acc => acc.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Currently trading
          </div>
        </TradingCard>
      </div>
    </div>
  );
};

export default AccountManager;