import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Send, Check, Mail } from 'lucide-react';
import { contactsAPI, splitsAPI } from '../services/api';
import './SplitBillModal.css';

const SplitBillModal = ({ isOpen, onClose, expense, onSuccess }) => {
  const [allContacts, setAllContacts] = useState([]);
  const [relevantContacts, setRelevantContacts] = useState([]); // Only contacts related to this expense
  const [existingSplits, setExistingSplits] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [splitCalculations, setSplitCalculations] = useState({}); // { contactId: { amount, items, aaDetails } }
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && expense) {
      loadData();
    }
  }, [isOpen, expense]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load contacts and existing splits in parallel
      const [contactsResponse, splitsResponse] = await Promise.all([
        contactsAPI.getContacts(),
        splitsAPI.getSplits(expense.id).catch(() => ({ splits: [] })) // Ignore error if no splits exist
      ]);
      
      const loadedContacts = contactsResponse.contacts || [];
      setAllContacts(loadedContacts);
      const splits = splitsResponse.splits || [];
      setExistingSplits(splits);
      
      // Filter contacts to only show those related to this expense
      // Match contacts with expense participants by name
      const relevant = loadedContacts.filter(contact => {
        if (!expense.participants || expense.participants.length === 0) {
          // If no participants in expense, check if contact is in existing splits
          return splits.some(s => s.contact_id === contact.id);
        }
        
        const contactName = (contact.nickname || contact.friend_email.split('@')[0]).toLowerCase();
        return expense.participants.some(participant => {
          const participantName = participant.name.toLowerCase();
          return contactName === participantName || 
                 contactName.includes(participantName) || 
                 participantName.includes(contactName);
        });
      });
      
      setRelevantContacts(relevant);
      
      // If splits exist, pre-select those contacts
      if (splits.length > 0) {
        const splitContactIds = splits
          .filter(s => s.contact_id && relevant.some(c => c.id === s.contact_id))
          .map(s => s.contact_id);
        setSelectedContactIds(splitContactIds);
        
        // Calculate split details from existing splits
        const calculations = {};
        splits.forEach(split => {
          if (split.contact_id && relevant.some(c => c.id === split.contact_id)) {
            calculations[split.contact_id] = {
              amount: split.amount_owed,
              items: split.items_detail ? (typeof split.items_detail === 'string' ? JSON.parse(split.items_detail) : split.items_detail) : [],
              aaDetails: calculateAADetails(split, expense, splits)
            };
          }
        });
        setSplitCalculations(calculations);
      } else {
        // No existing splits, calculate from expense participants
        const calculations = calculateSplitsFromParticipants(relevant);
        setSplitCalculations(calculations);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSplitsFromParticipants = (contactsList) => {
    if (!expense.participants || !expense.items || !contactsList) return {};
    
    const calculations = {};
    
    // Build item price map with normalized keys (lowercase, trimmed)
    const itemPriceMap = {};
    const itemNameMap = {}; // Map from normalized name to original name
    expense.items.forEach(item => {
      const normalizedName = item.name.toLowerCase().trim();
      itemPriceMap[normalizedName] = item.price;
      itemNameMap[normalizedName] = item.name; // Store original name
    });
    
    // Helper function to normalize item name
    const normalizeName = (name) => {
      return typeof name === 'string' ? name.toLowerCase().trim() : String(name).toLowerCase().trim();
    };
    
    // Helper function to find item price by matching normalized names
    const findItemPrice = (itemName) => {
      const normalized = normalizeName(itemName);
      // Try exact match first
      if (itemPriceMap[normalized] !== undefined) {
        return { price: itemPriceMap[normalized], originalName: itemNameMap[normalized] || itemName };
      }
      // Try partial match
      for (const [key, price] of Object.entries(itemPriceMap)) {
        if (key.includes(normalized) || normalized.includes(key)) {
          return { price, originalName: itemNameMap[key] || key };
        }
      }
      return { price: 0, originalName: itemName };
    };
    
    // Calculate for each participant
    expense.participants.forEach(participant => {
      if (!participant.items) return;
      
      let totalAmount = 0;
      const aaDetails = [];
      const participantItems = typeof participant.items === 'string' 
        ? JSON.parse(participant.items) 
        : participant.items;
      
      participantItems.forEach(itemName => {
        // Find the item price using normalized matching
        const { price: itemPrice, originalName } = findItemPrice(itemName);
        
        // Check if item is shared (appears in multiple participants) - use normalized matching
        const normalizedItemName = normalizeName(itemName);
        const sharedCount = expense.participants.filter(p => {
          const pItems = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
          return pItems.some(pItem => normalizeName(pItem) === normalizedItemName);
        }).length;
        
        const amountPerPerson = sharedCount > 0 ? itemPrice / sharedCount : itemPrice;
        totalAmount += amountPerPerson;
        
        aaDetails.push({
          itemName: originalName, // Use original name for display
          itemPrice,
          sharedWith: sharedCount || 1, // At least shared with 1 person
          amountPerPerson
        });
      });
      
      // Try to find matching contact
      const matchedContact = contactsList.find(c => {
        const contactName = (c.nickname || c.friend_email.split('@')[0]).toLowerCase();
        const participantName = participant.name.toLowerCase();
        return contactName === participantName || 
               contactName.includes(participantName) || 
               participantName.includes(contactName);
      });
      
      if (matchedContact) {
        calculations[matchedContact.id] = {
          amount: totalAmount,
          items: participantItems,
          aaDetails
        };
      }
    });
    
    return calculations;
  };

  const calculateAADetails = (split, expense, allSplits = []) => {
    if (!split.items_detail || !expense.items) return [];
    
    const items = typeof split.items_detail === 'string' 
      ? JSON.parse(split.items_detail) 
      : split.items_detail;
    
    // Build item price map with normalized keys (lowercase, trimmed)
    const itemPriceMap = {};
    const itemNameMap = {}; // Map from normalized name to original name
    expense.items.forEach(item => {
      const normalizedName = item.name.toLowerCase().trim();
      itemPriceMap[normalizedName] = item.price;
      itemNameMap[normalizedName] = item.name; // Store original name
    });
    
    // Helper function to normalize item name
    const normalizeName = (name) => {
      return typeof name === 'string' ? name.toLowerCase().trim() : String(name).toLowerCase().trim();
    };
    
    // Helper function to find item price by matching normalized names
    const findItemPrice = (itemName) => {
      const normalized = normalizeName(itemName);
      // Try exact match first
      if (itemPriceMap[normalized] !== undefined) {
        return { price: itemPriceMap[normalized], originalName: itemNameMap[normalized] || itemName };
      }
      // Try partial match
      for (const [key, price] of Object.entries(itemPriceMap)) {
        if (key.includes(normalized) || normalized.includes(key)) {
          return { price, originalName: itemNameMap[key] || key };
        }
      }
      return { price: 0, originalName: itemName };
    };
    
    const aaDetails = [];
    items.forEach(itemName => {
      // Find the item price using normalized matching
      const { price: itemPrice, originalName } = findItemPrice(itemName);
      
      // Check if item is shared - also use normalized matching
      const normalizedItemName = normalizeName(itemName);
      const sharedCount = allSplits.filter(s => {
        const sItems = s.items_detail ? (typeof s.items_detail === 'string' ? JSON.parse(s.items_detail) : s.items_detail) : [];
        return sItems.some(sItem => normalizeName(sItem) === normalizedItemName);
      }).length;
      
      const amountPerPerson = sharedCount > 0 ? itemPrice / sharedCount : itemPrice;
      
      aaDetails.push({
        itemName: originalName, // Use original name for display
        itemPrice,
        sharedWith: sharedCount || 1, // At least shared with 1 person (themselves)
        amountPerPerson
      });
    });
    
    return aaDetails;
  };

  const handleToggleContact = (contactId) => {
    setSelectedContactIds(prev => {
      if (prev.includes(contactId)) {
        // Remove
        const newCalculations = { ...splitCalculations };
        delete newCalculations[contactId];
        setSplitCalculations(newCalculations);
        return prev.filter(id => id !== contactId);
      } else {
        // Add - calculate split for this contact
        const contact = relevantContacts.find(c => c.id === contactId);
        if (!contact) return prev;
        
        // Check if we already have calculation (from existing splits or previous calculation)
        if (splitCalculations[contactId]) {
          return [...prev, contactId];
        }
        
        // Try to find this contact in expense participants
        const participant = expense.participants?.find(p => {
          const contactName = (contact.nickname || contact.friend_email.split('@')[0]).toLowerCase();
          const participantName = p.name.toLowerCase();
          return contactName === participantName || 
                 contactName.includes(participantName) || 
                 participantName.includes(contactName);
        });
        
        if (participant && expense.items) {
          // Build item price map with normalized keys (lowercase, trimmed)
          const itemPriceMap = {};
          const itemNameMap = {}; // Map from normalized name to original name
          expense.items.forEach(item => {
            const normalizedName = item.name.toLowerCase().trim();
            itemPriceMap[normalizedName] = item.price;
            itemNameMap[normalizedName] = item.name; // Store original name
          });
          
          // Helper function to normalize item name
          const normalizeName = (name) => {
            return typeof name === 'string' ? name.toLowerCase().trim() : String(name).toLowerCase().trim();
          };
          
          // Helper function to find item price by matching normalized names
          const findItemPrice = (itemName) => {
            const normalized = normalizeName(itemName);
            // Try exact match first
            if (itemPriceMap[normalized] !== undefined) {
              return { price: itemPriceMap[normalized], originalName: itemNameMap[normalized] || itemName };
            }
            // Try partial match
            for (const [key, price] of Object.entries(itemPriceMap)) {
              if (key.includes(normalized) || normalized.includes(key)) {
                return { price, originalName: itemNameMap[key] || key };
              }
            }
            return { price: 0, originalName: itemName };
          };
          
          let totalAmount = 0;
          const aaDetails = [];
          const participantItems = typeof participant.items === 'string' 
            ? JSON.parse(participant.items) 
            : participant.items || [];
          
          participantItems.forEach(itemName => {
            // Find the item price using normalized matching
            const { price: itemPrice, originalName } = findItemPrice(itemName);
            
            // Count how many participants share this item - use normalized matching
            const normalizedItemName = normalizeName(itemName);
            const sharedCount = expense.participants?.filter(p => {
              const pItems = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
              return pItems.some(pItem => normalizeName(pItem) === normalizedItemName);
            }).length || 1;
            
            const amountPerPerson = sharedCount > 0 ? itemPrice / sharedCount : itemPrice;
            totalAmount += amountPerPerson;
            
            aaDetails.push({
              itemName: originalName, // Use original name for display
              itemPrice,
              sharedWith: sharedCount,
              amountPerPerson
            });
          });
          
          setSplitCalculations(prev => ({
            ...prev,
            [contactId]: {
              amount: totalAmount,
              items: participantItems,
              aaDetails
            }
          }));
        } else {
          // Contact not found in participants - use default (0 or equal split)
          // For now, set to 0 and let user know they need to configure manually
          // Actually, since we're only showing contacts that match participants, this shouldn't happen
          // But just in case:
          setSplitCalculations(prev => ({
            ...prev,
            [contactId]: {
              amount: 0,
              items: [],
              aaDetails: []
            }
          }));
        }
        
        return [...prev, contactId];
      }
    });
  };

  const handleSendBills = async () => {
    if (selectedContactIds.length === 0) {
      setError('Please select at least one person to send bills to');
      return;
    }

    try {
      setSending(true);
      setError('');
      
      // Create or update splits
      const participants = selectedContactIds.map(contactId => {
        const contact = relevantContacts.find(c => c.id === contactId);
        const calculation = splitCalculations[contactId];
        
        if (!contact || !calculation) {
          throw new Error(`Invalid data for contact ${contactId}`);
        }
        
        return {
          name: contact.nickname || contact.friend_email.split('@')[0],
          email: contact.friend_email,
          contact_id: contact.id,
          amount_owed: calculation.amount,
          items_detail: calculation.items || []
        };
      });
      
      // Create or update splits
      await splitsAPI.createSplits(expense.id, participants);
      
      // Get the created splits
      const splitsResponse = await splitsAPI.getSplits(expense.id);
      const splitIds = splitsResponse.splits
        .filter(s => selectedContactIds.includes(s.contact_id))
        .map(s => s.id);
      
      // Send bills
      await splitsAPI.sendBills(expense.id, splitIds);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to send bills: ' + err.message);
      console.error('Send bills error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !expense) return null;

  const selectedContacts = relevantContacts.filter(c => selectedContactIds.includes(c.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content split-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Split & Send Bill</h2>
            <p className="modal-subtitle">{expense.store_name} - ${expense.total_amount?.toFixed(2)}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="modal-body">
            <div className="loading-state">
              <p>Loading split data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body">
              {/* Select Contacts */}
              <div className="split-section">
                <h3>Select Friends to Send Bills</h3>
                <p className="section-hint">
                  Only contacts related to this expense are shown
                </p>
                {relevantContacts.length === 0 ? (
                  <div className="empty-contacts">
                    <Users size={32} color="#9ca3af" />
                    <p>No related contacts found</p>
                    <p className="small-text">
                      {expense.participants && expense.participants.length > 0
                        ? 'Make sure the participants in this expense match your contacts'
                        : 'This expense has no participants assigned'}
                    </p>
                  </div>
                ) : (
                  <div className="contacts-grid">
                    {relevantContacts.map(contact => {
                      const isSelected = selectedContactIds.includes(contact.id);
                      const calculation = splitCalculations[contact.id];
                      
                      return (
                        <div
                          key={contact.id}
                          className={`contact-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleContact(contact.id)}
                        >
                          <div className="contact-avatar">
                            {(contact.nickname || contact.friend_email)[0].toUpperCase()}
                          </div>
                          <div className="contact-info">
                            <span className="contact-name">
                              {contact.nickname || contact.friend_email.split('@')[0]}
                            </span>
                            {isSelected && calculation && (
                              <span className="contact-amount">
                                ${calculation.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check size={16} className="check-icon" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Split Details Preview */}
              {selectedContacts.length > 0 && (
                <div className="split-section">
                  <h3>Bill Details Preview</h3>
                  <div className="split-preview-list">
                    {selectedContacts.map(contact => {
                      const calculation = splitCalculations[contact.id];
                      if (!calculation) return null;
                      
                      return (
                        <div key={contact.id} className="split-preview-item">
                          <div className="preview-header">
                            <div className="preview-contact">
                              <div className="contact-avatar small">
                                {(contact.nickname || contact.friend_email)[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="preview-name">
                                  {contact.nickname || contact.friend_email.split('@')[0]}
                                </div>
                                <div className="preview-email">
                                  <Mail size={12} />
                                  {contact.friend_email}
                                </div>
                              </div>
                            </div>
                            <div className="preview-total">
                              <span className="total-label">Total</span>
                              <span className="total-amount">${calculation.amount.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          {calculation.items && calculation.items.length > 0 && (
                            <div className="preview-items">
                              <div className="items-header">Items:</div>
                              <div className="items-list">
                                {calculation.aaDetails?.map((aa, idx) => (
                                  <div key={idx} className="item-detail">
                                    <span className="item-name">{aa.itemName}</span>
                                    <span className="item-price-info">
                                      {aa.sharedWith > 1 ? (
                                        <>
                                          <span className="item-shared">
                                            ${aa.amountPerPerson.toFixed(2)} (shared with {aa.sharedWith})
                                          </span>
                                          <span className="item-original-price">
                                            ${aa.itemPrice.toFixed(2)} ÷ {aa.sharedWith}
                                          </span>
                                        </>
                                      ) : (
                                        <span>${aa.itemPrice.toFixed(2)}</span>
                                      )}
                                    </span>
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
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendBills}
                disabled={selectedContactIds.length === 0 || sending}
              >
                {sending ? (
                  <>
                    <Send size={16} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Bills to {selectedContactIds.length} {selectedContactIds.length === 1 ? 'Person' : 'People'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SplitBillModal;
