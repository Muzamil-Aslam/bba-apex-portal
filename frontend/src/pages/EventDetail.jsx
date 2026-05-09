import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Award, ArrowLeft, Share2, CheckCircle, ListOrdered } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data.event);
        if (user) {
          const [regData, waitData] = await Promise.allSettled([
            api.get('/registrations/my'),
            api.get('/waitlist/my'),
          ]);
          if (regData.status === 'fulfilled')
            setIsRegistered(regData.value.data.registrations.some(r => r.event?._id === id));
          if (waitData.status === 'fulfilled')
            setIsWaitlisted(waitData.value.data.waitlist?.some(w => w.event?._id === id) || false);
        }
      } catch {
        toast.error('Event not found');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user, navigate]);

  const handleRegister = async () => {
    if (!user) { toast.error('Please login to register'); navigate('/login'); return; }
    setRegistering(true);
    try {
      await api.post(`/registrations/event/${id}`);
      toast.success('Successfully registered!');
      setIsRegistered(true);
      setEvent(prev => ({ ...prev, currentParticipants: prev.currentParticipants + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    const url  = window.location.href;
    const text = `Check out this event: ${event.title} — Register on BBA Apex Portal!`;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Event link copied to clipboard!');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    setJoiningWaitlist(true);
    try {
      await api.post(`/waitlist/event/${id}`);
      toast.success('Added to waitlist! We\'ll notify you if a spot opens.');
      setIsWaitlisted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join waitlist');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!event) return null;

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull = event.currentParticipants >= event.maxParticipants;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-header">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <Link to="/events" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 font-body text-sm transition-colors">
              <ArrowLeft size={16} /> Back to Events
            </Link>
            <button
              onClick={handleShare}
              className="mb-4 inline-flex items-center gap-2 text-gray-300 hover:text-gold border border-white/20 hover:border-gold/50 px-3 py-1.5 rounded-lg text-sm font-heading transition-all duration-200"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
          <span className="badge bg-gold text-maroon font-heading">{event.category}</span>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mt-3">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {event.poster && (
            <div className="card overflow-hidden">
              <img src={event.poster} alt={event.title} className="w-full h-64 object-cover" />
            </div>
          )}
          <div className="card p-6">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">About This Event</h2>
            <p className="text-gray-600 font-body leading-relaxed whitespace-pre-line">{event.description}</p>
            {event.speakerName && (
              <div className="mt-6 p-4 bg-maroon-50 rounded-xl border border-maroon-100">
                <h3 className="font-heading font-semibold text-maroon mb-1">Featured Speaker</h3>
                <p className="font-body text-gray-800 font-medium">{event.speakerName}</p>
                {event.speakerDesignation && <p className="font-body text-gray-500 text-sm">{event.speakerDesignation}</p>}
              </div>
            )}
            {event.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-6 space-y-4">
            <h3 className="font-heading font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Event Details</h3>
            {[
              { Icon: Calendar, label: 'Date & Time', val: format(new Date(event.date), 'EEEE, dd MMM yyyy') },
              { Icon: MapPin, label: 'Venue', val: event.venue },
              { Icon: Clock, label: 'Registration Deadline', val: format(new Date(event.registrationDeadline), 'dd MMM yyyy') },
              { Icon: Users, label: 'Participants', val: `${event.currentParticipants} / ${event.maxParticipants}` },
              { Icon: Award, label: 'Points', val: `${event.points} pts${event.winnerBonus ? ` (+${event.winnerBonus} winner bonus)` : ''}` },
            ].map(({ Icon, label, val }) => (
              <div key={label} className="flex gap-3">
                <Icon size={16} className="text-maroon mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-heading uppercase tracking-wide">{label}</p>
                  <p className="text-gray-700 font-body text-sm font-medium mt-0.5">{val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            {isRegistered ? (
              <div className="text-center">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="font-heading font-bold text-green-700 text-lg">You're Registered!</p>
                <p className="text-gray-500 text-sm font-body mt-1">Check your dashboard for details</p>
                <Link to="/dashboard" className="btn-primary w-full text-center block mt-4">Go to Dashboard</Link>
              </div>
            ) : (
              <>
                {isFull && !isDeadlinePassed && event.status !== 'cancelled' ? (
                  isWaitlisted ? (
                    <div className="text-center">
                      <ListOrdered size={36} className="text-yellow-500 mx-auto mb-2" />
                      <p className="font-heading font-bold text-yellow-700">You're on the Waitlist</p>
                      <p className="text-gray-500 text-sm font-body mt-1">We'll notify you when a spot opens up.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3 text-center">
                        <p className="text-orange-700 font-heading font-semibold text-sm">Event is Full</p>
                        <p className="text-orange-600 text-xs font-body mt-0.5">Join the waitlist to get notified if a spot opens</p>
                      </div>
                      <button onClick={handleJoinWaitlist} disabled={joiningWaitlist}
                        className="w-full py-3 btn-gold rounded-xl font-heading font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2">
                        <ListOrdered size={16} />
                        {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    </div>
                  )
                ) : (
                  <button onClick={handleRegister} disabled={registering || isDeadlinePassed || event.status === 'cancelled'}
                    className={`w-full py-3 rounded-xl font-heading font-semibold text-base transition-all duration-200 ${registering || isDeadlinePassed || event.status === 'cancelled' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}>
                    {registering ? 'Registering...' : isDeadlinePassed ? 'Registration Closed' : event.status === 'cancelled' ? 'Event Cancelled' : 'Register for Event'}
                  </button>
                )}
                {!user && <p className="text-center text-xs text-gray-400 font-body mt-3">You must be <Link to="/login" className="text-maroon underline">logged in</Link> to register</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
