import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { Receipt, DollarSign, Users, Filter } from 'lucide-react';
import './History.css';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 模拟费用数据（目前为空）
  const [expenses, setExpenses] = useState([]);

  // 统计数据
  const stats = {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    uniqueParticipants: new Set(expenses.flatMap(exp => exp.participants)).size
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
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description="Create your first expense to get started"
          />
        ) : (
          <div className="expenses-list">
            {/* 这里将来会显示费用列表 */}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;