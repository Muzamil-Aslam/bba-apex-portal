import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Star, Trophy, Users, Calendar, Briefcase, Award, ArrowRight, Mail, Phone } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '+' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, started]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [leaderboard, setLeaderboard]       = useState([]);
  const [stats, setStats]                   = useState({ totalEvents: 0, totalRegistrations: 0, industrySessions: 0, competitions: 0 });
  const [loading, setLoading]               = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, lbRes, statsRes, staffRes] = await Promise.all([
          api.get('/events?status=upcoming&limit=6'),
          api.get('/users/leaderboard?limit=10'),
          api.get('/events/stats'),
          api.get('/users/staff').catch(() => ({ data: { staff: [] } })),
        ]);
        setUpcomingEvents(eventsRes.data.events);
        setLeaderboard(lbRes.data.leaderboard);
        setStats(statsRes.data.stats);
        setFaculty(staffRes.data.staff || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async (eventId) => {
    if (!user) { toast.error('Please login to register for events'); navigate('/login'); return; }
    try {
      await api.post(`/registrations/event/${eventId}`);
      toast.success('Successfully registered for the event!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const [faculty, setFaculty] = useState([]);

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-maroon-950 via-maroon to-maroon-800 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gold/5 rounded-full blur-2xl"></div>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5"
              style={{ width: Math.random() * 6 + 2 + 'px', height: Math.random() * 6 + 2 + 'px', top: Math.random() * 100 + '%', left: Math.random() * 100 + '%' }}></div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center bg-gold/10 border border-gold/30 text-gold-300 px-4 py-2 rounded-full text-sm font-heading font-medium mb-6">
              <Star size={14} className="mr-2 text-gold" />
              Official Student Event Portal – CU
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-white leading-tight mb-6">
              BBA Apex<br />
              <span className="text-gold">Event</span> Management<br />Portal
            </h1>
            <p className="text-lg text-gray-300 font-body mb-8 leading-relaxed">
              <span className="text-gold font-semibold">Explore • Register • Participate • Achieve</span><br />
              Your gateway to academic events, industry sessions, competitions, and limitless growth.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-gold text-base py-3 px-8 flex items-center gap-2 shadow-xl">
                Register Now <ArrowRight size={18} />
              </Link>
              <Link to="/events" className="border-2 border-white/40 hover:border-gold text-white hover:text-gold font-semibold text-base py-3 px-8 rounded-lg transition-all duration-200 font-heading flex items-center gap-2">
                View Events <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          {/* Stats Card */}
          <div className="hidden md:block animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-gold font-heading font-bold text-lg mb-6 text-center">Portal Highlights</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { Icon: Calendar, val: stats.totalEvents,        label: 'Events Conducted',      color: 'text-gold' },
                  { Icon: Users,    val: stats.totalRegistrations,  label: 'Student Registrations', color: 'text-blue-300' },
                  { Icon: Briefcase,val: stats.industrySessions,    label: 'Industry Sessions',     color: 'text-green-300' },
                  { Icon: Trophy,   val: stats.competitions,        label: 'Competitions',          color: 'text-orange-300' },
                ].map(({ Icon, val, label, color }) => (
                  <div key={label} className="text-center">
                    <Icon size={28} className={`${color} mx-auto mb-2`} />
                    <div className={`text-3xl font-bold font-heading ${color}`}><AnimatedCounter end={val} /></div>
                    <p className="text-gray-300 text-xs font-body mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gold rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER ── */}
      <section className="bg-maroon py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: stats.totalEvents,       label: 'Events Conducted',      Icon: Calendar },
              { val: stats.totalRegistrations, label: 'Student Registrations', Icon: Users },
              { val: stats.industrySessions,   label: 'Industry Sessions',     Icon: Briefcase },
              { val: stats.competitions,       label: 'Competitions Held',     Icon: Trophy },
            ].map(({ val, label, Icon }) => (
              <div key={label} className="group">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                  <Icon size={24} className="text-gold" />
                </div>
                <div className="text-4xl font-bold font-heading text-white"><AnimatedCounter end={val} /></div>
                <p className="text-gold-300 text-sm font-body mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-maroon font-heading font-semibold text-sm uppercase tracking-widest">Don't Miss Out</span>
            <h2 className="section-title mt-2">Upcoming Events</h2>
            <p className="section-subtitle">Register early and secure your spot</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event._id} event={event} onRegister={handleRegister} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-heading text-lg">No upcoming events at the moment</p>
              <p className="text-sm mt-2">Check back soon!</p>
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/events" className="btn-primary inline-flex items-center gap-2 text-base py-3 px-8">
              View All Events <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-maroon font-heading font-semibold text-sm uppercase tracking-widest">About Us</span>
            <h2 className="section-title mt-2 mb-6">BBA Apex – Student Excellence Body</h2>
            <p className="text-gray-600 font-body leading-relaxed text-base mb-6">
              BBA Apex is the official student-driven academic engagement body of Chandigarh University focused on organizing workshops, seminars, competitions, and industry interaction sessions for holistic student development.
            </p>
            <p className="text-gray-600 font-body leading-relaxed text-base mb-8">
              We bridge the gap between classroom learning and real-world experience by facilitating interactions with industry leaders, organizing skill-building workshops, and creating competitive platforms for students to showcase their talents.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[['Workshops & Seminars', '🎓'], ['Industry Connect', '🏢'], ['Competitions', '🏆'], ['Skill Development', '⭐']].map(([item, emoji]) => (
                <div key={item} className="flex items-center gap-3 bg-maroon-50 rounded-lg px-4 py-3">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-maroon font-heading font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-maroon to-maroon-800 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="font-heading font-bold text-2xl mb-6 text-gold">Our Mission</h3>
              <div className="space-y-5">
                {[
                  { title: 'Academic Excellence', desc: 'Foster a culture of learning through workshops, seminars, and knowledge-sharing sessions.' },
                  { title: 'Industry Readiness', desc: 'Connect students with industry professionals for real-world exposure and career guidance.' },
                  { title: 'Holistic Growth', desc: 'Develop leadership, teamwork, and communication skills through diverse events and activities.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-heading font-semibold text-gold-300 text-sm">{title}</h4>
                      <p className="text-gray-300 text-sm font-body mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* ── FACULTY COORDINATORS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-maroon font-heading font-semibold text-sm uppercase tracking-widest">Our Team</span>
            <h2 className="section-title mt-2">Faculty Coordinators</h2>
            <p className="section-subtitle">Guided by experienced faculty mentors</p>
          </div>
          {faculty.length === 0 ? (
            <p className="text-center text-gray-400 font-body">No faculty coordinators added yet. Admins can add them via the Admin Panel.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {faculty.map((f) => (
                <div key={f._id || f.email} className="card p-8 text-center group hover:border-maroon border-2 border-transparent transition-all duration-300">
                  <div className="w-24 h-24 bg-gradient-to-br from-maroon to-maroon-800 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {f.avatar
                      ? <img src={f.avatar} alt={f.name} className="w-full h-full rounded-full object-cover" />
                      : <span className="text-3xl font-bold text-white font-heading">{f.name?.charAt(0)}</span>}
                  </div>
                  <h3 className="font-heading font-bold text-gray-900 text-lg">{f.name}</h3>
                  <p className="text-maroon font-semibold text-sm font-heading mt-1 capitalize">{f.designation || f.role}</p>
                  <p className="text-gray-500 text-xs font-body mt-1">{f.course || 'BBA Department'}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a href={`mailto:${f.email}`} className="flex items-center justify-center gap-2 text-gray-500 hover:text-maroon text-sm font-body transition-colors">
                      <Mail size={13} /> {f.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── LEADERBOARD PREVIEW ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-maroon font-heading font-semibold text-sm uppercase tracking-widest">Rankings</span>
            <h2 className="section-title mt-2">Top Participants</h2>
            <p className="section-subtitle">Based on participation points earned</p>
          </div>
          <div className="max-w-2xl mx-auto">
            {leaderboard.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-maroon to-maroon-800 p-5 flex items-center gap-3">
                  <Trophy className="text-gold" size={24} />
                  <h3 className="text-white font-heading font-bold text-lg">Leaderboard – Top 10</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {leaderboard.map((student, i) => (
                    <div key={student._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-heading text-sm flex-shrink-0
                        ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-maroon-100 text-maroon'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-maroon to-maroon-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm font-heading">{student.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                        <p className="text-gray-400 text-xs font-body">{student.uid} {student.course && `• ${student.course}`}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-full">
                        <Award size={13} className="text-gold-600" />
                        <span className="text-gold-700 font-bold text-sm font-heading">{student.totalPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">No leaderboard data yet.</div>
            )}
            <div className="text-center mt-8">
              <Link to="/leaderboard" className="btn-primary inline-flex items-center gap-2">
                Full Leaderboard <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 bg-gradient-to-r from-maroon to-maroon-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 font-body text-lg mb-8">Join BBA Apex and start earning points by participating in events, workshops, and competitions.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-gold text-base py-3 px-8 flex items-center gap-2">
              Create Account <ArrowRight size={18} />
            </Link>
            <Link to="/events" className="border-2 border-white/40 hover:border-white text-white font-semibold text-base py-3 px-8 rounded-lg transition-all duration-200 font-heading">
              Browse Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
