import React from 'react';
import { Plus } from 'lucide-react';

const AddParticipantButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-6 py-3 text-white bg-blue-500
               hover:bg-blue-600 active:scale-95
               rounded-lg font-semibold text-base
               transition-colors duration-200"
  >
    <Plus size={20} />
    Add Participant
  </button>
);

export default AddParticipantButton;