import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddParticipantModal.css';

const AddParticipantModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  // 如果模态框未打开，不渲染
  if (!isOpen) return null;

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
      // 生成随机颜色
      const colors = ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // 创建新参与者对象
      const newParticipant = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        avatar: name.trim().charAt(0).toUpperCase(),
        color: randomColor,
        status: 'Active participant',
        notifications: true
      };

      // 调用父组件的添加函数
      onAdd(newParticipant);

      // 重置表单
      setName('');
      setEmail('');
      setErrors({});

      // 关闭模态框
      onClose();
    }
  };

  // 处理取消
  const handleCancel = () => {
    setName('');
    setEmail('');
    setErrors({});
    onClose();
  };

  // 点击背景关闭
  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      handleCancel();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2 className="modal-title">Add Participant</h2>
          <button 
            className="modal-close-button"
            onClick={handleCancel}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* 模态框内容 */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* 姓名输入 */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            />
            {errors.name && (
              <span className="form-error">{errors.name}</span>
            )}
          </div>

          {/* 邮箱输入 */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          {/* 按钮组 */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="modal-button modal-button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button-submit"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantModal;