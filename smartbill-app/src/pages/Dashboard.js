import React from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, DollarSign, Users, TrendingUp, Plus, FileText } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      icon: <Receipt size={24} />,
      value: "0",
      label: "Total Expenses",
      change: "+12%",
      color: "#2563eb"
    },
    {
      icon: <DollarSign size={24} />,
      value: "$0.00",
      label: "Total Amount",
      change: "+8%",
      color: "#10b981"
    },
    {
      icon: <Users size={24} />,
      value: "4",
      label: "Active Participants",
      change: "+3",
      color: "#a855f7"
    },
    {
      icon: <TrendingUp size={24} />,
      value: "$0.00",
      label: "Avg. per Expense",
      change: "+5%",
      color: "#f97316"
    }
  ];

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
        {stats.map((stat, index) => (
          <div className="card" key={index}>
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              <div className="card-change">{stat.change}</div>
            </div>
            <div className="card-label">{stat.label}</div>
            <div className="card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="recent-box">
        <h3>Recent Expenses</h3>

        <div className="empty">
          <div className="empty-icon">
            <Receipt size={48} color="#d1d5db" />
          </div>
          <div className="empty-text">No expenses yet</div>
          <button className="btn" onClick={() => navigate('/new-expense')}>
            + Create Your First Expense
          </button>
        </div>
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
          <h4>Manage Participants</h4>
          <p>Add or edit participant information</p>
        </div>
        <div className="box" onClick={() => navigate('/history')}>
          <div className="box-icon green">
            <FileText size={24} />
          </div>
          <h4>View History</h4>
          <p>Browse all past expenses and splits</p>
        </div>
      </div>
    </main>
  );
}