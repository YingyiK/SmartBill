import React, { useState } from 'react';
import ParticipantCard from '../components/ParticipantCard';
import AddParticipantButton from '../components/AddParticipantButton';
import AddParticipantModal from '../components/AddParticipantModal';
import EditParticipantModal from '../components/EditParticipantModal';  // ← 添加这行
import './Participants.css';

const Participants = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);  // ← 添加这行
  const [selectedParticipant, setSelectedParticipant] = useState(null);  // ← 添加这行

  const [participants, setParticipants] = useState([
    {
      id: 1,
      name: 'Eliza',
      email: 'eliza@example.com',
      avatar: 'E',
      color: '#8B5CF6',
      status: 'Active participant',
      notifications: true
    },
    {
      id: 2,
      name: 'Diana',
      email: 'diana@example.com',
      avatar: 'D',
      color: '#6366F1',
      status: 'Active participant',
      notifications: true
    },
    {
      id: 3,
      name: 'Rita',
      email: 'rita@example.com',
      avatar: 'R',
      color: '#8B5CF6',
      status: 'Active participant',
      notifications: true
    },
    {
      id: 4,
      name: 'Xing',
      email: 'xing@example.com',
      avatar: 'X',
      color: '#6366F1',
      status: 'Active participant',
      notifications: true
    }
  ]);

  // 打开编辑模态框
  const handleEdit = (id) => {
    const participant = participants.find(p => p.id === id);
    setSelectedParticipant(participant);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    console.log('Delete participant:', id);
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleAddParticipant = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 关闭编辑模态框
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedParticipant(null);
  };

  const handleAddNewParticipant = (newParticipant) => {
    setParticipants([...participants, newParticipant]);
  };

  // 更新参与者
  const handleUpdateParticipant = (updatedParticipant) => {
    setParticipants(participants.map(p => 
      p.id === updatedParticipant.id ? updatedParticipant : p
    ));
  };

  return (
    <div className="participants-page">
      <div className="participants-header">
        <div className="participants-title-section">
          <h1 className="participants-title">Participants</h1>
          <p className="participants-subtitle">
            Manage people you frequently split expenses with
          </p>
        </div>
        <AddParticipantButton onClick={handleAddParticipant} />
      </div>

      <div className="participants-grid">
        {participants.map(participant => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* 添加参与者模态框 */}
      <AddParticipantModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddNewParticipant}
      />

      {/* 编辑参与者模态框 */}
      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleUpdateParticipant}
        participant={selectedParticipant}
      />
    </div>
  );
};

export default Participants;