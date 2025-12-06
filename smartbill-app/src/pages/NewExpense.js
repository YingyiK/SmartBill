import React, { useState, useRef, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import StepIndicator from '../components/StepIndicator';
import UploadArea from '../components/UploadArea';
import { ocrAPI, sttAPI, expenseAPI, contactGroupsAPI, contactsAPI } from '../services/api';
import { STEPS } from '../constants';
import { Mic, MicOff } from 'lucide-react';
import authService from '../services/authService';
import './NewExpense.css';

const NewExpense = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [sttResult, setSttResult] = useState(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Split assignment state
  // Format: { participantName: [itemIndex1, itemIndex2, ...] }
  const [itemAssignments, setItemAssignments] = useState({});
  const [participants, setParticipants] = useState([]);
  const [step5Initialized, setStep5Initialized] = useState(false); // Track if Step 5 has been initialized
  
  // Contact groups state
  const [contactGroups, setContactGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [contacts, setContacts] = useState([]); // Store all contacts for name matching

  // Load contact groups and contacts on mount
  useEffect(() => {
    loadContactGroups();
    loadContacts();
  }, []);

  // Helper function to match STT name with contact name (all lowercase comparison)
  const matchContactName = useCallback((sttName) => {
    const lowerSttName = sttName.toLowerCase().trim();
    // Try to match with nickname first, then email username
    const matched = contacts.find(contact => {
      const nickname = (contact.nickname || '').toLowerCase().trim();
      const emailUser = contact.friend_email.split('@')[0].toLowerCase().trim();
      return nickname === lowerSttName || emailUser === lowerSttName || 
             nickname.includes(lowerSttName) || lowerSttName.includes(nickname);
    });
    // Return original contact name (preserve case) if matched, otherwise return STT name in lowercase
    return matched ? (matched.nickname || matched.friend_email.split('@')[0]) : lowerSttName;
  }, [contacts]);

  // Initialize Step 5 participants when step changes
  const initializeStep5Participants = useCallback(() => {
    // Priority 1: If group was selected, use group members (including creator)
    if (selectedGroupId) {
      const selectedGroup = contactGroups.find(g => g.id === selectedGroupId);
      if (selectedGroup && selectedGroup.members) {
        // Get all member names (including creator)
        const groupMemberNames = selectedGroup.members.map(m => 
          m.contact_nickname || m.contact_email.split('@')[0]
        );
        setParticipants(groupMemberNames);
        
        // If STT result exists, match and auto-assign items
        if (sttResult?.participants && sttResult.participants.length > 0 && ocrResult) {
          const initialAssignments = {};
          sttResult.participants.forEach(participant => {
            // Match STT name with group member name (all lowercase)
            const lowerSttName = participant.name.toLowerCase().trim();
            const matchedName = groupMemberNames.find(gName => {
              const lowerGName = gName.toLowerCase().trim();
              return lowerGName === lowerSttName || 
                     lowerGName.includes(lowerSttName) || 
                     lowerSttName.includes(lowerGName);
            });
            
            if (matchedName && participant.items && participant.items.length > 0) {
              const assignedIndices = [];
              participant.items.forEach(sttItemName => {
                // STT now returns exact OCR item names, match exactly (case-insensitive)
                const matchingIndex = ocrResult.items?.findIndex(ocrItem => 
                  ocrItem.name.toLowerCase().trim() === sttItemName.toLowerCase().trim()
                );
                if (matchingIndex !== undefined && matchingIndex !== -1 && !assignedIndices.includes(matchingIndex)) {
                  assignedIndices.push(matchingIndex);
                }
              });
              if (assignedIndices.length > 0) {
                // Use matched group member name (preserve original case)
                initialAssignments[matchedName] = assignedIndices;
              }
            }
          });
          setItemAssignments(initialAssignments);
        }
        return; // Exit early since we've initialized from group
      }
    }
    
    // Priority 2: If no group but STT result exists, match STT names with contacts
    if (!selectedGroupId && sttResult?.participants && sttResult.participants.length > 0) {
      const matchedNames = sttResult.participants.map(p => matchContactName(p.name));
      setParticipants(matchedNames);
      
      // Auto-assign items from STT result
      if (ocrResult) {
        const initialAssignments = {};
        sttResult.participants.forEach((participant, idx) => {
          const matchedName = matchedNames[idx];
          if (participant.items && participant.items.length > 0) {
            const assignedIndices = [];
            participant.items.forEach(sttItemName => {
              // STT now returns exact OCR item names, match exactly (case-insensitive)
              const matchingIndex = ocrResult.items?.findIndex(ocrItem => 
                ocrItem.name.toLowerCase().trim() === sttItemName.toLowerCase().trim()
              );
              if (matchingIndex !== undefined && matchingIndex !== -1 && !assignedIndices.includes(matchingIndex)) {
                assignedIndices.push(matchingIndex);
              }
            });
            if (assignedIndices.length > 0) {
              // Use matched contact name (preserve original case)
              initialAssignments[matchedName] = assignedIndices;
            }
          }
        });
        setItemAssignments(initialAssignments);
      }
    }
    // If neither group nor STT, participants array remains empty and user can manually add
  }, [selectedGroupId, sttResult, ocrResult, contactGroups, matchContactName]);

  useEffect(() => {
    if (activeStep === 5 && !step5Initialized) {
      initializeStep5Participants();
      setStep5Initialized(true);
    } else if (activeStep !== 5) {
      setStep5Initialized(false); // Reset when leaving Step 5
    }
  }, [activeStep, step5Initialized, initializeStep5Participants]);

  const loadContactGroups = async () => {
    try {
      const response = await contactGroupsAPI.getContactGroups();
      setContactGroups(response.groups || []);
    } catch (err) {
      console.error('Failed to load contact groups:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getContacts();
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOcrResult(null);
      setError(null);
      console.log('Selected file:', file);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setOcrResult(null);

    try {
      const result = await ocrAPI.uploadReceipt(selectedFile);
      setOcrResult(result);
      setActiveStep(3); // Jump directly to Voice Input step (step 3)
      console.log('OCR Result:', result);
    } catch (err) {
      setError(err.message || 'Failed to process receipt');
      console.error('OCR Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone: ' + err.message);
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcessVoice = async () => {
    if (!audioBlob) {
      // Skip voice input if no audio
      setActiveStep(4); // Move to AI Analysis step
      // Simulate analysis completion
      setTimeout(() => {
        setAnalysisLoading(false);
      }, 500);
      return;
    }

    setSttLoading(true);
    setError(null);

    try {
      // Convert blob to File
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      // Get selected group members if group is selected
      // Include creator (user themselves) in the group members list
      // Use nickname if available, otherwise use email username
      let groupMembers = null;
      if (selectedGroupId) {
        const selectedGroup = contactGroups.find(g => g.id === selectedGroupId);
        if (selectedGroup && selectedGroup.members) {
          groupMembers = selectedGroup.members
            .map(m => {
              if (m.is_creator) {
                // For creator, use current user's email username
                const currentUser = authService.getCurrentUser();
                if (currentUser && currentUser.email) {
                  return currentUser.email.split('@')[0].toLowerCase();
                }
                return null;
              }
              return (m.contact_nickname || m.contact_email.split('@')[0]).toLowerCase();
            })
            .filter(name => name); // Filter out any null/undefined names
        }
      }
      
      // Get current user's email username for "I" mapping
      const currentUser = authService.getCurrentUser();
      const currentUserName = currentUser && currentUser.email 
        ? currentUser.email.split('@')[0].toLowerCase() 
        : null;
      
      // Pass OCR items to STT service for AI to match items
      const ocrItems = ocrResult?.items || [];
      console.log('Sending to STT:', { groupMembers, ocrItems, currentUserName });
      const result = await sttAPI.processVoice(audioFile, groupMembers, ocrItems, currentUserName);
      const transcriptText = result.transcript || (typeof result === 'string' ? result : '');
      setTranscript(transcriptText);
      setSttResult(result);
      setActiveStep(4); // Move to AI Analysis step
      console.log('STT Result:', result);
      console.log('STT Participants:', result.participants);
      console.log('STT Participants length:', result.participants?.length || 0);
      
      // Initialize participants and assignments from STT result
      // This will be used when user moves to Step 5 (Split Assignment)
      if (result.participants && result.participants.length > 0 && ocrResult) {
        // Normalize participant names to lowercase for consistency
        const sttParticipants = result.participants.map(p => p.name.toLowerCase().trim());
        setParticipants(sttParticipants);
        
        // Initialize assignments from STT result
        // STT now returns exact OCR item names, so we can match directly
        const initialAssignments = {};
        result.participants.forEach(participant => {
          if (participant.items && participant.items.length > 0) {
            const assignedIndices = [];
            participant.items.forEach(sttItemName => {
              // Find matching OCR item by exact name match (case-insensitive)
              const matchingIndex = ocrResult.items?.findIndex(ocrItem => 
                ocrItem.name.toLowerCase().trim() === sttItemName.toLowerCase().trim()
              );
              if (matchingIndex !== undefined && matchingIndex !== -1) {
                assignedIndices.push(matchingIndex);
              }
            });
            if (assignedIndices.length > 0) {
              // Use lowercase for consistency
              const participantKey = participant.name.toLowerCase().trim();
              initialAssignments[participantKey] = assignedIndices;
            }
          }
        });
        setItemAssignments(initialAssignments);
      } else {
        // No STT participants, start with empty assignments
        setParticipants([]);
        setItemAssignments({});
      }
      
      // Simulate AI analysis (since AI service is not implemented yet)
      setAnalysisLoading(true);
      setTimeout(() => {
        setAnalysisLoading(false);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to process voice');
      console.error('STT Error:', err);
    } finally {
      setSttLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!ocrResult) {
      setError('No receipt data to save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert itemAssignments to participants format with AA calculations
      // Format: { participantName: [itemIndex1, itemIndex2, ...] }
      // Convert to: [{ name: participantName, items: [itemName1, itemName2, ...] }]
      // Note: itemAssignments keys are lowercase, so use lowercase lookup
      const participantsData = participants.map(participantName => {
        const participantKey = participantName.toLowerCase().trim();
        const assignedItemIndices = itemAssignments[participantKey] || [];
        const assignedItemNames = assignedItemIndices
          .map(idx => {
            const item = ocrResult.items[idx];
            if (!item) return null;
            
            // Count how many participants have this item assigned (use lowercase keys)
            const assignedCount = participants.filter(p => {
              const pKey = p.toLowerCase().trim();
              return itemAssignments[pKey] && itemAssignments[pKey].includes(idx);
            }).length;
            
            // For shared items, include the split info
            if (assignedCount > 1) {
              return `${item.name} (shared among ${assignedCount})`;
            }
            return item.name;
          })
          .filter(Boolean);
        
        return {
          name: participantName,
          items: assignedItemNames
        };
      });

      // Prepare expense data
      const expenseData = {
        store_name: ocrResult.store_name || null,
        total_amount: ocrResult.total || 0,
        subtotal: ocrResult.subtotal || null,
        tax_amount: ocrResult.tax_amount || null,
        tax_rate: ocrResult.tax_rate || null,
        raw_text: ocrResult.raw_text || null,
        transcript: transcript || null,
        items: (ocrResult.items || []).map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        participants: participantsData
      };

      // Save to database
      await expenseAPI.createExpense(expenseData);
      
      // Reset form and navigate to dashboard
      setSelectedFile(null);
      setOcrResult(null);
      setTranscript(null);
      setSttResult(null);
      setAudioBlob(null);
      setParticipants([]);
      setItemAssignments({});
      setActiveStep(1);
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      console.error('Save expense error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <PageHeader
        title="Create New Expense"
        subtitle="Upload a bill and use voice to describe the split"
      />
      
      <StepIndicator steps={STEPS} activeStep={activeStep} />
      
      {/* Step 1: Upload Bill */}
      {activeStep === 1 && (
        <>
          <UploadArea
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          {/* Contact Group Selection */}
          {contactGroups.length > 0 && (
            <div className="group-selection-section">
              <h4>👥 Select Friend Group (Optional)</h4>
              <p className="group-selection-hint">
                Select a group to help AI better understand the bill split
              </p>
              <div className="group-select-container">
                <select
                  className="group-select"
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                >
                  <option value="">No group selected</option>
                  {contactGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.member_count} {group.member_count === 1 ? 'member' : 'members'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="process-section">
              <button
                className="process-button"
                onClick={handleProcessReceipt}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Receipt'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 3: Voice Input (showing OCR result) */}
      {activeStep === 3 && (
        <div className="voice-input-section">
          {/* Show OCR Result - Editable */}
          {ocrResult && (
            <div className="ocr-result-reference">
              <h3>📄 Receipt Details (Click to Edit)</h3>
              <div className="receipt-info">
                <div className="editable-field">
                  <label>Store:</label>
                  <input
                    type="text"
                    value={ocrResult.store_name || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, store_name: e.target.value })}
                    className="editable-input"
                  />
                </div>
                <div className="editable-field">
                  <label>Total:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ocrResult.total || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, total: parseFloat(e.target.value) || 0 })}
                    className="editable-input"
                  />
                </div>
                <div className="editable-field">
                  <label>Subtotal:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ocrResult.subtotal || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, subtotal: parseFloat(e.target.value) || null })}
                    className="editable-input"
                  />
                </div>
                {ocrResult.tax_amount && (
                  <div className="editable-field">
                    <label>Tax:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ocrResult.tax_amount}
                      onChange={(e) => setOcrResult({ ...ocrResult, tax_amount: parseFloat(e.target.value) || 0 })}
                      className="editable-input"
                    />
                  </div>
                )}
              </div>
              
              {ocrResult.items && ocrResult.items.length > 0 && (
                <div className="items-list">
                  <h4>Items ({ocrResult.items.length}):</h4>
                  <div className="editable-items">
                    {ocrResult.items.map((item, index) => (
                      <div key={index} className="editable-item">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[index] = { ...newItems[index], name: e.target.value };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          className="editable-input"
                          placeholder="Item name"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.price || ''}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[index] = { ...newItems[index], price: parseFloat(e.target.value) || 0 };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          className="editable-input price-input"
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          step="1"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 1 };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          className="editable-input qty-input"
                          placeholder="Qty"
                        />
                        <button
                          className="remove-item-btn"
                          onClick={() => {
                            const newItems = ocrResult.items.filter((_, i) => i !== index);
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-item-btn"
                    onClick={() => {
                      const newItems = [...ocrResult.items, { name: '', price: 0, quantity: 1 }];
                      setOcrResult({ ...ocrResult, items: newItems });
                    }}
                  >
                    + Add Item
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Voice Input */}
          <div className="voice-input-container">
            <h3>🎤 Voice Input</h3>
            <p className="voice-description">
              Describe how to split this bill (optional)
            </p>

            <div className="voice-controls">
              {!isRecording ? (
                <button
                  className="record-button"
                  onClick={startRecording}
                >
                  <Mic size={24} />
                  Start Recording
                </button>
              ) : (
                <button
                  className="stop-button"
                  onClick={stopRecording}
                >
                  <MicOff size={24} />
                  Stop Recording
                </button>
              )}
            </div>

            {audioBlob && (
              <div className="audio-status">
                <p>✅ Audio recorded ({Math.round(audioBlob.size / 1024)} KB)</p>
              </div>
            )}

            {transcript && (
              <div className="transcript-result">
                <h4>Transcript:</h4>
                <p>{transcript}</p>
              </div>
            )}

            <div className="voice-confirm-section">
              <button
                className="confirm-button"
                onClick={handleProcessVoice}
                disabled={sttLoading}
              >
                {sttLoading 
                  ? 'Processing Voice...' 
                  : audioBlob 
                    ? 'Confirm & Continue' 
                    : 'Skip Voice Input'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: AI Analysis / Review */}
      {activeStep === 4 && (
        <div className="ai-analysis-section">
          <h3>📋 AI Analysis Summary</h3>
          
          {analysisLoading ? (
            <div className="loading-state">
              <p>Processing expense split...</p>
            </div>
          ) : (
            <>
              {/* OCR Results Summary */}
              {ocrResult && (
                <div className="summary-section">
                  <h4>📄 Receipt Summary</h4>
                  <div className="summary-info">
                    <div className="summary-row">
                      <span className="summary-label">Store:</span>
                      <span className="summary-value">{ocrResult.store_name || 'N/A'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total:</span>
                      <span className="summary-value">${ocrResult.total?.toFixed(2) || 'N/A'}</span>
                    </div>
                    {ocrResult.subtotal && (
                      <div className="summary-row">
                        <span className="summary-label">Subtotal:</span>
                        <span className="summary-value">${ocrResult.subtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {ocrResult.tax_amount && (
                      <div className="summary-row">
                        <span className="summary-label">Tax:</span>
                        <span className="summary-value">${ocrResult.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {ocrResult.items && ocrResult.items.length > 0 && (
                      <div className="summary-items">
                        <span className="summary-label">Items:</span>
                        <span className="summary-value">{ocrResult.items.length} items</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Input Summary */}
              {transcript && (
                <div className="summary-section">
                  <h4>🎤 Voice Instructions</h4>
                  <div className="transcript-summary">
                    <p>{transcript}</p>
                  </div>
                  {sttResult?.participants && sttResult.participants.length > 0 && (
                    <div className="participants-summary">
                      <h5>Detected Participants:</h5>
                      <ul>
                        {sttResult.participants.map((p, idx) => (
                          <li key={idx}>
                            <strong>{p.name}</strong>: {p.items?.join(', ') || 'No items specified'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Show STT Participants Preview */}
              {sttResult?.participants && sttResult.participants.length > 0 && (
                <div className="summary-section">
                  <h4>👥 AI Detected Participants (will be used as presets)</h4>
                  <div className="participants-preview">
                    {sttResult.participants.map((p, idx) => (
                      <div key={idx} className="participant-preview-item">
                        <strong>{p.name}</strong>: {p.items?.join(', ') || 'No items specified'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="complete-section">
                <button
                  className="complete-button"
                  onClick={() => {
                    setActiveStep(5);
                  }}
                  disabled={loading}
                >
                  Continue to Split Assignment →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5: Split Assignment */}
      {activeStep === 5 && (
        <div className="split-assignment-section">
          <h3>👥 Split Assignment</h3>
          <p className="section-description">
            Select participants and assign items to each person. Items are initially unassigned unless detected from voice input.
          </p>

          {/* Group Selection (if no group selected and no STT result) */}
          {!selectedGroupId && !sttResult?.participants && contactGroups.length > 0 && (
            <div className="group-selection-section">
              <h4>👥 Select Friend Group (Optional)</h4>
              <p className="group-selection-hint">
                Quickly add all members from a group
              </p>
              <div className="group-select-container">
                <select
                  className="group-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const group = contactGroups.find(g => g.id === e.target.value);
                      if (group && group.members) {
                        const groupMemberNames = group.members.map(m => 
                          m.contact_nickname || m.contact_email.split('@')[0]
                        );
                        // Merge with existing participants, avoiding duplicates
                        setParticipants(prev => {
                          const combined = [...new Set([...prev, ...groupMemberNames])];
                          return combined;
                        });
                        setSelectedGroupId(e.target.value);
                      }
                    }
                  }}
                >
                  <option value="">Select a group to add members...</option>
                  {contactGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.member_count} {group.member_count === 1 ? 'member' : 'members'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Add Participant */}
          <div className="add-participant-section">
            <input
              type="text"
              placeholder="Enter participant name"
              className="participant-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const name = e.target.value.trim();
                  if (!participants.includes(name)) {
                    setParticipants([...participants, name]);
                    e.target.value = '';
                  }
                }
              }}
            />
            <button
              className="add-participant-btn"
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                const name = input.value.trim();
                if (name && !participants.includes(name)) {
                  setParticipants([...participants, name]);
                  input.value = '';
                }
              }}
            >
              + Add Participant
            </button>
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div className="participants-list">
              <h4>Participants ({participants.length})</h4>
              <div className="participants-grid">
                {participants.map((participant, pIdx) => (
                  <div key={pIdx} className="participant-card">
                    <div className="participant-header">
                      <h5>{participant}</h5>
                      <button
                        className="remove-participant-btn"
                        onClick={() => {
                          const newParticipants = participants.filter((_, i) => i !== pIdx);
                          setParticipants(newParticipants);
                          // Remove assignments for this participant (use lowercase key)
                          const newAssignments = { ...itemAssignments };
                          const participantKey = participant.toLowerCase().trim();
                          delete newAssignments[participantKey];
                          setItemAssignments(newAssignments);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="assigned-items">
                      <strong>Assigned Items:</strong>
                      {(() => {
                        const participantKey = participant.toLowerCase().trim();
                        const assignedIndices = itemAssignments[participantKey] || [];
                        return assignedIndices.length > 0 ? (
                          <ul>
                            {assignedIndices.map(itemIdx => {
                            const item = ocrResult.items[itemIdx];
                            if (!item) return null;
                            
                            // Count how many participants have this item assigned (use lowercase keys)
                            const assignedCount = participants.filter(p => {
                              const pKey = p.toLowerCase().trim();
                              return itemAssignments[pKey] && itemAssignments[pKey].includes(itemIdx);
                            }).length;
                            
                            // Calculate amount per person (AA)
                            const amountPerPerson = assignedCount > 0 ? (item.price || 0) / assignedCount : 0;
                            
                            return (
                              <li key={itemIdx}>
                                {item.name} - ${amountPerPerson.toFixed(2)}
                                {assignedCount > 1 && (
                                  <span className="aa-badge"> (shared with {assignedCount} people)</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="no-items">No items assigned</p>
                      );
                      })()}
                      {(() => {
                        const participantKey = participant.toLowerCase().trim();
                        const assignedIndices = itemAssignments[participantKey] || [];
                        return assignedIndices.length > 0 && (
                          <div className="participant-total">
                            <strong>Total: ${(assignedIndices.reduce((sum, itemIdx) => {
                              const item = ocrResult.items[itemIdx];
                              if (!item) return sum;
                              const assignedCount = participants.filter(p => {
                                const pKey = p.toLowerCase().trim();
                                return itemAssignments[pKey] && itemAssignments[pKey].includes(itemIdx);
                              }).length;
                              return sum + (assignedCount > 0 ? (item.price || 0) / assignedCount : 0);
                            }, 0)).toFixed(2)}</strong>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Assignment */}
          {ocrResult && ocrResult.items && ocrResult.items.length > 0 && (
            <div className="items-assignment-section">
              <h4>Items ({ocrResult.items.length})</h4>
              <div className="items-list">
                {ocrResult.items.map((item, itemIdx) => {
                  // Find which participants have this item assigned (use lowercase keys)
                  const assignedTo = participants.filter(p => {
                    const pKey = p.toLowerCase().trim();
                    return itemAssignments[pKey] && itemAssignments[pKey].includes(itemIdx);
                  });
                  
                  // Calculate amount per person if shared
                  const assignedCount = assignedTo.length;
                  const amountPerPerson = assignedCount > 0 ? (item.price || 0) / assignedCount : 0;
                  
                  return (
                    <div key={itemIdx} className="item-assignment-card">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <div className="item-price-info">
                          <span className="item-price">${item.price.toFixed(2)}</span>
                          {assignedCount > 0 && (
                            <span className="item-price-per-person">
                              (${amountPerPerson.toFixed(2)} per person × {assignedCount})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-assignments">
                        <label>Assign to:</label>
                        {participants.length === 0 ? (
                          <p className="no-participants-hint">Add participants first to assign items</p>
                        ) : (
                          <div className="participant-checkboxes">
                            {participants.map((participant) => {
                              const participantKey = participant.toLowerCase().trim();
                              return (
                                <label key={participant} className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={itemAssignments[participantKey]?.includes(itemIdx) || false}
                                    onChange={(e) => {
                                      const newAssignments = { ...itemAssignments };
                                      if (!newAssignments[participantKey]) {
                                        newAssignments[participantKey] = [];
                                      }
                                      if (e.target.checked) {
                                        // Add item to participant
                                        if (!newAssignments[participantKey].includes(itemIdx)) {
                                          newAssignments[participantKey] = [...newAssignments[participantKey], itemIdx];
                                        }
                                      } else {
                                        // Remove item from participant
                                        newAssignments[participantKey] = newAssignments[participantKey].filter(
                                          idx => idx !== itemIdx
                                        );
                                      }
                                      setItemAssignments(newAssignments);
                                    }}
                                  />
                                  {participant}
                                  {itemAssignments[participantKey]?.includes(itemIdx) && (
                                    <span className="assigned-badge"> (${amountPerPerson.toFixed(2)})</span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complete Button */}
          <div className="complete-section">
            <button
              className="complete-button"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? 'Saving...' : '✓ Complete & Save Expense'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default NewExpense;