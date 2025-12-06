import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';
import { expenseAPI } from '../services/api';

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
    (async () => {
      setLoading(true);
      try {
        const res = await expenseAPI.getExpenses(100, 0);
        const found = res.expenses?.find((e) => e.id === id);
        if (!found) throw new Error('Expense not found');
        setExpense(found);
        setEditedExpense({ ...found });
      } catch (err) {
        setError(err.message || 'Failed to load expense');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: implement updateExpense endpoint
      // await expenseAPI.updateExpense(id, editedExpense);
      setExpense(editedExpense);
      setEditing(false);
      alert('Expense updated! (Full API pending)');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedExpense({ ...expense });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.deleteExpense(id);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const handleItemChange = (idx, field, val) => {
    const items = [...editedExpense.items];
    items[idx][field] = field === 'price' ? parseFloat(val) || 0 : field === 'quantity' ? parseInt(val) || 1 : val;
    setEditedExpense({ ...editedExpense, items });
  };

  const handleAddItem = () =>
    setEditedExpense({ ...editedExpense, items: [...(editedExpense.items || []), { name: '', price: 0, quantity: 1 }] });

  const handleRemoveItem = (idx) =>
    setEditedExpense({ ...editedExpense, items: editedExpense.items.filter((_, i) => i !== idx) });

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center text-gray-500">Loading expense...</div>
    );

  if (error && !expense)
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );

  const display = editing ? editedExpense : expense;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}

      <div className="space-y-6">
        {/* Details */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              {editing ? (
                <input
                  value={display.store_name || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, store_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900">{display.store_name || 'N/A'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={display.total_amount || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900 font-semibold">${display.total_amount?.toFixed(2) || '0.00'}</div>
              )}
            </div>

            {display.subtotal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={display.subtotal || ''}
                    onChange={(e) => setEditedExpense({ ...editedExpense, subtotal: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">${display.subtotal.toFixed(2)}</div>
                )}
              </div>
            )}

            {display.tax_amount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={display.tax_amount || ''}
                    onChange={(e) => setEditedExpense({ ...editedExpense, tax_amount: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">${display.tax_amount.toFixed(2)}</div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
              <div className="text-gray-900">{new Date(display.created_at).toLocaleString()}</div>
            </div>
          </div>

          {display.transcript && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Transcript</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 italic">
                {display.transcript}
              </div>
            </div>
          )}
        </section>

        {/* Items */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Items ({display.items?.length || 0})</h2>
            {editing && (
              <button
                onClick={handleAddItem}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
              >
                + Add Item
              </button>
            )}
          </div>

          {display.items?.length ? (
            <div className="space-y-3">
              {display.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {editing ? (
                    <>
                      <input
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        placeholder="Item name"
                        className="flex-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                        placeholder="Price"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-2 font-medium text-gray-900">{item.name}</div>
                      <div className="flex-1 text-gray-500">Qty: {item.quantity}</div>
                      <div className="flex-1 font-semibold text-emerald-600 text-right">${item.price.toFixed(2)}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">No items in this expense</div>
          )}
        </section>

        {/* Participants */}
        {display.participants?.length > 0 && (
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Participants ({display.participants.length})</h2>
            <div className="space-y-3">
              {display.participants.map((p, i) => (
                <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="font-semibold text-gray-900">{p.name}</div>
                  {p.items?.length > 0 && <div className="text-sm text-gray-500 mt-1">Items: {p.items.join(', ')}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetail;