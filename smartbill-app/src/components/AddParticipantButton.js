import React from 'react';
import { Plus } from 'lucide-react';
import './AddParticipantButton.css';

const AddParticipantButton = ({ onClick }) => {
  return (
    <button className="add-participant-button" onClick={onClick}>
      <Plus size={20} />
      Add Participant
    </button>
  );
};

export default AddParticipantButton;