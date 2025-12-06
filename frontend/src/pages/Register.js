import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Key,
  DollarSign,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import authService from '../services/authService';

const Register = ({ onRegister }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: send code, 2: register
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
        setSuccess('Verification code sent! Check your email or terminal.');
        setStep(2);
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send code, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.register(email, password, verificationCode);
      if (result.success) {
        onRegister?.();
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-15 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
            <DollarSign size={48} />
          </div>
          <h1 className="text-4xl font-bold mb-4">SmartBill</h1>
          <p className="text-xl opacity-90 mb-12">Join thousands of users splitting bills effortlessly</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3"><span className="w-2 h-2 bg-white rounded-full" /><span>Quick email verification</span></div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 bg-white rounded-full" /><span>Secure account protection</span></div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 bg-white rounded-full" /><span>Start splitting in minutes</span></div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-15 lg:px-6 lg:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-12 lg:px-6 lg:py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-sm text-gray-500">{step === 1 ? 'Enter your email to get started' : 'Complete your registration'}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 px-5 sm:px-10">
            <div className={`flex flex-col items-center gap-2 z-10 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-xs font-semibold ${step >= 1 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200'}`}>1</div>
              <span className="text-xs sm:text-[11px]">Email</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className={`flex flex-col items-center gap-2 z-10 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-xs font-semibold ${step >= 2 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200'}`}>2</div>
              <span className="text-xs sm:text-[11px]">Verify</span>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-6">
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm mb-6">
              <CheckCircle size={16} /><span>{success}</span>
            </div>
          )}

          {/* Step 1: Send code */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                    className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">We'll send a verification code to this email</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-px hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? <span>Sending...</span> : <><span>Send Verification Code</span><ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* Step 2: Register */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoFocus
                    className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Check your email or terminal for the code</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-px hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? <span>Creating Account...</span> : <><span>Create Account</span><ArrowRight size={18} /></>}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                className="w-full px-4 py-3 mt-3 bg-white border border-gray-200 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition"
              >
                ← Back to Email
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;