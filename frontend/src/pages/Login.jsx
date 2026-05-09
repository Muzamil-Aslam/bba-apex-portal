import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (user) { navigate(user.role === 'student' ? '/dashboard' : '/admin', { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const loggedUser = await login(form.email, form.password);
      toast.success(`Welcome back, ${loggedUser.name.split(' ')[0]}!`);
      navigate(loggedUser.role === 'student' ? '/dashboard' : '/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-maroon-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-gold font-bold text-2xl font-heading">A</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 font-body text-sm mt-1">Sign in to BBA Apex Portal</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-body">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="your@email.com" className="input-field pl-11" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Enter password" className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Signing in...</span> : 'Sign In'}
            </button>
          </form>
          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-sm text-maroon hover:underline font-body">Forgot password?</Link>
          </div>
          <p className="text-center text-sm text-gray-600 font-body mt-3">
            Don't have an account? <Link to="/register" className="text-maroon font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
