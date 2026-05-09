import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Minimum 6 characters'); return; }
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-maroon-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-gold font-bold text-2xl font-heading">A</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">Set New Password</h1>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl mb-2">Password Updated!</h2>
              <p className="text-gray-500 font-body text-sm mb-4">Redirecting to login in 3 seconds...</p>
              <Link to="/login" className="btn-primary block text-center py-3">Go to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[['New Password', password, setPassword], ['Confirm Password', confirm, setConfirm]].map(([label, val, setter], i) => (
                <div key={label}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">{label}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={show ? 'text' : 'password'} value={val} onChange={e => setter(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" className="input-field pl-11 pr-11" />
                    {i === 1 && <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
