// NewExpense.js  –  零 CSS 文件，纯 Tailwind
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StepIndicator from '../components/StepIndicator';
import UploadArea from '../components/UploadArea';
import { ocrAPI, sttAPI, expenseAPI, contactGroupsAPI, contactsAPI } from '../services/api';
import { STEPS } from '../constants';
import authService from '../services/authService';

const NewExpense = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [sttResult, setSttResult] = useState(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Split assignment
  const [itemAssignments, setItemAssignments] = useState({});
  const [participants, setParticipants] = useState([]);
  const [step5Initialized, setStep5Initialized] = useState(false);

  // Groups & contacts
  const [contactGroups, setContactGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [contacts, setContacts] = useState([]);

  // Load groups & contacts
  useEffect(() => {
    loadContactGroups();
    loadContacts();
  }, []);

  const loadContactGroups = async () => {
    try {
      const res = await contactGroupsAPI.getContactGroups();
      setContactGroups(res.groups || []);
    } catch (err) {
      console.error('Failed to load contact groups:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await contactsAPI.getContacts();
      setContacts(res.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  // File select
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOcrResult(null);
      setError(null);
    }
  };

  // Process receipt
  const handleProcessReceipt = async () => {
    if (!selectedFile) return setError('Please select a file first');
    setLoading(true);
    setError(null);
    try {
      const result = await ocrAPI.uploadReceipt(selectedFile);
      setOcrResult(result);
      setActiveStep(3);
    } catch (err) {
      setError(err.message || 'Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone: ' + err.message);
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
      setActiveStep(4);
      setTimeout(() => setAnalysisLoading(false), 500);
      return;
    }
    setSttLoading(true);
    setError(null);
    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const groupMembers = selectedGroupId
        ? contactGroups
            .find((g) => g.id === selectedGroupId)
            ?.members?.map((m) => (m.contact_nickname || m.contact_email.split('@')[0]).toLowerCase())
            .filter(Boolean) || []
        : null;
      const currentUser = authService.getCurrentUser();
      const currentUserName = currentUser?.email?.split('@')[0]?.toLowerCase() || null;
      const ocrItems = ocrResult?.items || [];
      const result = await sttAPI.processVoice(audioFile, groupMembers, ocrItems, currentUserName);
      setTranscript(result.transcript || result);
      setSttResult(result);
      setActiveStep(4);
      setTimeout(() => setAnalysisLoading(false), 1000);
    } catch (err) {
      setError(err.message || 'Failed to process voice');
    } finally {
      setSttLoading(false);
    }
  };

  // Initialize participants for step 5
  const initializeStep5Participants = useCallback(() => {
    if (selectedGroupId) {
      const group = contactGroups.find((g) => g.id === selectedGroupId);
      if (group?.members) {
        const names = group.members.map((m) => m.contact_nickname || m.contact_email.split('@')[0]);
        setParticipants(names);
        if (sttResult?.participants?.length && ocrResult?.items) {
          const assignments = {};
          sttResult.participants.forEach((p) => {
            const key = p.name.toLowerCase().trim();
            const indices = p.items
              ?.map((name) => ocrResult.items.findIndex((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim()))
              .filter((i) => i !== -1);
            if (indices?.length) assignments[key] = indices;
          });
          setItemAssignments(assignments);
        }
        return;
      }
    }
    if (sttResult?.participants?.length) {
      const names = sttResult.participants.map((p) => p.name.toLowerCase().trim());
      setParticipants(names);
      if (ocrResult?.items) {
        const assignments = {};
        sttResult.participants.forEach((p, idx) => {
          const key = names[idx];
          const indices = p.items
            ?.map((name) => ocrResult.items.findIndex((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim()))
            .filter((i) => i !== -1);
          if (indices?.length) assignments[key] = indices;
        });
        setItemAssignments(assignments);
      }
    }
  }, [selectedGroupId, contactGroups, sttResult, ocrResult]);

  useEffect(() => {
    if (activeStep === 5 && !step5Initialized) {
      initializeStep5Participants();
      setStep5Initialized(true);
    } else if (activeStep !== 5) setStep5Initialized(false);
  }, [activeStep, step5Initialized, initializeStep5Participants]);

  // Save expense
  const handleComplete = async () => {
    if (!ocrResult) return setError('No receipt data to save');
    setLoading(true);
    setError(null);
    try {
      const participantsData = participants.map((name) => {
        const key = name.toLowerCase().trim();
        const indices = itemAssignments[key] || [];
        const items = indices.map((i) => ocrResult.items[i]).filter(Boolean);
        return { name, items: items.map((it) => it.name) };
      });
      await expenseAPI.createExpense({
        store_name: ocrResult.store_name || null,
        total_amount: ocrResult.total || 0,
        subtotal: ocrResult.subtotal || null,
        tax_amount: ocrResult.tax_amount || null,
        tax_rate: ocrResult.tax_rate || null,
        raw_text: ocrResult.raw_text || null,
        transcript: transcript || null,
        items: (ocrResult.items || []).map((it) => ({ name: it.name, price: it.price, quantity: it.quantity || 1 })),
        participants: participantsData,
      });
      // Reset and redirect
      setSelectedFile(null);
      setOcrResult(null);
      setTranscript(null);
      setSttResult(null);
      setAudioBlob(null);
      setParticipants([]);
      setItemAssignments({});
      setActiveStep(1);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-16">
      <PageHeader
        title="Create New Expense"
        subtitle="Upload a bill and use voice to describe the split"
      />
      <StepIndicator steps={STEPS} activeStep={activeStep} />

      {/* Step 1: Upload */}
      {activeStep === 1 && (
        <>
          <UploadArea onFileSelect={handleFileSelect} selectedFile={selectedFile} />
          {contactGroups.length > 0 && (
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="text-lg font-semibold mb-2">👥 Select Friend Group (Optional)</h4>
              <p className="text-sm text-gray-500 mb-4">Help AI better understand the bill split</p>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value || null)}
              >
                <option value="">No group selected</option>
                {contactGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.member_count} {g.member_count === 1 ? 'member' : 'members'})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedFile && (
            <div className="mt-8 text-center">
              <button
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg transition"
                onClick={handleProcessReceipt}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Receipt'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 3: Voice Input */}
      {activeStep === 3 && (
        <div className="mt-8 space-y-8">
          {ocrResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-4">📄 Receipt Details (Editable)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                  <input
                    type="text"
                    value={ocrResult.store_name || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, store_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ocrResult.total || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, total: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ocrResult.subtotal || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, subtotal: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {ocrResult.tax_amount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ocrResult.tax_amount}
                      onChange={(e) => setOcrResult({ ...ocrResult, tax_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              {ocrResult.items && ocrResult.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Items ({ocrResult.items.length})</h4>
                  <div className="space-y-3">
                    {ocrResult.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[idx] = { ...newItems[idx], name: e.target.value };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          placeholder="Item name"
                          className="flex-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.price || ''}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[idx] = { ...newItems[idx], price: parseFloat(e.target.value) || 0 };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          placeholder="Price"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const newItems = [...ocrResult.items];
                            newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                          placeholder="Qty"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          className="w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                          onClick={() => {
                            const newItems = ocrResult.items.filter((_, i) => i !== idx);
                            setOcrResult({ ...ocrResult, items: newItems });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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

          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">🎤 Voice Input</h3>
            <p className="text-gray-500 mb-6">Describe how to split this bill (optional)</p>
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition"
                  onClick={startRecording}
                >
                  <Mic size={24} />
                  Start Recording
                </button>
              ) : (
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:-translate-y-0.5 transition"
                  onClick={stopRecording}
                >
                  <MicOff size={24} />
                  Stop Recording
                </button>
              )}
            </div>
            {audioBlob && (
              <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                <p>✅ Audio recorded ({Math.round(audioBlob.size / 1024)} KB)</p>
              </div>
            )}
            {transcript && (
              <div className="mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Transcript:</h4>
                <p className="text-sm text-gray-600">{transcript}</p>
              </div>
            )}
            <div className="mt-6">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={handleProcessVoice}
                disabled={sttLoading}
              >
                {sttLoading ? 'Processing...' : audioBlob ? 'Confirm & Continue' : 'Skip Voice Input'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: AI Analysis / Review */}
      {activeStep === 4 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-center mb-6">📋 AI Analysis Summary</h3>
          {analysisLoading ? (
            <div className="text-center py-16 text-gray-500">Processing expense split...</div>
          ) : (
            <>
              {/* OCR Summary */}
              {ocrResult && (
                <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Receipt Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-600">Store:</span><span className="font-medium">{ocrResult.store_name || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-medium">${ocrResult.total?.toFixed(2) || 'N/A'}</span></div>
                    {ocrResult.subtotal && <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium">${ocrResult.subtotal.toFixed(2)}</span></div>}
                    {ocrResult.tax_amount && <div className="flex justify-between"><span className="text-gray-600">Tax:</span><span className="font-medium">${ocrResult.tax_amount.toFixed(2)}</span></div>}
                    {ocrResult.items?.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Items:</span><span className="font-medium">{ocrResult.items.length} items</span></div>}
                  </div>
                </div>
              )}

              {/* Voice Summary */}
              {transcript && (
                <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Voice Instructions</h4>
                  <div className="p-4 bg-white border border-gray-200 rounded-md text-sm text-gray-600 italic">{transcript}</div>
                  {sttResult?.participants?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Detected Participants:</h5>
                      <ul className="space-y-1">
                        {sttResult.participants.map((p, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            <strong>{p.name}</strong>: {p.items?.join(', ') || 'No items specified'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Continue */}
              <div className="text-center">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">👥 Split Assignment</h3>
            <p className="text-gray-500 mb-8">Select participants and assign items to each person. Items are initially unassigned unless detected from voice input.</p>

            {/* Group Selection (if no group selected and no STT result) */}
            {!selectedGroupId && !sttResult?.participants && contactGroups.length > 0 && (
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h4 className="text-lg font-semibold mb-2">👥 Select Friend Group (Optional)</h4>
                <p className="text-sm text-gray-500 mb-4">Quickly add all members from a group</p>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const group = contactGroups.find((g) => g.id === e.target.value);
                      if (group?.members) {
                        const names = group.members.map((m) => m.contact_nickname || m.contact_email.split('@')[0]);
                        setParticipants((prev) => [...new Set([...prev, ...names])]);
                        setSelectedGroupId(e.target.value);
                      }
                    }
                  }}
                >
                  <option value="">Select a group to add members...</option>
                  {contactGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.member_count} {g.member_count === 1 ? 'member' : 'members'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add Participant */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <input
                type="text"
                placeholder="Enter participant name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Participants ({participants.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant, pIdx) => (
                    <div key={pIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-900">{participant}</h5>
                        <button
                          className="w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                          onClick={() => {
                            const newParticipants = participants.filter((_, i) => i !== pIdx);
                            setParticipants(newParticipants);
                            const newAssignments = { ...itemAssignments };
                            const key = participant.toLowerCase().trim();
                            delete newAssignments[key];
                            setItemAssignments(newAssignments);
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-2">
                        <strong className="text-sm text-gray-700">Assigned Items:</strong>
                        {(() => {
                          const key = participant.toLowerCase().trim();
                          const indices = itemAssignments[key] || [];
                          return indices.length > 0 ? (
                            <ul className="space-y-1">
                              {indices.map((itemIdx) => {
                                const item = ocrResult.items[itemIdx];
                                if (!item) return null;
                                const assignedCount = participants.filter((p) => {
                                  const pKey = p.toLowerCase().trim();
                                  return itemAssignments[pKey] && itemAssignments[pKey].includes(itemIdx);
                                }).length;
                                const amountPerPerson = assignedCount > 0 ? (item.price || 0) / assignedCount : 0;
                                return (
                                  <li key={itemIdx} className="text-sm text-gray-700">
                                    {item.name} - ${amountPerPerson.toFixed(2)}
                                    {assignedCount > 1 && <span className="text-xs text-blue-600 ml-1">(shared with {assignedCount})</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No items assigned</p>
                          );
                        })()}
                        {(() => {
                          const key = participant.toLowerCase().trim();
                          const indices = itemAssignments[key] || [];
                          return indices.length > 0 && (
                            <div className="pt-2 border-t border-gray-200 text-sm">
                              <strong>Total: ${(indices.reduce((sum, itemIdx) => {
                                const item = ocrResult.items[itemIdx];
                                if (!item) return sum;
                                const assignedCount = participants.filter((p) => {
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
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Items ({ocrResult.items.length})</h4>
                <div className="space-y-4">
                  {ocrResult.items.map((item, itemIdx) => {
                    const assignedTo = participants.filter((p) => {
                      const pKey = p.toLowerCase().trim();
                      return itemAssignments[pKey] && itemAssignments[pKey].includes(itemIdx);
                    });
                    const assignedCount = assignedTo.length;
                    const amountPerPerson = assignedCount > 0 ? (item.price || 0) / assignedCount : 0;
                    return (
                      <div key={itemIdx} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                            {assignedCount > 0 && (
                              <span className="block text-xs text-gray-500">(${amountPerPerson.toFixed(2)} per person × {assignedCount})</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assign to:</label>
                          {participants.length === 0 ? (
                            <p className="text-sm text-gray-500">Add participants first to assign items</p>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              {participants.map((participant) => {
                                const pKey = participant.toLowerCase().trim();
                                return (
                                  <label key={participant} className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-200 has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500 has-[:checked]:text-blue-700">
                                    <input
                                      type="checkbox"
                                      checked={itemAssignments[pKey]?.includes(itemIdx) || false}
                                      onChange={(e) => {
                                        const newAssignments = { ...itemAssignments };
                                        if (!newAssignments[pKey]) newAssignments[pKey] = [];
                                        if (e.target.checked) {
                                          if (!newAssignments[pKey].includes(itemIdx)) newAssignments[pKey] = [...newAssignments[pKey], itemIdx];
                                        } else {
                                          newAssignments[pKey] = newAssignments[pKey].filter((idx) => idx !== itemIdx);
                                        }
                                        setItemAssignments(newAssignments);
                                      }}
                                    />
                                    {participant}
                                    {itemAssignments[pKey]?.includes(itemIdx) && (
                                      <span className="text-xs text-blue-600 font-medium">(${amountPerPerson.toFixed(2)})</span>
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

            {/* Complete */}
            <div className="text-center">
              <button
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Saving...' : '✓ Complete & Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}
    </div>
  );
};

export default NewExpense;