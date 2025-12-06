import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, DollarSign, ArrowRight, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        onLogin?.();
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left panel: gradient hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-15 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
            <DollarSign size={48} />
          </div>
          <h1 className="text-4xl font-bold mb-4">SmartBill</h1>
          <p className="text-xl opacity-90 mb-12">Smart Expense Splitting Made Easy</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              <span>AI-powered receipt scanning</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              <span>Automatic bill splitting</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              <span>Easy email notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: card */}
      <div className="flex-1 flex items-center justify-center p-15 lg:px-6 lg:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-12 lg:px-6 lg:py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-6">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-px hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;