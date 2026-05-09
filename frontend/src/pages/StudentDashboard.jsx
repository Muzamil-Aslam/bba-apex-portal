import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Award, Trophy, BookOpen, Download, User, TrendingUp, Clock, CheckCircle, XCircle, QrCode, Star, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { pending: 'badge bg-yellow-100 text-yellow-700', confirmed: 'badge bg-blue-100 text-blue-700', attended: 'badge-green', cancelled: 'badge bg-red-100 text-red-700' };

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange && onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function QRModal({ reg, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-maroon rounded-xl flex items-center justify-center mx-auto mb-4">
          <QrCode size={24} className="text-gold" />
        </div>
        <h3 className="font-heading font-bold text-gray-900 text-lg mb-1">{reg.event?.title}</h3>
        <p className="text-gray-400 text-sm font-body mb-4">Scan this QR at the event entry</p>
        {reg.qrCode ? (
          <img src={reg.qrCode} alt="QR Code" className="mx-auto w-48 h-48 rounded-xl border-2 border-maroon-100" />
        ) : (
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
            <p className="text-gray-400 text-sm font-body text-center px-4">QR code will appear after registration is confirmed</p>
          </div>
        )}
        <p className="font-heading font-bold text-maroon text-lg mt-4 tracking-widest">{reg.registrationNumber}</p>
        <p className="text-gray-400 text-xs font-body mt-1">Registration Number</p>
        <button onClick={onClose} className="btn-primary mt-6 w-full">Close</button>
      </div>
    </div>
  );
}

function FeedbackForm({ reg, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please give a rating'); return; }
    setSubmitting(true);
    try {
      await api.post(`/feedback/event/${reg.event?._id}`, { rating, comment, wouldRecommend: recommend });
      toast.success('Thanks for your feedback!');
      onSubmitted(reg._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-yellow-50 rounded-xl p-4 border border-yellow-100">
      <p className="font-heading font-semibold text-gray-700 text-sm mb-3">Rate this event</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        className="input-field mt-3 text-sm min-h-16 resize-none"
        maxLength={500}
      />
      <label className="flex items-center gap-2 mt-2 cursor-pointer">
        <input type="checkbox" checked={recommend} onChange={e => setRecommend(e.target.checked)} className="w-4 h-4 accent-maroon" />
        <span className="text-sm text-gray-600 font-body">I'd recommend this event to others</span>
      </label>
      <button type="submit" disabled={submitting} className="btn-primary mt-3 text-sm py-2 px-5 disabled:opacity-60">
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

export default function StudentDashboard() {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');
  const [qrModal, setQrModal] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(new Set());
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/student'),
      api.get('/feedback/my').catch(() => ({ data: { feedbacks: [] } })),
    ]).then(([dashRes, fbRes]) => {
      setDashData(dashRes.data);
      const given = new Set((fbRes.data.feedbacks || []).map(f => f.event?._id || f.event));
      setFeedbackGiven(given);
      setMyFeedbacks(fbRes.data.feedbacks || []);
    }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  const handleFeedbackSubmitted = (regId) => {
    // Re-fetch to get latest feedbacks
    api.get('/feedback/my').then(({ data }) => {
      const given = new Set((data.feedbacks || []).map(f => f.event?._id || f.event));
      setFeedbackGiven(given);
      setMyFeedbacks(data.feedbacks || []);
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading your dashboard..." /></div>;
  if (!dashData) return null;

  const { stats, registrations, certificates } = dashData;

  const attendedWithoutFeedback = registrations?.filter(
    r => r.status === 'attended' && !feedbackGiven.has(r.event?._id)
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon-800 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-maroon font-bold text-2xl font-heading">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-gray-300 font-body text-sm mt-1">{user?.uid} • {user?.course} {user?.semester ? `• Sem ${user.semester}` : ''}</p>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-gold font-bold text-3xl font-heading">{stats?.totalPoints || 0}</p>
              <p className="text-gray-300 text-sm font-body">Total Points</p>
              {stats?.rank && <p className="text-gold-300 text-xs font-heading mt-0.5">Rank #{stats.rank}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6 pb-14">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Registered Events', val: stats?.totalRegistrations || 0, Icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Events Attended', val: stats?.attended || 0, Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Certificates', val: stats?.certificates || 0, Icon: Award, color: 'text-gold-600', bg: 'bg-yellow-50' },
            { label: 'Points Earned', val: stats?.totalPoints || 0, Icon: Trophy, color: 'text-maroon', bg: 'bg-maroon-50' },
          ].map(({ label, val, Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`text-2xl font-bold font-heading ${color}`}>{val}</p>
              <p className="text-gray-500 text-xs font-body mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Feedback prompt banner */}
        {attendedWithoutFeedback.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-yellow-800 text-sm">You have {attendedWithoutFeedback.length} event{attendedWithoutFeedback.length > 1 ? 's' : ''} to review!</p>
              <p className="text-yellow-700 text-xs font-body">Share your feedback on the events you attended.</p>
            </div>
            <button onClick={() => setActiveTab('feedback')} className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1.5 rounded-full font-heading transition-colors">
              Give Feedback
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              ['registrations', Calendar, 'My Registrations'],
              ['certificates', Award, 'My Certificates'],
              ['feedback', MessageSquare, `Feedback${attendedWithoutFeedback.length > 0 ? ` (${attendedWithoutFeedback.length})` : ''}`],
            ].map(([tab, Icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-center gap-2 py-4 px-6 font-heading font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'text-maroon border-b-2 border-maroon bg-maroon-50/50' : 'text-gray-500 hover:text-maroon hover:bg-gray-50'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* REGISTRATIONS TAB */}
            {activeTab === 'registrations' && (
              registrations?.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div key={reg._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-maroon-100 hover:bg-gray-50 transition-all">
                      <div className="w-12 h-12 bg-gradient-to-br from-maroon to-maroon-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-gray-900 truncate">{reg.event?.title || 'Event'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {reg.event?.date && <span className="text-xs text-gray-500 font-body flex items-center gap-1"><Clock size={11} />{format(new Date(reg.event.date), 'dd MMM yyyy')}</span>}
                          {reg.event?.category && <span className="text-xs text-maroon font-heading bg-maroon-50 px-2 py-0.5 rounded-full">{reg.event.category}</span>}
                        </div>
                        {reg.registrationNumber && (
                          <p className="text-xs text-gray-400 font-body mt-0.5 font-mono">{reg.registrationNumber}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {reg.event?.points && <span className="text-xs font-bold text-gold-700 bg-yellow-50 px-2 py-1 rounded-full font-heading">+{reg.event.points} pts</span>}
                        <span className={`${statusBadge[reg.status]} capitalize`}>{reg.status}</span>
                        <button
                          onClick={() => setQrModal(reg)}
                          className="p-2 text-maroon hover:bg-maroon-50 rounded-lg transition-colors"
                          title="View QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-200" />
                  <h3 className="font-heading font-bold text-lg mb-2">No registrations yet</h3>
                  <p className="font-body text-sm mb-5">Start exploring and registering for events</p>
                  <Link to="/events" className="btn-primary">Browse Events</Link>
                </div>
              )
            )}

            {/* CERTIFICATES TAB */}
            {activeTab === 'certificates' && (
              certificates?.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-maroon-100 hover:bg-gray-50 transition-all">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{cert.certificateType === 'winner' ? '🥇' : '📜'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-gray-900 truncate">{cert.event?.title || 'Certificate'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 font-body">{cert.certificateNumber}</span>
                          {cert.issuedAt && <span className="text-xs text-gray-400 font-body">{format(new Date(cert.issuedAt), 'dd MMM yyyy')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge bg-green-100 text-green-700 capitalize">{cert.certificateType}</span>
                        <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" download className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-gray-400">
                  <Award size={48} className="mx-auto mb-4 text-gray-200" />
                  <h3 className="font-heading font-bold text-lg mb-2">No certificates yet</h3>
                  <p className="font-body text-sm mb-5">Attend events to earn participation certificates</p>
                  <Link to="/events" className="btn-primary">Browse Events</Link>
                </div>
              )
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
              <div>
                {attendedWithoutFeedback.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-gray-800 mb-4">Pending Reviews</h3>
                    <div className="space-y-4">
                      {attendedWithoutFeedback.map(reg => (
                        <div key={reg._id} className="border border-yellow-100 rounded-xl p-4 bg-white">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                              <Star size={18} className="text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-heading font-bold text-gray-900">{reg.event?.title}</p>
                              {reg.event?.date && <p className="text-xs text-gray-400 font-body">{format(new Date(reg.event.date), 'dd MMM yyyy')}</p>}
                            </div>
                          </div>
                          <FeedbackForm reg={reg} onSubmitted={handleFeedbackSubmitted} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myFeedbacks.length > 0 && (
                  <div>
                    <h3 className="font-heading font-bold text-gray-800 mb-4">My Reviews</h3>
                    <div className="space-y-3">
                      {myFeedbacks.map((fb, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 bg-white flex items-start gap-4">
                          <div className="flex-1">
                            <p className="font-heading font-bold text-gray-900 text-sm">{fb.event?.title || 'Event'}</p>
                            <StarRating value={fb.rating} />
                            {fb.comment && <p className="text-gray-500 text-sm font-body mt-1 italic">"{fb.comment}"</p>}
                          </div>
                          {fb.wouldRecommend && <span className="badge bg-green-100 text-green-700 text-xs whitespace-nowrap">👍 Recommended</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {attendedWithoutFeedback.length === 0 && myFeedbacks.length === 0 && (
                  <div className="text-center py-14 text-gray-400">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
                    <h3 className="font-heading font-bold text-lg mb-2">No feedback yet</h3>
                    <p className="font-body text-sm">Attend events and you'll be able to rate them here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModal && <QRModal reg={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  );
}
