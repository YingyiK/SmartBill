import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { Receipt, DollarSign, Users, Filter, Eye } from 'lucide-react';
import { expenseAPI } from '../services/api';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expenseAPI.getExpenses(100, 0);
      setExpenses(response.expenses || []);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm || 
      expense.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.transcript?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Note: statusFilter would need expense status field in the data model
    return matchesSearch;
  });

  // 统计数据
  const stats = {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + (exp.total_amount || 0), 0),
    uniqueParticipants: new Set(expenses.flatMap(exp => (exp.participants || []).map(p => p.name))).size
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className="history-page">
      {/* 页面标题 */}
      <div className="history-header">
        <div>
          <h1 className="history-title">Expense History</h1>
          <p className="history-subtitle">View and manage all your past expenses</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <StatCard
          icon={Receipt}
          iconColor="#3B82F6"
          iconBgColor="#EFF6FF"
          label="Total Expenses"
          value={stats.totalExpenses}
        />
        <StatCard
          icon={DollarSign}
          iconColor="#10B981"
          iconBgColor="#D1FAE5"
          label="Total Amount"
          value={`$${stats.totalAmount.toFixed(2)}`}
        />
        <StatCard
          icon={Users}
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
          label="Unique Participants"
          value={stats.uniqueParticipants}
        />
      </div>

      {/* 搜索和筛选 */}
      <div className="search-filter-container">
        <SearchBar 
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search expenses..."
        />
        
        <div className="filter-dropdown">
          <Filter size={20} className="filter-icon" />
          <select 
            value={statusFilter} 
            onChange={handleFilterChange}
            className="status-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 费用列表 / 空状态 */}
      <div className="expenses-container">
        {loading ? (
          <div className="loading-state">
            <p>Loading expenses...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadExpenses} className="retry-btn">Retry</button>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={searchTerm ? "Try adjusting your search terms" : "Create your first expense to get started"}
          />
        ) : (
          <div className="expenses-list">
            {filteredExpenses.map((expense) => (
              <div 
                key={expense.id} 
                className="expense-card"
                onClick={() => navigate(`/expense/${expense.id}`)}
              >
                <div className="expense-card-header">
                  <div className="expense-store">{expense.store_name || 'Unknown Store'}</div>
                  <div className="expense-amount">${expense.total_amount?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="expense-card-details">
                  <div className="expense-date">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </div>
                  {expense.items && expense.items.length > 0 && (
                    <div className="expense-items-count">
                      {expense.items.length} items
                    </div>
                  )}
                  {expense.participants && expense.participants.length > 0 && (
                    <div className="expense-participants">
                      {expense.participants.length} participant{expense.participants.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {expense.transcript && (
                  <div className="expense-transcript">
                    💬 {expense.transcript.substring(0, 100)}{expense.transcript.length > 100 ? '...' : ''}
                  </div>
                )}
                <button 
                  className="view-expense-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/expense/${expense.id}`);
                  }}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;