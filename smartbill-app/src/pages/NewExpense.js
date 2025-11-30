import React, { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import StepIndicator from '../components/StepIndicator';
import UploadArea from '../components/UploadArea';
import { ocrAPI, sttAPI, expenseAPI } from '../services/api';
import { STEPS } from '../constants';
import { Mic, MicOff } from 'lucide-react';
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
      const result = await sttAPI.processVoice(audioFile);
      const transcriptText = result.transcript || (typeof result === 'string' ? result : '');
      setTranscript(transcriptText);
      setSttResult(result);
      setActiveStep(4); // Move to AI Analysis step
      console.log('STT Result:', result);
      
      // Initialize participants and assignments from STT result
      // This will be used when user moves to Step 5 (Split Assignment)
      if (result.participants && result.participants.length > 0 && ocrResult) {
        const sttParticipants = result.participants.map(p => p.name);
        setParticipants(sttParticipants);
        
        // Initialize assignments from STT result
        // Match STT items to OCR items by name similarity
        const initialAssignments = {};
        result.participants.forEach(participant => {
          if (participant.items && participant.items.length > 0) {
            const assignedIndices = [];
            participant.items.forEach(sttItemName => {
              // Find matching OCR item by name (case-insensitive, partial match)
              const matchingIndex = ocrResult.items?.findIndex(ocrItem => 
                ocrItem.name.toLowerCase().includes(sttItemName.toLowerCase()) ||
                sttItemName.toLowerCase().includes(ocrItem.name.toLowerCase())
              );
              if (matchingIndex !== undefined && matchingIndex !== -1) {
                assignedIndices.push(matchingIndex);
              }
            });
            if (assignedIndices.length > 0) {
              initialAssignments[participant.name] = assignedIndices;
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
      // Convert itemAssignments to participants format
      // Format: { participantName: [itemIndex1, itemIndex2, ...] }
      // Convert to: [{ name: participantName, items: [itemName1, itemName2, ...] }]
      const participantsData = participants.map(participantName => {
        const assignedItemIndices = itemAssignments[participantName] || [];
        const assignedItemNames = assignedItemIndices
          .map(idx => ocrResult.items[idx]?.name)
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
          {/* Show OCR Result as Reference */}
          {ocrResult && (
            <div className="ocr-result-reference">
              <h3>📄 Receipt Details (Reference)</h3>
              <div className="receipt-info">
                <p><strong>Store:</strong> {ocrResult.store_name || 'N/A'}</p>
                <p><strong>Total:</strong> ${ocrResult.total?.toFixed(2) || 'N/A'}</p>
                <p><strong>Subtotal:</strong> ${ocrResult.subtotal?.toFixed(2) || 'N/A'}</p>
                {ocrResult.tax_amount && (
                  <p><strong>Tax:</strong> ${ocrResult.tax_amount.toFixed(2)}</p>
                )}
              </div>
              
              {ocrResult.items && ocrResult.items.length > 0 && (
                <div className="items-list">
                  <h4>Items ({ocrResult.items.length}):</h4>
                  <ul>
                    {ocrResult.items.map((item, index) => (
                      <li key={index}>
                        {item.name} - ${item.price?.toFixed(2)} (Qty: {item.quantity || 1})
                      </li>
                    ))}
                  </ul>
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

              {/* Continue Button */}
              <div className="complete-section">
                <button
                  className="complete-button"
                  onClick={() => setActiveStep(5)}
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
                          // Remove assignments for this participant
                          const newAssignments = { ...itemAssignments };
                          delete newAssignments[participant];
                          setItemAssignments(newAssignments);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="assigned-items">
                      <strong>Assigned Items:</strong>
                      {itemAssignments[participant] && itemAssignments[participant].length > 0 ? (
                        <ul>
                          {itemAssignments[participant].map(itemIdx => (
                            <li key={itemIdx}>
                              {ocrResult.items[itemIdx]?.name} - ${ocrResult.items[itemIdx]?.price.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-items">No items assigned</p>
                      )}
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
                  // Find which participants have this item assigned
                  const assignedTo = participants.filter(p => 
                    itemAssignments[p] && itemAssignments[p].includes(itemIdx)
                  );
                  
                  return (
                    <div key={itemIdx} className="item-assignment-card">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="item-assignments">
                        <label>Assign to:</label>
                        {participants.length === 0 ? (
                          <p className="no-participants-hint">Add participants first to assign items</p>
                        ) : (
                          <div className="participant-checkboxes">
                            {participants.map((participant) => (
                              <label key={participant} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={itemAssignments[participant]?.includes(itemIdx) || false}
                                  onChange={(e) => {
                                    const newAssignments = { ...itemAssignments };
                                    if (!newAssignments[participant]) {
                                      newAssignments[participant] = [];
                                    }
                                    if (e.target.checked) {
                                      // Add item to participant
                                      if (!newAssignments[participant].includes(itemIdx)) {
                                        newAssignments[participant] = [...newAssignments[participant], itemIdx];
                                      }
                                    } else {
                                      // Remove item from participant
                                      newAssignments[participant] = newAssignments[participant].filter(
                                        idx => idx !== itemIdx
                                      );
                                    }
                                    setItemAssignments(newAssignments);
                                  }}
                                />
                                {participant}
                              </label>
                            ))}
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