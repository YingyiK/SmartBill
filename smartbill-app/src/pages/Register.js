import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Register.css';

const Register = ({ onRegister }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: 发送验证码, 2: 注册
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await authService.sendVerificationCode(email);
      if (result.success) {
        setSuccess('验证码已发送到您的邮箱，请查收');
        setStep(2);
      } else {
        setError(result.error || '发送验证码失败');
      }
    } catch (err) {
      setError(err.message || '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register(email, password, verificationCode);
      if (result.success) {
        // Notify parent component
        if (onRegister) {
          onRegister();
        }
        navigate('/dashboard');
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">SmartBill</h1>
        <p className="register-subtitle">创建新账户</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="register-form">
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label htmlFor="verificationCode">验证码</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                placeholder="6位验证码"
                maxLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="至少6位"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="再次输入密码"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep(1);
                setError('');
                setSuccess('');
              }}
            >
              返回
            </button>
          </form>
        )}

        <div className="register-footer">
          <p>
            已有账户？{' '}
            <a href="/login" className="link">
              立即登录
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

