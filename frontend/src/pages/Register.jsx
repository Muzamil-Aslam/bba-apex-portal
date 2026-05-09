import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, Phone, BookOpen, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Password strength scorer
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-500',    text: 'text-red-500' };
  if (score <= 3) return { score, label: 'Medium',  color: 'bg-orange-400', text: 'text-orange-500' };
  return             { score, label: 'Strong',  color: 'bg-green-500',  text: 'text-green-600' };
}

export default function Register() {
  const [form, setForm] = useState({ name: '', uid: '', email: '', password: '', confirmPassword: '', course: '', semester: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user } = useAuth();
  const navigate = useNavigate();
  if (user) { navigate('/dashboard', { replace: true }); return null; }

  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, uid: form.uid, email: form.email, password: form.password, course: form.course, semester: Number(form.semester) || undefined, phone: form.phone });
      toast.success('Account created successfully! Welcome to BBA Apex!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-maroon-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-gold font-bold text-2xl font-heading">A</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">Create Account</h1>
          <p className="text-gray-500 font-body text-sm mt-1">Join BBA Apex – Chandigarh University</p>
        </div>
        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-body">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Full Name', field: 'name', type: 'text', Icon: User, placeholder: 'e.g. Priya Sharma', required: true, colSpan: false },
              { label: 'University UID', field: 'uid', type: 'text', Icon: Hash, placeholder: 'e.g. 21BBA1001', required: true, colSpan: false },
              { label: 'Email Address', field: 'email', type: 'email', Icon: Mail, placeholder: 'your@email.com', required: true, colSpan: false },
              { label: 'Phone Number', field: 'phone', type: 'tel', Icon: Phone, placeholder: '10-digit mobile number', required: false, colSpan: false },
              { label: 'Course', field: 'course', type: 'text', Icon: BookOpen, placeholder: 'e.g. BBA, MBA', required: false, colSpan: false },
              { label: 'Semester', field: 'semester', type: 'number', Icon: BookOpen, placeholder: '1-8', required: false, colSpan: false },
            ].map(({ label, field, type, Icon, placeholder, required, colSpan }) => (
              <div key={field} className={colSpan ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">{label} {required && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={type} value={form[field]} onChange={e => f(field, e.target.value)} required={required} placeholder={placeholder} min={field === 'semester' ? 1 : undefined} max={field === 'semester' ? 8 : undefined} className="input-field pl-11" />
                </div>
              </div>
            ))}
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={e => f('password', e.target.value)}
                  required placeholder="Minimum 6 characters" className="input-field pl-11 pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold font-heading ${strength.text}`}>{strength.label} password</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)}
                  required placeholder="Repeat your password" className="input-field pl-11 pr-11"
                />
                {form.confirmPassword && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {form.password === form.confirmPassword
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <AlertCircle size={16} className="text-red-400" />}
                  </span>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Creating Account...</span> : 'Create Account'}
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-gray-600 font-body mt-6">
            Already have an account? <Link to="/login" className="text-maroon font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
