import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CATEGORIES = ['All', 'Academic', 'Workshop', 'Industry Session', 'Competition', 'Cultural', 'Seminar', 'Other'];
const STATUSES = ['All', 'upcoming', 'ongoing', 'completed'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (search.trim()) params.append('search', search.trim());
      const { data } = await api.get(`/events?${params}`);
      setEvents(data.events);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, category, status, search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (user) {
      api.get('/registrations/my').then(({ data }) => {
        setMyRegistrations(data.registrations.map(r => r.event?._id));
      }).catch(() => {});
    }
  }, [user]);

  const handleRegister = async (eventId) => {
    if (!user) { toast.error('Please login to register'); navigate('/login'); return; }
    try {
      await api.post(`/registrations/event/${eventId}`);
      toast.success('Registered successfully!');
      setMyRegistrations(prev => [...prev, eventId]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const clearFilters = () => { setCategory('All'); setStatus('All'); setSearch(''); setPage(1); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3">Events</h1>
          <p className="text-gray-300 font-body text-lg">Discover and register for upcoming events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search events by name, description, tags..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon text-sm font-body"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 border-2 border-maroon text-maroon rounded-xl font-heading font-semibold text-sm hover:bg-maroon hover:text-white transition-all">
              <SlidersHorizontal size={16} /> Filters {(category !== 'All' || status !== 'All') && <span className="bg-maroon text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">!</span>}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-heading">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold font-heading transition-all ${category === cat ? 'bg-maroon text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-maroon-100 hover:text-maroon'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-heading">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold font-heading transition-all capitalize ${status === s ? 'bg-maroon text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-maroon-100 hover:text-maroon'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {(category !== 'All' || status !== 'All') && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-red-500 text-sm font-body hover:text-red-700 transition-colors">
                  <X size={14} /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 font-body text-sm"><span className="font-semibold text-gray-900">{total}</span> events found</p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading events..." /></div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event._id} event={event} onRegister={handleRegister} isRegistered={myRegistrations.includes(event._id)} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-heading disabled:opacity-40 hover:border-maroon hover:text-maroon transition-colors">
                  ← Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-heading font-semibold transition-all ${page === i + 1 ? 'bg-maroon text-white shadow' : 'border border-gray-200 hover:border-maroon hover:text-maroon'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-heading disabled:opacity-40 hover:border-maroon hover:text-maroon transition-colors">
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="font-heading font-bold text-xl text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-400 font-body mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
