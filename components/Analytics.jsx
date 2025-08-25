import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, DollarSign, BarChart3, Filter, Download,IndianRupee } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Analysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch data from Supabase
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { data: analyticsData, error } = await supabase
        .from('analysis') // Replace with your table name
        .select('date, amount')
        .order('date', { ascending: true });

      if (error) throw error;

      setData(analyticsData || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for different analytics views
  const processDataByPeriod = (period) => {
    if (!data || data.length === 0) return [];

    const groupedData = {};

    data.forEach(item => {
      const date = new Date(item.date);
      let key;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          amount: 0,
          count: 0
        };
      }

      groupedData[key].amount += parseFloat(item.amount || 0);
      groupedData[key].count += 1;
    });

    return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    if (!data || data.length === 0) return { totalRevenue: 0, avgDaily: 0, totalTransactions: 0, growth: 0 };

    const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalTransactions = data.length;
    
    // Calculate daily average
    const uniqueDays = new Set(data.map(item => new Date(item.date).toDateString())).size;
    const avgDaily = uniqueDays > 0 ? totalRevenue / uniqueDays : 0;

    // Calculate growth (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30Days = data.filter(item => new Date(item.date) >= thirtyDaysAgo);
    const previous30Days = data.filter(item => {
      const date = new Date(item.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const last30DaysRevenue = last30Days.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const previous30DaysRevenue = previous30Days.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const growth = previous30DaysRevenue > 0 ? ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100 : 0;

    return { totalRevenue, avgDaily, totalTransactions, growth };
  };

  // Get top performing days
  const getTopPerformingDays = () => {
    if (!data || data.length === 0) return [];

    const dailyData = {};
    data.forEach(item => {
      const date = new Date(item.date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += parseFloat(item.amount || 0);
    });

    return Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const processedData = processDataByPeriod(selectedPeriod);
  const metrics = calculateMetrics();
  const topDays = getTopPerformingDays();

  // Get years available in data
  const availableYears = [...new Set(data.map(item => new Date(item.date).getFullYear()))].sort((a, b) => b - a);

  // Filter data by selected year for daily/monthly views
  const yearFilteredData = selectedPeriod !== 'year' ? 
    processedData.filter(item => item.period.startsWith(selectedYear.toString())) : 
    processedData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-32"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="h-64 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-xl">
            <h3 className="font-bold mb-2">Error Loading Analytics</h3>
            <p>{error}</p>
            <p className="mt-2 text-sm">Please check your Supabase configuration and ensure the 'analysis' table exists with 'date' and 'amount' columns.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
            Hotel Revenue Analytics
          </h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-600" size={20} />
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            
            {selectedPeriod !== 'year' && (
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-600" size={20} />
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={fetchAnalyticsData}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-lg">
                <IndianRupee className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Daily Average</p>
                <p className="text-2xl font-bold text-gray-800">₹{metrics.avgDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">{metrics.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-400 to-amber-400 p-3 rounded-lg">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-amber-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Growth (30d)</p>
                <p className={`text-2xl font-bold ${metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.growth >= 0 ? '+' : ''}{metrics.growth.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${metrics.growth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-black-800 text-black mb-4 ">
              Revenue Trend ({selectedPeriod === 'day' ? 'Daily' : selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearFilteredData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (selectedPeriod === 'month') {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                    }
                    if (selectedPeriod === 'day') {
                      return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                    }
                    return value;
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label) => {
                    if (selectedPeriod === 'month') {
                      const [year, month] = label.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                    }
                    if (selectedPeriod === 'day') {
                      return new Date(label).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    }
                    return label;
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f97316', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#f97316" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Count Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearFilteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    if (selectedPeriod === 'month') {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
                    }
                    if (selectedPeriod === 'day') {
                      return new Date(value).toLocaleDateString('en-IN', { day: 'numeric' });
                    }
                    return value;
                  }}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [value, 'Transactions']}
                  labelFormatter={(label) => {
                    if (selectedPeriod === 'month') {
                      const [year, month] = label.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                    }
                    if (selectedPeriod === 'day') {
                      return new Date(label).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    }
                    return label;
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f59e0b', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Days */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Performing Days</h3>
            <div className="space-y-3">
              {topDays.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      index === 1 ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                      'bg-gradient-to-r from-orange-300 to-amber-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800">₹{day.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Distribution (if showing daily data) */}
          {selectedPeriod === 'day' && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={processDataByPeriod('month').filter(item => item.period.startsWith(selectedYear.toString()))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({ period, percent }) => {
                      const [year, month] = period.split('-');
                      const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
                      return `${monthName} ${(percent * 100).toFixed(0)}%`;
                    }}
                  >
                    {processDataByPeriod('month').filter(item => item.period.startsWith(selectedYear.toString())).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${25 + index * 15}, 70%, ${60 - index * 5}%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue Summary */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-700 font-medium">Highest {selectedPeriod === 'day' ? 'Day' : selectedPeriod === 'month' ? 'Month' : 'Year'}</span>
                <div className="text-right">
                  <div className="text-green-700 font-bold">
                    ₹{Math.max(...yearFilteredData.map(d => d.amount)).toLocaleString('en-IN')}
                  </div>
                  <div className="text-green-600 text-xs">
                    {yearFilteredData.find(d => d.amount === Math.max(...yearFilteredData.map(d => d.amount)))?.period}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-700 font-medium">Average Revenue</span>
                <div className="text-blue-700 font-bold">
                  ₹{(yearFilteredData.reduce((sum, d) => sum + d.amount, 0) / yearFilteredData.length || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-purple-700 font-medium">Total Periods</span>
                <div className="text-purple-700 font-bold">{yearFilteredData.length}</div>
              </div>

              {yearFilteredData.length > 1 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700 font-medium">Trend</span>
                  <div className={`font-bold ${
                    yearFilteredData[yearFilteredData.length - 1]?.amount > yearFilteredData[0]?.amount ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {yearFilteredData[yearFilteredData.length - 1]?.amount > yearFilteredData[0]?.amount ? '↗ Increasing' : '↘ Decreasing'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500">
            <h3 className="text-xl font-bold text-white">Detailed Analytics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yearFilteredData.slice(-10).reverse().map((item, index) => (
                  <tr key={item.period} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {selectedPeriod === 'month' ? 
                        (() => {
                          const [year, month] = item.period.split('-');
                          return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                        })() :
                        selectedPeriod === 'day' ? 
                        new Date(item.period).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) :
                        item.period
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₹{(item.amount / item.count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {yearFilteredData.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing latest 10 entries. Total: {yearFilteredData.length} periods
            </div>
          )}
        </div>

        {/* Setup Instructions (if no data) */}
        
      </div>
    </div>
  );
};

export default Analysis;