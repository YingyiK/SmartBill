import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddParticipantModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    const colors = ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    onAdd({
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      avatar: name.trim()[0].toUpperCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
      status: 'Active participant',
      notifications: true,
    });
    setName(''); setEmail(''); setErrors({}); onClose();
  };

  const cancel = () => { setName(''); setEmail(''); setErrors({}); onClose(); };

  return (
    <div
      onClick={e => e.target === e.currentTarget && cancel()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-[90%] max-w-lg bg-white rounded-2xl shadow-xl sm:w-full sm:mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Participant</h2>
          <button onClick={cancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded-md">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                         ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={cancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantModal;