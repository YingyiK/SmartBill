import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './EditParticipantModal.css';

const EditParticipantModal = ({ isOpen, onClose, onUpdate, participant }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  // 当模态框打开时，填充现有数据
  useEffect(() => {
    if (isOpen && participant) {
      setName(participant.name);
      setEmail(participant.email);
      setErrors({});
    }
  }, [isOpen, participant]);

  // 如果模态框未打开，不渲染
  if (!isOpen || !participant) return null;

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 创建更新后的参与者对象
      const updatedParticipant = {
        ...participant,
        name: name.trim(),
        email: email.trim(),
        avatar: name.trim().charAt(0).toUpperCase()  // 更新头像字母
      };

      // 调用父组件的更新函数
      onUpdate(updatedParticipant);

      // 关闭模态框
      onClose();
    }
  };

  // 处理取消
  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  // 点击背景关闭
  const handleBackdropClick = (e) => {
    if (e.target.className === 'edit-modal-backdrop') {
      handleCancel();
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={handleBackdropClick}>
      <div className="edit-modal-container">
        {/* 模态框头部 */}
        <div className="edit-modal-header">
          <h2 className="edit-modal-title">Edit Participant</h2>
          <button 
            className="edit-modal-close-button"
            onClick={handleCancel}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* 模态框内容 */}
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {/* 姓名输入 */}
          <div className="edit-form-group">
            <label htmlFor="edit-name" className="edit-form-label">Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className={`edit-form-input ${errors.name ? 'edit-form-input-error' : ''}`}
            />
            {errors.name && (
              <span className="edit-form-error">{errors.name}</span>
            )}
          </div>

          {/* 邮箱输入 */}
          <div className="edit-form-group">
            <label htmlFor="edit-email" className="edit-form-label">Email</label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className={`edit-form-input ${errors.email ? 'edit-form-input-error' : ''}`}
            />
            {errors.email && (
              <span className="edit-form-error">{errors.email}</span>
            )}
          </div>

          {/* 按钮组 */}
          <div className="edit-modal-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="edit-modal-button edit-modal-button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-modal-button edit-modal-button-submit"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditParticipantModal;