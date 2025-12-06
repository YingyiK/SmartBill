import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Mail, UserPlus, Trash2, Loader, FolderPlus, Edit2, X, Check } from 'lucide-react';
import { contactsAPI, contactGroupsAPI } from '../services/api';
import authService from '../services/authService';
import './Participants.css';

const Participants = () => {
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'groups'
  
  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Groups state
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [error, setError] = useState('');
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [updatingNickname, setUpdatingNickname] = useState(false);

  // Load current user info
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Try to fetch from API
      import('../services/api').then(({ authAPI }) => {
        authAPI.getCurrentUser().then(user => {
          setCurrentUser(user);
        }).catch(() => {
          // Ignore error, will use null
        });
      });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') {
      loadContacts();
    } else {
      loadGroups();
    }
  }, [activeTab]);

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      const response = await contactsAPI.getContacts();
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await contactGroupsAPI.getContactGroups();
      setGroups(response.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactEmail) return;

    try {
      setAdding(true);
      setError('');
      await contactsAPI.addContact(newContactEmail, newContactNickname || null);
      
      await loadContacts();
      setNewContactEmail('');
      setNewContactNickname('');
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add contact');
    } finally {
      setAdding(false);
    }
  };

  const handleEditNickname = (contact) => {
    setEditingContactId(contact.id);
    setEditingNickname(contact.nickname || '');
  };

  const handleCancelEdit = () => {
    setEditingContactId(null);
    setEditingNickname('');
  };

  const handleSaveNickname = async (contactId) => {
    try {
      setUpdatingNickname(true);
      await contactsAPI.updateContact(contactId, editingNickname || null);
      await loadContacts();
      setEditingContactId(null);
      setEditingNickname('');
    } catch (err) {
      alert('Failed to update nickname: ' + err.message);
    } finally {
      setUpdatingNickname(false);
    }
  };

  const handleDeleteContact = async (contactId, friendEmail) => {
    if (!window.confirm(`Remove ${friendEmail} from your contacts?`)) {
      return;
    }

    try {
      await contactsAPI.deleteContact(contactId);
      await loadContacts();
      await loadGroups(); // Reload groups in case this contact was in a group
    } catch (err) {
      alert('Failed to delete contact: ' + err.message);
    }
  };

  const handleOpenGroupModal = (group = null) => {
    setEditingGroup(group);
    if (group) {
      setGroupName(group.name);
      setGroupDescription(group.description || '');
      // Filter out creator (contact_id is null) and only get valid contact IDs
      setSelectedContactIds(
        group.members
          .filter(m => m.contact_id !== null && m.contact_id !== undefined)
          .map(m => m.contact_id)
      );
    } else {
      setGroupName('');
      setGroupDescription('');
      setSelectedContactIds([]);
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setSavingGroup(true);
      setError('');
      
      if (editingGroup) {
        await contactGroupsAPI.updateContactGroup(
          editingGroup.id,
          groupName,
          groupDescription || null,
          selectedContactIds
        );
      } else {
        await contactGroupsAPI.createContactGroup(
          groupName,
          groupDescription || null,
          selectedContactIds
        );
      }
      
      await loadGroups();
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
      setSelectedContactIds([]);
    } catch (err) {
      setError(err.message || 'Failed to save group');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Delete group "${groupName}"? This will not delete the contacts.`)) {
      return;
    }

    try {
      await contactGroupsAPI.deleteContactGroup(groupId);
      await loadGroups();
    } catch (err) {
      alert('Failed to delete group: ' + err.message);
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getInitials = (email, nickname) => {
    if (nickname) return nickname[0].toUpperCase();
    return email[0].toUpperCase();
  };

  const getDisplayName = (contact) => {
    return contact.nickname || contact.friend_email.split('@')[0];
  };

  return (
    <div className="participants-page">
      <div className="participants-header">
        <div className="participants-title-section">
          <h1 className="participants-title">
            <UsersIcon size={32} />
            My Contacts & Groups
          </h1>
          <p className="participants-subtitle">
            Manage your contacts and organize them into groups
          </p>
        </div>
        <button 
          className="add-contact-btn"
          onClick={() => {
            if (activeTab === 'contacts') {
              setIsAddModalOpen(true);
            } else {
              handleOpenGroupModal();
            }
          }}
        >
          <UserPlus size={20} />
          {activeTab === 'contacts' ? 'Add Friend' : 'Create Group'}
        </button>
      </div>

      {/* Tabs */}
      <div className="participants-tabs">
        <button
          className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <UsersIcon size={18} />
          Contacts ({contacts.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <FolderPlus size={18} />
          Groups ({groups.length})
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <>
          {contactsLoading ? (
            <div className="loading-state">
              <Loader size={32} className="spinner" />
              <p>Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="empty-state">
              <UsersIcon size={64} color="#d1d5db" />
              <h3>No contacts yet</h3>
              <p>Add friends to start splitting bills</p>
              <button 
                className="btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                <UserPlus size={20} />
                Add Your First Friend
              </button>
            </div>
          ) : (
            <div className="participants-grid">
              {contacts.map(contact => (
                <div key={contact.id} className="participant-card">
                  <div className="participant-avatar">
                    {getInitials(contact.friend_email, contact.nickname)}
                  </div>
                  <div className="participant-info">
                    {editingContactId === contact.id ? (
                      <div className="nickname-edit">
                        <input
                          type="text"
                          value={editingNickname}
                          onChange={(e) => setEditingNickname(e.target.value)}
                          placeholder="Enter nickname"
                          className="nickname-input"
                          autoFocus
                        />
                        <div className="nickname-actions">
                          <button
                            className="save-btn"
                            onClick={() => handleSaveNickname(contact.id)}
                            disabled={updatingNickname}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3>{getDisplayName(contact)}</h3>
                    )}
                    <div className="participant-email">
                      <Mail size={14} />
                      {contact.friend_email}
                    </div>
                    <div className="participant-meta">
                      Added {new Date(contact.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="contact-actions">
                    {editingContactId !== contact.id && (
                      <button
                        className="edit-btn"
                        onClick={() => handleEditNickname(contact)}
                        title="Edit nickname"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteContact(contact.id, contact.friend_email)}
                      title="Remove contact"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <>
          {groupsLoading ? (
            <div className="loading-state">
              <Loader size={32} className="spinner" />
              <p>Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <FolderPlus size={64} color="#d1d5db" />
              <h3>No groups yet</h3>
              <p>Create groups to organize your contacts</p>
              <button 
                className="btn-primary"
                onClick={() => handleOpenGroupModal()}
              >
                <FolderPlus size={20} />
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map(group => (
                <div key={group.id} className="group-card">
                  <div className="group-header">
                    <div className="group-title-section">
                      <h3>{group.name}</h3>
                      {group.description && (
                        <p className="group-description">{group.description}</p>
                      )}
                      <div className="group-meta">
                        {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                    {currentUser && group.user_id && String(currentUser.id || currentUser.user_id) === String(group.user_id) && (
                      <div className="group-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleOpenGroupModal(group)}
                          title="Edit group"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          title="Delete group"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    {(!currentUser || !group.user_id || String(currentUser.id || currentUser.user_id) !== String(group.user_id)) && (
                      <div className="group-creator-info">
                        <span className="creator-indicator">Shared Group</span>
                      </div>
                    )}
                  </div>
                  <div className="group-members">
                    {group.members.length > 0 ? (
                      <div className="members-list">
                        {group.members.map((member, idx) => (
                          <div key={idx} className={`member-badge ${member.is_creator ? 'creator-badge' : ''}`}>
                            {member.contact_nickname || member.contact_email.split('@')[0]}
                            {member.is_creator && <span className="creator-label"> (Creator)</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-members">No members in this group</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Friend</h2>
              <button 
                className="modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddContact} className="modal-body">
              <div className="form-group">
                <label>Friend's Email *</label>
                <input
                  type="email"
                  placeholder="friend@example.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  required
                  autoFocus
                />
                <p className="helper-text">
                  They must be registered on SmartBill
                </p>
              </div>
              <div className="form-group">
                <label>Nickname (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., John, Best Friend"
                  value={newContactNickname}
                  onChange={(e) => setNewContactNickname(e.target.value)}
                />
              </div>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </form>
            <div className="modal-footer">
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary"
                onClick={handleAddContact}
                disabled={adding || !newContactEmail}
              >
                {adding ? 'Adding...' : 'Add Friend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGroupModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
              <button 
                className="modal-close"
                onClick={() => setIsGroupModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Friends, Family, Colleagues"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="Describe this group..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Select Contacts</label>
                {contacts.length === 0 ? (
                  <p className="helper-text">No contacts available. Add contacts first.</p>
                ) : (
                  <div className="contacts-selection">
                    {contacts.map(contact => (
                      <label key={contact.id} className="contact-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                        />
                        <span>{getDisplayName(contact)}</span>
                        <span className="contact-email">{contact.friend_email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => setIsGroupModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-primary"
                onClick={handleSaveGroup}
                disabled={savingGroup || !groupName.trim()}
              >
                {savingGroup ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Participants;
