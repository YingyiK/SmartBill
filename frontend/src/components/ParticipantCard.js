// ParticipantCard.js
import React from 'react';
import { Edit2, Trash2, User, Mail } from 'lucide-react';

const ParticipantCard = ({ participant, onEdit, onDelete }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col gap-3">
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg font-semibold"
          style={{ backgroundColor: participant.color }}
        >
          {participant.avatar}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{participant.name}</h3>
          <p className="text-sm text-gray-500 truncate">{participant.email}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(participant.id)}
          className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 text-gray-500"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(participant.id)}
          className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-red-100 hover:text-red-600 text-gray-500"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>

    {/* Body */}
    <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <User size={16} />
        <span>{participant.status}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Mail size={16} />
        <span>
          {participant.notifications
            ? 'Email notifications enabled'
            : 'Email notifications disabled'}
        </span>
      </div>
    </div>
  </div>
);

export default ParticipantCard;