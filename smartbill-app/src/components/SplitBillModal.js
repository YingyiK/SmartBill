import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Send, Check, Mail } from 'lucide-react';
import { contactsAPI, splitsAPI } from '../services/api';

const SplitBillModal = ({ isOpen, onClose, expense, onSuccess }) => {
  const [allContacts, setAllContacts] = useState([]);
  const [relevantContacts, setRelevantContacts] = useState([]);
  const [existingSplits, setExistingSplits] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [splitCalculations, setSplitCalculations] = useState({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && expense) loadData();
  }, [isOpen, expense]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsRes, splitsRes] = await Promise.all([
        contactsAPI.getContacts(),
        splitsAPI.getSplits(expense.id).catch(() => ({ splits: [] })),
      ]);
      const contacts = contactsRes.contacts || [];
      const splits = splitsRes.splits || [];
      setAllContacts(contacts);
      setExistingSplits(splits);

      const relevant = contacts.filter((c) => {
        if (!expense.participants?.length) return splits.some((s) => s.contact_id === c.id);
        const name = (c.nickname || c.friend_email.split('@')[0]).toLowerCase();
        return expense.participants.some((p) => {
          const pName = p.name.toLowerCase();
          return name === pName || name.includes(pName) || pName.includes(name);
        });
      });
      setRelevantContacts(relevant);

      if (splits.length) {
        const ids = splits.filter((s) => relevant.some((c) => c.id === s.contact_id)).map((s) => s.contact_id);
        setSelectedContactIds(ids);
        const calc = {};
        splits.forEach((s) => {
          if (s.contact_id && relevant.some((c) => c.id === s.contact_id)) {
            calc[s.contact_id] = { amount: s.amount_owed, items: typeof s.items_detail === 'string' ? JSON.parse(s.items_detail) : s.items_detail || [], aaDetails: [] };
          }
        });
        setSplitCalculations(calc);
      } else {
        const calc = calculateSplitsFromParticipants(relevant);
        setSplitCalculations(calc);
      }
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSplitsFromParticipants = (contacts) => {
    if (!expense.participants || !expense.items) return {};
    const calc = {};
    expense.participants.forEach((p) => {
      if (!p.items) return;
      const contact = contacts.find((c) => {
        const name = (c.nickname || c.friend_email.split('@')[0]).toLowerCase();
        return name === p.name.toLowerCase() || name.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(name);
      });
      if (!contact) return;
      let total = 0;
      const items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
      items.forEach((itemName) => {
        const item = expense.items.find((i) => i.name.toLowerCase().trim() === itemName.toLowerCase().trim());
        if (!item) return;
        const shared = expense.participants.filter((pp) => {
          const ppItems = typeof pp.items === 'string' ? JSON.parse(pp.items) : pp.items;
          return ppItems.some((ii) => ii.toLowerCase().trim() === itemName.toLowerCase().trim());
        }).length;
        total += item.price / (shared || 1);
      });
      calc[contact.id] = { amount: total, items, aaDetails: [] };
    });
    return calc;
  };

  const handleToggleContact = (contactId) => {
    setSelectedContactIds((prev) => {
      if (prev.includes(contactId)) {
        const next = { ...splitCalculations };
        delete next[contactId];
        setSplitCalculations(next);
        return prev.filter((id) => id !== contactId);
      } else {
        const contact = relevantContacts.find((c) => c.id === contactId);
        const calc = calculateSplitsFromParticipants([contact]);
        setSplitCalculations((prev) => ({ ...prev, ...calc }));
        return [...prev, contactId];
      }
    });
  };

  const handleSendBills = async () => {
    if (!selectedContactIds.length) return setError('Select at least one person');
    setSending(true);
    try {
      const participants = selectedContactIds.map((id) => {
        const contact = relevantContacts.find((c) => c.id === id);
        const calc = splitCalculations[id];
        return {
          name: contact.nickname || contact.friend_email.split('@')[0],
          email: contact.friend_email,
          contact_id: contact.id,
          amount_owed: calc.amount,
          items_detail: calc.items || [],
        };
      });
      await splitsAPI.createSplits(expense.id, participants);
      const splitsRes = await splitsAPI.getSplits(expense.id);
      const ids = splitsRes.splits.filter((s) => selectedContactIds.includes(s.contact_id)).map((s) => s.id);
      await splitsAPI.sendBills(expense.id, ids);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Failed to send bills: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !expense) return null;
  const selectedContacts = relevantContacts.filter((c) => selectedContactIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Split & Send Bill</h2>
            <p className="text-sm text-gray-500 mt-1">{expense.store_name} - ${expense.total_amount?.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && <div className="mx-6 mt-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading split data...</div>
          ) : (
            <>
              {/* Select Contacts */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Select Friends to Send Bills</h3>
                <p className="text-xs text-gray-500 mb-3">Only contacts related to this expense are shown</p>
                {relevantContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users size={32} className="mx-auto mb-2" />
                    <p>No related contacts found</p>
                    <p className="text-xs mt-1">Make sure participant names match your contacts</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {relevantContacts.map((contact) => {
                      const isSelected = selectedContactIds.includes(contact.id);
                      const calc = splitCalculations[contact.id];
                      return (
                        <div
                          key={contact.id}
                          onClick={() => handleToggleContact(contact.id)}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {(contact.nickname || contact.friend_email)[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{contact.nickname || contact.friend_email.split('@')[0]}</div>
                            {isSelected && calc && <div className="text-xs text-blue-600">${calc.amount.toFixed(2)}</div>}
                          </div>
                          {isSelected && <Check size={16} className="text-blue-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview */}
              {selectedContacts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Bill Preview</h3>
                  <div className="space-y-4">
                    {selectedContacts.map((contact) => {
                      const calc = splitCalculations[contact.id];
                      if (!calc) return null;
                      return (
                        <div key={contact.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                                {(contact.nickname || contact.friend_email)[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{contact.nickname || contact.friend_email.split('@')[0]}</div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Mail size={12} />
                                  {contact.friend_email}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Total</div>
                              <div className="text-2xl font-bold text-emerald-600">${calc.amount.toFixed(2)}</div>
                            </div>
                          </div>
                          {calc.items?.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-2">Items:</div>
                              <div className="space-y-2">
                                {calc.aaDetails?.map((aa, idx) => (
                                  <div key={idx} className="flex justify-between items-center px-3 py-2 bg-white border border-gray-200 rounded-md">
                                    <span className="text-sm text-gray-800">{aa.itemName}</span>
                                    <div className="text-right">
                                      {aa.sharedWith > 1 ? (
                                        <>
                                          <div className="text-sm font-semibold text-blue-600">${aa.amountPerPerson.toFixed(2)}</div>
                                          <div className="text-xs text-gray-500">shared with {aa.sharedWith}</div>
                                        </>
                                      ) : (
                                        <div className="text-sm font-semibold text-gray-900">${aa.itemPrice.toFixed(2)}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSendBills}
            disabled={selectedContactIds.length === 0 || sending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? 'Sending...' : `Send Bills to ${selectedContactIds.length} ${selectedContactIds.length === 1 ? 'Person' : 'People'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillModal;