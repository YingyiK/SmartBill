import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';
import { expenseAPI } from '../services/api';
import './ExpenseDetail.css';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editedExpense, setEditedExpense] = useState(null);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getExpenses(100, 0);
      const found = response.expenses?.find(e => e.id === id);
      if (!found) {
        setError('Expense not found');
        return;
      }
      setExpense(found);
      setEditedExpense({ ...found });
    } catch (err) {
      setError(err.message || 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Note: Update API endpoint would need to be implemented in backend
      // For now, we'll just update locally
      // await expenseAPI.updateExpense(id, editedExpense);
      
      setExpense(editedExpense);
      setEditing(false);
      alert('Expense updated successfully! (Note: Full update API needs to be implemented)');
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedExpense({ ...expense });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await expenseAPI.deleteExpense(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to delete expense');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editedExpense.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedExpense({ ...editedExpense, items: newItems });
  };

  const handleAddItem = () => {
    const newItems = [...editedExpense.items, { name: '', price: 0, quantity: 1 }];
    setEditedExpense({ ...editedExpense, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = editedExpense.items.filter((_, i) => i !== index);
    setEditedExpense({ ...editedExpense, items: newItems });
  };

  if (loading) {
    return (
      <div className="expense-detail-page">
        <div className="loading-state">
          <p>Loading expense...</p>
        </div>
      </div>
    );
  }

  if (error && !expense) {
    return (
      <div className="expense-detail-page">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const displayExpense = editing ? editedExpense : expense;

  return (
    <div className="expense-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="header-actions">
          {!editing ? (
            <>
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <Edit size={16} />
                Edit
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="btn-cancel" onClick={handleCancel}>
                <X size={16} />
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="detail-content">
        <div className="detail-section">
          <h2>Expense Details</h2>
          
          <div className="detail-field">
            <label>Store Name</label>
            {editing ? (
              <input
                type="text"
                value={displayExpense.store_name || ''}
                onChange={(e) => setEditedExpense({ ...editedExpense, store_name: e.target.value })}
                className="detail-input"
              />
            ) : (
              <div className="detail-value">{displayExpense.store_name || 'N/A'}</div>
            )}
          </div>

          <div className="detail-field">
            <label>Total Amount</label>
            {editing ? (
              <input
                type="number"
                step="0.01"
                value={displayExpense.total_amount || ''}
                onChange={(e) => setEditedExpense({ ...editedExpense, total_amount: parseFloat(e.target.value) || 0 })}
                className="detail-input"
              />
            ) : (
              <div className="detail-value">${displayExpense.total_amount?.toFixed(2) || '0.00'}</div>
            )}
          </div>

          {displayExpense.subtotal && (
            <div className="detail-field">
              <label>Subtotal</label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={displayExpense.subtotal || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, subtotal: parseFloat(e.target.value) || null })}
                  className="detail-input"
                />
              ) : (
                <div className="detail-value">${displayExpense.subtotal.toFixed(2)}</div>
              )}
            </div>
          )}

          {displayExpense.tax_amount && (
            <div className="detail-field">
              <label>Tax Amount</label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={displayExpense.tax_amount || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, tax_amount: parseFloat(e.target.value) || null })}
                  className="detail-input"
                />
              ) : (
                <div className="detail-value">${displayExpense.tax_amount.toFixed(2)}</div>
              )}
            </div>
          )}

          <div className="detail-field">
            <label>Created At</label>
            <div className="detail-value">
              {new Date(displayExpense.created_at).toLocaleString()}
            </div>
          </div>

          {displayExpense.transcript && (
            <div className="detail-field">
              <label>Voice Transcript</label>
              <div className="detail-value transcript-text">
                {displayExpense.transcript}
              </div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Items ({displayExpense.items?.length || 0})</h2>
            {editing && (
              <button className="btn-add-item" onClick={handleAddItem}>
                + Add Item
              </button>
            )}
          </div>

          {displayExpense.items && displayExpense.items.length > 0 ? (
            <div className="items-list">
              {displayExpense.items.map((item, index) => (
                <div key={index} className="item-row">
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="item-input name-input"
                        placeholder="Item name"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="item-input price-input"
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        step="1"
                        value={item.quantity || 1}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="item-input qty-input"
                        placeholder="Qty"
                      />
                      <button
                        className="btn-remove-item"
                        onClick={() => handleRemoveItem(index)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="item-name">{item.name}</div>
                      <div className="item-qty">Qty: {item.quantity || 1}</div>
                      <div className="item-price">${item.price?.toFixed(2) || '0.00'}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-items">
              <p>No items in this expense</p>
            </div>
          )}
        </div>

        {displayExpense.participants && displayExpense.participants.length > 0 && (
          <div className="detail-section">
            <h2>Participants ({displayExpense.participants.length})</h2>
            <div className="participants-list">
              {displayExpense.participants.map((participant, index) => (
                <div key={index} className="participant-item">
                  <div className="participant-name">{participant.name}</div>
                  {participant.items && participant.items.length > 0 && (
                    <div className="participant-items">
                      Items: {participant.items.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetail;

