import React from 'react';
import { Edit2, Trash2, User, Mail } from 'lucide-react';
import './ParticipantCard.css';

const ParticipantCard = ({ participant, onEdit, onDelete }) => {
  return (
    <div className="participant-card">
      <div className="participant-card-header">
        <div className="participant-info">
          <div 
            className="participant-avatar" 
            style={{ backgroundColor: participant.color }}
          >
            {participant.avatar}
          </div>
          <div className="participant-details">
            <h3 className="participant-name">{participant.name}</h3>
            <p className="participant-email">{participant.email}</p>
          </div>
        </div>
        
        <div className="participant-actions">
          <button 
            className="action-button"
            onClick={() => onEdit(participant.id)}
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          <button 
            className="action-button action-button-delete"
            onClick={() => onDelete(participant.id)}
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="participant-card-body">
        <div className="participant-status">
          <User size={16} />
          <span>{participant.status}</span>
        </div>
        <div className="participant-notifications">
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
};

export default ParticipantCard;