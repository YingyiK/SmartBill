import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, DollarSign, Users, TrendingUp, Plus, FileText, Trash2, Share2, Eye } from "lucide-react";
import { expenseAPI } from "../services/api";
import SplitBillModal from "../components/SplitBillModal";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'shared'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    activeParticipants: 0,
    avgPerExpense: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadExpenses(),
      loadSharedExpenses()
    ]);
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getExpenses(50, 0);
      setExpenses(response.expenses || []);
      
      // Calculate stats
      const totalExpenses = response.total || 0;
      const totalAmount = (response.expenses || []).reduce((sum, exp) => sum + (exp.total_amount || 0), 0);
      const avgPerExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
      
      // Count unique participants
      const allParticipants = new Set();
      (response.expenses || []).forEach(exp => {
        (exp.participants || []).forEach(p => allParticipants.add(p.name));
      });
      
      setStats({
        totalExpenses,
        totalAmount,
        activeParticipants: allParticipants.size,
        avgPerExpense
      });
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedExpenses = async () => {
    try {
      const response = await expenseAPI.getSharedExpenses(50, 0);
      setSharedExpenses(response.expenses || []);
    } catch (error) {
      console.error('Failed to load shared expenses:', error);
    }
  };

  const handleDeleteExpense = async (expenseId, expenseName) => {
    if (!window.confirm(`Are you sure you want to delete this expense from ${expenseName || 'Unknown Store'}? This action cannot be undone.`)) {
      return;
    }

    try {
      await expenseAPI.deleteExpense(expenseId);
      await loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert(`Failed to delete expense: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSplitBill = (expense) => {
    setSelectedExpense(expense);
    setIsSplitModalOpen(true);
  };

  const handleSplitSuccess = () => {
    loadAllData(); // Reload all data
  };

  const statsData = [
    {
      icon: <Receipt size={24} />,
      value: stats.totalExpenses.toString(),
      label: "Total Expenses",
      change: "",
      color: "#2563eb"
    },
    {
      icon: <DollarSign size={24} />,
      value: `$${stats.totalAmount.toFixed(2)}`,
      label: "Total Amount",
      change: "",
      color: "#10b981"
    },
    {
      icon: <Users size={24} />,
      value: stats.activeParticipants.toString(),
      label: "Active Participants",
      change: "",
      color: "#a855f7"
    },
    {
      icon: <TrendingUp size={24} />,
      value: `$${stats.avgPerExpense.toFixed(2)}`,
      label: "Avg. per Expense",
      change: "",
      color: "#f97316"
    }
  ];

  const displayExpenses = activeTab === 'my' ? expenses : sharedExpenses;

  return (
    <main className="main">
      <div className="header">
        <h2>Dashboard</h2>
        <button className="btn" onClick={() => navigate('/new-expense')}>
          + New Expense
        </button>
      </div>
      <p className="subtext">Welcome back! Here's your expense overview.</p>

      <div className="cards-row">
        {statsData.map((stat, index) => (
          <div className="card" key={index}>
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              {stat.change && <div className="card-change">{stat.change}</div>}
            </div>
            <div className="card-label">{stat.label}</div>
            <div className="card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="recent-box">
        <div className="expenses-header">
          <h3>Expenses</h3>
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              <Receipt size={16} />
              My Expenses ({expenses.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveTab('shared')}
            >
              <Share2 size={16} />
              Shared with Me ({sharedExpenses.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading expenses...</p>
          </div>
        ) : displayExpenses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Receipt size={48} color="#d1d5db" />
            </div>
            <div className="empty-text">
              {activeTab === 'my' ? 'No expenses yet' : 'No shared expenses yet'}
            </div>
            <p className="empty-subtext">
              {activeTab === 'my' 
                ? 'Create your first expense to get started'
                : 'When friends split bills with you, they\'ll appear here'}
            </p>
            {activeTab === 'my' && (
              <button className="btn" onClick={() => navigate('/new-expense')}>
                + Create Your First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="expenses-list">
            {displayExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div 
                  className="expense-main"
                  onClick={() => navigate(`/expense/${expense.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="expense-header">
                    <div className="expense-store">{expense.store_name || 'Unknown Store'}</div>
                    <div className="expense-amount">${expense.total_amount.toFixed(2)}</div>
                  </div>
                  <div className="expense-details">
                    <div className="expense-date">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </div>
                    {expense.items && expense.items.length > 0 && (
                      <div className="expense-items-count">
                        {expense.items.length} items
                      </div>
                    )}
                    {expense.transcript && (
                      <div className="expense-transcript">
                        💬 {expense.transcript.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="expense-actions" onClick={(e) => e.stopPropagation()}>
                  {activeTab === 'my' ? (
                    <>
                      <button
                        className="action-btn split-btn"
                        onClick={() => handleSplitBill(expense)}
                        title="Split & send bills"
                      >
                        <Share2 size={16} />
                        Split
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteExpense(expense.id, expense.store_name)}
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn view-btn"
                      onClick={() => navigate(`/expense/${expense.id}`)}
                      title="View expense"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-row">
        <div className="box" onClick={() => navigate('/new-expense')}>
          <div className="box-icon blue">
            <Plus size={24} />
          </div>
          <h4>Create Expense</h4>
          <p>Upload a bill and split expenses with AI</p>
        </div>
        <div className="box" onClick={() => navigate('/participants')}>
          <div className="box-icon purple">
            <Users size={24} />
          </div>
          <h4>Manage Contacts</h4>
          <p>Add friends to split bills with</p>
        </div>
        <div className="box" onClick={() => navigate('/history')}>
          <div className="box-icon green">
            <FileText size={24} />
          </div>
          <h4>View History</h4>
          <p>Browse all past expenses and splits</p>
        </div>
      </div>

      {/* Split Bill Modal */}
      {isSplitModalOpen && selectedExpense && (
        <SplitBillModal
          isOpen={isSplitModalOpen}
          onClose={() => {
            setIsSplitModalOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          onSuccess={handleSplitSuccess}
        />
      )}
    </main>
  );
}
