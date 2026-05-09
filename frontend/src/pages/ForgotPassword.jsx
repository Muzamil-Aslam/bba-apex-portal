import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Step 1 – enter email
function StepEmail({ onOtpSent }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      onOtpSent(email, data.devOtp || null, data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Registered Email Address</label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="your@email.com" className="input-field pl-11"
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP...</span>
          : 'Send OTP'}
      </button>
      <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 hover:text-maroon text-sm font-body mt-2 transition-colors">
        <ArrowLeft size={14} /> Back to Login
      </Link>
    </form>
  );
}

// Step 2 – enter OTP + new password
function StepOtp({ email, devOtp, onSuccess }) {
  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPass) { toast.error('Passwords do not match.'); return; }
    if (newPassword.length < 6)      { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otp.trim(), newPassword });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('A new OTP has been sent.');
      if (data.devOtp) toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 20000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Dev-mode banner */}
      {devOtp && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-center">
          <p className="text-xs text-yellow-700 font-body mb-1">⚠️ Email not configured — development mode</p>
          <p className="text-yellow-800 font-heading font-bold text-sm">Your OTP:</p>
          <p className="text-3xl font-bold tracking-[12px] text-maroon mt-1 font-heading">{devOtp}</p>
          <p className="text-xs text-yellow-600 mt-1 font-body">Configure EMAIL_USER / EMAIL_PASS in .env to send real emails.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Enter 6-Digit OTP</label>
        <div className="relative">
          <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            required placeholder="• • • • • •"
            className="input-field pl-11 tracking-[8px] text-center font-heading text-lg"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 font-body">
          Sent to <strong>{email}</strong>. &nbsp;
          <button type="button" onClick={handleResend} disabled={resending}
            className="text-maroon underline font-semibold disabled:opacity-50">
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
            required minLength={6} placeholder="Min. 6 characters"
            className="input-field pl-11 pr-11"
          />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-maroon">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Confirm New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
            required minLength={6} placeholder="Repeat password"
            className="input-field pl-11"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</span>
          : 'Reset Password'}
      </button>
    </form>
  );
}

// Step 3 – success
function StepDone() {
  return (
    <div className="text-center py-4">
      <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
      <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">Password Reset!</h2>
      <p className="text-gray-500 font-body text-sm mb-6">Your password has been updated successfully. You can now log in.</p>
      <Link to="/login" className="btn-primary w-full block text-center py-3">Go to Login</Link>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ForgotPassword() {
  // step: 'email' | 'otp' | 'done'
  const [step, setStep]     = useState('email');
  const [email, setEmail]   = useState('');
  const [devOtp, setDevOtp] = useState(null);

  const stepTitles = {
    email: { heading: 'Forgot Password',   sub: 'Enter your registered email to receive an OTP' },
    otp:   { heading: 'Enter OTP',         sub: 'Check your email and enter the 6-digit code below' },
    done:  { heading: 'All Done!',         sub: 'Your password has been changed' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-maroon-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            {step === 'done'
              ? <CheckCircle size={28} className="text-gold" />
              : step === 'otp'
              ? <ShieldCheck size={28} className="text-gold" />
              : <span className="text-gold font-bold text-2xl font-heading">A</span>}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">{stepTitles[step].heading}</h1>
          <p className="text-gray-500 font-body text-sm mt-1">{stepTitles[step].sub}</p>
        </div>

        {/* Progress dots */}
        {step !== 'done' && (
          <div className="flex justify-center gap-2 mb-6">
            {['email','otp'].map(s => (
              <span key={s} className={`w-2.5 h-2.5 rounded-full transition-all ${step === s ? 'bg-maroon scale-125' : 'bg-gray-300'}`} />
            ))}
          </div>
        )}

        <div className="card p-8">
          {step === 'email' && (
            <StepEmail onOtpSent={(em, otp, msg) => {
              setEmail(em);
              setDevOtp(otp);
              toast.success(msg);
              if (otp) toast(`Dev OTP: ${otp}`, { icon: '🔑', duration: 20000 });
              setStep('otp');
            }} />
          )}
          {step === 'otp' && (
            <StepOtp email={email} devOtp={devOtp} onSuccess={() => setStep('done')} />
          )}
          {step === 'done' && <StepDone />}
        </div>
      </div>
    </div>
  );
}
