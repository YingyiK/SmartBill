// History.js  –  零 CSS 文件，纯 Tailwind
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { Receipt, DollarSign, Users, Filter, Eye } from 'lucide-react';
import { expenseAPI } from '../services/api';

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
      const res = await expenseAPI.getExpenses(100, 0);
      setExpenses(res.expenses || []);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  const filtered = expenses.filter((exp) => {
    const matches =
      !searchTerm ||
      exp.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.transcript?.toLowerCase().includes(searchTerm.toLowerCase());
    // statusFilter 暂留（后端无 status 字段）
    return matches;
  });

  // 统计数据
  const stats = {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + (e.total_amount || 0), 0),
    uniqueParticipants: new Set(
      expenses.flatMap((e) => (e.participants || []).map((p) => p.name))
    ).size,
  };

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense History</h1>
        <p className="text-base text-gray-500">View and manage all your past expenses</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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

      {/* 搜索 + 状态筛选 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
        <SearchBar
          value={searchTerm}
          onChange={(v) => setSearchTerm(v)}
          placeholder="Search expenses..."
        />

        <div className="relative flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 min-w-[160px]">
          <Filter size={20} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-0 outline-none py-3 text-sm text-gray-900 bg-transparent cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded-xl min-h-[400px] flex items-center justify-center">
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading expenses...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center py-16">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadExpenses}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={
              searchTerm
                ? 'Try adjusting your search terms'
                : 'Create your first expense to get started'
            }
          />
        ) : (
          <div className="w-full p-6 space-y-4">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:shadow-lg hover:border-blue-500 transition"
                onClick={() => navigate(`/expense/${exp.id}`)}
              >
                {/* 头部 */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{exp.store_name || 'Unknown Store'}</h3>
                  <span className="text-xl font-bold text-emerald-600">${exp.total_amount?.toFixed(2) || '0.00'}</span>
                </div>

                {/* 详情行 */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                  <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                  {exp.items?.length > 0 && <span>{exp.items.length} items</span>}
                  {exp.participants?.length > 0 && <span>{exp.participants.length} participant{exp.participants.length > 1 ? 's' : ''}</span>}
                </div>

                {/* 语音转录 */}
                {exp.transcript && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
                    💬 {exp.transcript.slice(0, 100)}
                    {exp.transcript.length > 100 && '…'}
                  </div>
                )}

                {/* 查看按钮 */}
                <button
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/expense/${exp.id}`);
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
    </main>
  );
};

export default History;