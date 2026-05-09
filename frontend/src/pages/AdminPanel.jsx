import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Upload, Users, Calendar, Award, Image, BarChart3, CheckCircle, RefreshCw, Eye, UserPlus, Key, ShieldCheck, ShieldOff, GraduationCap, QrCode, Archive, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Academic', 'Workshop', 'Industry Session', 'Competition', 'Cultural', 'Seminar', 'Other'];
const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const emptyEvent = { title: '', description: '', category: 'Workshop', date: '', endDate: '', registrationDeadline: '', venue: '', maxParticipants: 100, organizer: '', speakerName: '', speakerDesignation: '', tags: '', status: 'upcoming' };

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashData, setDashData] = useState(null);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [posterFile, setPosterFile] = useState(null);
  const [certForm, setCertForm] = useState({ uid: '', studentName: '', eventId: '', certificateType: 'participation' });
  const [certFile, setCertFile] = useState(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', eventName: '', description: '', mediaType: 'image' });
  const [galleryFile, setGalleryFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [bulkCsvFile, setBulkCsvFile] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  // Staff management state
  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: '', uid: '', email: '', password: '', role: 'faculty', phone: '', designation: '' });
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(null); // holds staff user object
  const [newPassword, setNewPassword] = useState('');
  // Event QR code modal
  const [eventQrModal, setEventQrModal] = useState(null); // { title, qrCode, url }
  // Student search
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, eventsRes, studentsRes, staffRes, analyticsRes] = await Promise.allSettled([
        api.get('/dashboard/admin'),
        api.get('/events?limit=50'),
        api.get('/users?limit=30'),
        api.get('/users/staff'),
        api.get('/events/analytics'),
      ]);
      if (dash.status === 'fulfilled') setDashData(dash.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.events);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data.students);
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value.data.staff || []);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // Staff handlers
  const handleCreateStaff = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { data } = await api.post('/users/staff', staffForm);
      toast.success(data.message);
      setShowStaffModal(false);
      setStaffForm({ name: '', uid: '', email: '', password: '', role: 'faculty', phone: '', designation: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create account'); }
    finally { setSubmitting(false); }
  };

  const handleToggleStaffStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/users/${userId}/status`);
      toast.success(`Account ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.patch(`/users/staff/${resetPasswordModal._id}/password`, { newPassword });
      toast.success(`Password updated for ${resetPasswordModal.name}`);
      setResetPasswordModal(null); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reset password'); }
    finally { setSubmitting(false); }
  };

  // Archive event
  const handleArchiveEvent = async (id, isPublished) => {
    try {
      await api.patch(`/events/${id}/archive`);
      toast.success(isPublished ? 'Event archived (hidden from public)' : 'Event restored (visible to public)');
      fetchAll();
    } catch { toast.error('Failed to archive event'); }
  };

  // Bulk CSV certificate upload
  const handleBulkCsvUpload = async (e) => {
    e.preventDefault();
    if (!bulkCsvFile) { toast.error('Please select a CSV file'); return; }
    setBulkSubmitting(true);
    try {
      const text = await bulkCsvFile.text();
      const Papa = await import('papaparse');
      const { data } = Papa.default.parse(text, { header: true, skipEmptyLines: true });
      const entries = data.map(row => ({
        uid: (row.uid || row.UID || '').trim().toUpperCase(),
        studentName: (row.studentName || row.name || row.Name || '').trim(),
        eventId: (row.eventId || row.event_id || '').trim(),
        certificateType: (row.certificateType || row.type || 'participation').trim(),
        fileUrl: (row.fileUrl || row.url || '').trim(),
      })).filter(e => e.uid && e.studentName && e.eventId && e.fileUrl);
      if (entries.length === 0) { toast.error('No valid rows found. Check CSV format.'); setBulkSubmitting(false); return; }
      const { data: res } = await api.post('/certificates/bulk', { entries });
      toast.success(`Bulk upload: ${res.created || entries.length} certificates created!`);
      setBulkCsvFile(null);
      e.target.reset();
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk upload failed'); }
    finally { setBulkSubmitting(false); }
  };

  // Event CRUD
  const openCreate = () => { setEditingEvent(null); setEventForm(emptyEvent); setPosterFile(null); setShowEventModal(true); };
  const openEdit = (event) => { setEditingEvent(event); setEventForm({ ...event, date: event.date?.slice(0, 16) || '', registrationDeadline: event.registrationDeadline?.slice(0, 16) || '', endDate: event.endDate?.slice(0, 16) || '', tags: event.tags?.join(', ') || '' }); setShowEventModal(true); };

  const handleEventSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(eventForm).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (posterFile) fd.append('poster', posterFile);
      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated!');
      } else {
        await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created!');
      }
      setShowEventModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save event'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event? All registrations will also be deleted.')) return;
    try { await api.delete(`/events/${id}`); toast.success('Event deleted'); fetchAll(); }
    catch { toast.error('Failed to delete event'); }
  };

  // Certificate upload
  const handleCertUpload = async (e) => {
    e.preventDefault();
    if (!certFile) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(certForm).forEach(([k, v]) => fd.append(k, v));
      fd.append('certificate', certFile);
      await api.post('/certificates/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Certificate uploaded successfully!');
      setCertForm({ uid: '', studentName: '', eventId: '', certificateType: 'participation' }); setCertFile(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setSubmitting(false); }
  };

  // Gallery upload
  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    if (!galleryFile) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(galleryForm).forEach(([k, v]) => fd.append(k, v));
      fd.append('media', galleryFile);
      await api.post('/gallery/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Media uploaded!');
      setGalleryForm({ title: '', eventName: '', description: '', mediaType: 'image' }); setGalleryFile(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setSubmitting(false); }
  };

  // Download registrations
  const downloadRegistrations = async (eventId) => {
    try {
      const response = await api.get(`/registrations/event/${eventId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `registrations_${eventId}.xlsx`); document.body.appendChild(link); link.click(); link.remove();
    } catch { toast.error('Download failed'); }
  };

  // Generate event QR code (links to event registration page)
  const showEventQR = async (eventId, eventTitle) => {
    try {
      const { data } = await api.get(`/events/${eventId}/qrcode`);
      setEventQrModal({ title: data.title, qrCode: data.qrCode, url: data.url });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate QR code');
    }
  };

  // Download event QR as PNG
  const downloadEventQR = (qrCode, title) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link); link.click(); link.remove();
  };

  const viewRegistrations = async (eventId) => {
    setSelectedEventId(eventId);
    try {
      const { data } = await api.get(`/registrations/event/${eventId}`);
      setRegistrations(data.registrations);
    } catch { toast.error('Failed to load registrations'); }
  };

  const markAttended = async (regId) => {
    try {
      await api.patch(`/registrations/${regId}/attendance`, { status: 'attended' });
      toast.success('Marked as attended + points awarded!');
      if (selectedEventId) viewRegistrations(selectedEventId);
    } catch { toast.error('Failed to update attendance'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading admin panel..." /></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', Icon: TrendingUp },
    { id: 'events', label: 'Events', Icon: Calendar },
    { id: 'registrations', label: 'Registrations', Icon: Users },
    { id: 'certificates', label: 'Certificates', Icon: Award },
    { id: 'gallery', label: 'Gallery', Icon: Image },
    { id: 'students', label: 'Students', Icon: GraduationCap },
    { id: 'staff', label: 'Manage Staff', Icon: UserPlus },
  ];

  const CHART_COLORS = ['#800000', '#FFD700', '#b45309', '#1d4ed8', '#16a34a', '#9333ea', '#dc2626', '#0891b2'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-maroon-800 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading text-white">Admin Panel</h1>
            <p className="text-gray-300 font-body text-sm mt-1">BBA Apex Event Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/qr-scanner" className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-maroon px-4 py-2 rounded-lg text-sm font-heading font-semibold transition-colors">
              <QrCode size={15} /> QR Scanner
            </Link>
            <button onClick={fetchAll} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-heading transition-colors">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-2xl shadow-md p-2 mb-8 overflow-x-auto">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-semibold text-sm whitespace-nowrap transition-all ${activeTab === id ? 'bg-maroon text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-maroon'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && dashData && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Students', val: dashData.stats?.totalStudents, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Events', val: dashData.stats?.totalEvents, Icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Registrations', val: dashData.stats?.totalRegistrations, Icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Certificates', val: dashData.stats?.totalCertificates, Icon: Award, color: 'text-maroon', bg: 'bg-maroon-50' },
              ].map(({ label, val, Icon, color, bg }) => (
                <div key={label} className="card p-5">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon size={20} className={color} /></div>
                  <p className={`text-3xl font-bold font-heading ${color}`}>{val || 0}</p>
                  <p className="text-gray-500 text-xs font-body mt-1">{label}</p>
                </div>
              ))}
            </div>
            {/* Upcoming events quick view */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center gap-2"><Calendar size={18} className="text-maroon" /> Upcoming Events</h3>
                {dashData.upcomingEvents?.length > 0 ? dashData.upcomingEvents.map(ev => (
                  <div key={ev._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-heading font-semibold text-gray-900 text-sm">{ev.title}</p>
                      <p className="text-xs text-gray-400 font-body">{format(new Date(ev.date), 'dd MMM yyyy')} • {ev.venue}</p>
                    </div>
                    <span className="text-xs font-heading text-maroon bg-maroon-50 px-2 py-1 rounded-full">{ev.currentParticipants}/{ev.maxParticipants}</span>
                  </div>
                )) : <p className="text-gray-400 text-sm font-body">No upcoming events</p>}
              </div>
              <div className="card p-6">
                <h3 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center gap-2"><Award size={18} className="text-gold-600" /> Top Students</h3>
                {dashData.topStudents?.map((s, i) => (
                  <div key={s._id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                    <span className="w-6 h-6 bg-maroon-100 text-maroon rounded-full flex items-center justify-center text-xs font-bold font-heading">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400 font-body">{s.uid}</p>
                    </div>
                    <span className="font-bold text-gold-700 font-heading text-sm">{s.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl text-gray-900">Analytics Dashboard</h2>
              <span className="text-xs text-gray-400 font-body">Data updates on refresh</span>
            </div>
            {!analytics ? (
              <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading analytics..." /></div>
            ) : (
              <div className="space-y-6">
                {/* Registrations over time */}
                <div className="card p-6">
                  <h3 className="font-heading font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                    <TrendingUp size={17} className="text-maroon" /> Registrations Over Time
                  </h3>
                  {analytics.registrationsByMonth?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={analytics.registrationsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                        <Tooltip contentStyle={{ fontFamily: 'Open Sans', fontSize: 12, borderRadius: 8 }} />
                        <Line type="monotone" dataKey="count" stroke="#800000" strokeWidth={2.5} dot={{ fill: '#800000', r: 4 }} name="Registrations" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-sm font-body text-center py-8">No registration data yet</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Events by category */}
                  <div className="card p-6">
                    <h3 className="font-heading font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                      <BarChart3 size={17} className="text-maroon" /> Events by Category
                    </h3>
                    {analytics.eventsByCategory?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={analytics.eventsByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="_id" tick={{ fontSize: 10, fontFamily: 'Poppins' }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontFamily: 'Open Sans', fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
                            {analytics.eventsByCategory.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-gray-400 text-sm font-body text-center py-8">No events yet</p>}
                  </div>

                  {/* Event status breakdown */}
                  <div className="card p-6">
                    <h3 className="font-heading font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                      <CheckCircle size={17} className="text-maroon" /> Event Status Breakdown
                    </h3>
                    {analytics.eventsByStatus?.length > 0 ? (
                      <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="55%" height={200}>
                          <PieChart>
                            <Pie data={analytics.eventsByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${Math.round(percent * 100)}%`} labelLine={false} fontSize={11}>
                              {analytics.eventsByStatus.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontFamily: 'Open Sans', fontSize: 12, borderRadius: 8 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {analytics.eventsByStatus.map((s, i) => (
                            <div key={s._id} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                              <span className="text-xs font-body text-gray-600 capitalize">{s._id}: <strong>{s.count}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <p className="text-gray-400 text-sm font-body text-center py-8">No events yet</p>}
                  </div>
                </div>

                {/* Top events by registrations */}
                {analytics.topEvents?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-heading font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                      <Award size={17} className="text-gold-600" /> Top Events by Registrations
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.topEvents} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="title" tick={{ fontSize: 10, fontFamily: 'Poppins' }} width={140} />
                        <Tooltip contentStyle={{ fontFamily: 'Open Sans', fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="registrations" name="Registrations" fill="#800000" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* New students per month */}
                {analytics.studentsByMonth?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-heading font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                      <Users size={17} className="text-blue-600" /> New Student Sign-ups Per Month
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.studentsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11, fontFamily: 'Poppins' }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontFamily: 'Open Sans', fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="count" name="New Students" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl text-gray-900">Manage Events ({events.length})</h2>
              <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Create Event</button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Title', 'Category', 'Date', 'Participants', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-heading">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4"><p className="font-heading font-semibold text-gray-900 text-sm max-w-xs truncate">{event.title}</p></td>
                        <td className="px-5 py-4"><span className="badge badge-maroon text-xs">{event.category}</span></td>
                        <td className="px-5 py-4 text-sm text-gray-600 font-body whitespace-nowrap">{format(new Date(event.date), 'dd MMM yy')}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 font-body">{event.currentParticipants}/{event.maxParticipants}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <span className={`badge capitalize ${event.status === 'upcoming' ? 'badge-green' : event.status === 'completed' ? 'bg-gray-100 text-gray-600 badge' : 'bg-orange-100 text-orange-600 badge'}`}>{event.status}</span>
                            {!event.isPublished && <span className="badge bg-gray-200 text-gray-500 text-xs ml-1">Archived</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(event)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit size={14} /></button>
                            <button onClick={() => { setActiveTab('registrations'); viewRegistrations(event._id); }} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="View Registrations"><Eye size={14} /></button>
                            <button onClick={() => showEventQR(event._id, event.title)} className="p-2 text-maroon hover:bg-maroon-50 rounded-lg transition-colors" title="Generate Event QR Code"><QrCode size={14} /></button>
                            <button onClick={() => downloadRegistrations(event._id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Download Excel"><Download size={14} /></button>
                            <button onClick={() => handleArchiveEvent(event._id, event.isPublished)} className={`p-2 rounded-lg transition-colors ${event.isPublished ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={event.isPublished ? 'Archive (hide from public)' : 'Restore (show to public)'}><Archive size={14} /></button>
                            <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && <div className="text-center py-12 text-gray-400 font-body">No events yet. <button onClick={openCreate} className="text-maroon font-semibold">Create one!</button></div>}
              </div>
            </div>
          </div>
        )}

        {/* REGISTRATIONS TAB */}
        {activeTab === 'registrations' && (
          <div>
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">Manage Registrations</h2>
            <div className="card p-5 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Select Event</label>
              <div className="flex gap-3">
                <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); if (e.target.value) viewRegistrations(e.target.value); }}
                  className="flex-1 input-field">
                  <option value="">-- Select an event --</option>
                  {events.map(e => <option key={e._id} value={e._id}>{e.title} ({format(new Date(e.date), 'dd MMM')})</option>)}
                </select>
                {selectedEventId && <button onClick={() => downloadRegistrations(selectedEventId)} className="btn-primary flex items-center gap-2 whitespace-nowrap"><Download size={15} /> Export Excel</button>}
              </div>
            </div>
            {registrations.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 bg-maroon-50 border-b border-maroon-100 flex items-center justify-between">
                  <h3 className="font-heading font-bold text-maroon">{registrations.length} Registrations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Reg No.', 'Student', 'UID', 'Phone', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-heading">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.map(reg => (
                        <tr key={reg._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-500 font-body">{reg.registrationNumber}</td>
                          <td className="px-4 py-3"><p className="font-heading font-semibold text-gray-900 text-sm">{reg.studentName}</p><p className="text-xs text-gray-400">{reg.email}</p></td>
                          <td className="px-4 py-3 text-sm font-heading text-maroon">{reg.uid}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-body">{reg.phone || '—'}</td>
                          <td className="px-4 py-3"><span className={`badge capitalize ${reg.status === 'attended' ? 'badge-green' : reg.status === 'confirmed' ? 'badge-blue' : 'bg-yellow-100 text-yellow-700 badge'}`}>{reg.status}</span></td>
                          <td className="px-4 py-3">
                            {reg.status !== 'attended' && (
                              <button onClick={() => markAttended(reg._id)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full font-heading transition-colors">
                                ✓ Mark Attended
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="max-w-2xl">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">Certificates</h2>

            {/* Bulk CSV Upload */}
            <div className="card p-6 mb-6 border-2 border-dashed border-maroon-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet size={18} className="text-maroon" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Bulk Upload via CSV</h3>
                  <p className="text-gray-400 text-xs font-body">Upload multiple certificates at once</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500 font-body">
                <p className="font-semibold text-gray-700 mb-1">📋 Required CSV columns:</p>
                <p className="font-mono text-xs text-blue-600">uid, studentName, eventId, certificateType, fileUrl</p>
                <p className="mt-1 text-gray-400">certificateType: participation / winner / runner-up / merit</p>
              </div>
              <form onSubmit={handleBulkCsvUpload} className="flex items-center gap-3">
                <input type="file" accept=".csv" onChange={e => setBulkCsvFile(e.target.files[0])}
                  className="flex-1 input-field file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-maroon-50 file:text-maroon hover:file:bg-maroon-100 text-sm" />
                <button type="submit" disabled={bulkSubmitting || !bulkCsvFile} className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-60">
                  {bulkSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Uploading...</> : <><Upload size={14} /> Bulk Upload</>}
                </button>
              </form>
            </div>

            <h3 className="font-heading font-bold text-gray-800 mb-4">Upload Single Certificate</h3>
            <div className="card p-8">
              <form onSubmit={handleCertUpload} className="space-y-5">
                {[['uid', 'Student UID', 'text', 'e.g. 21BBA1001'], ['studentName', 'Student Full Name', 'text', 'Full name'], ['eventId', 'Event', 'select', '']].map(([field, label, type]) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">{label} <span className="text-red-500">*</span></label>
                    {type === 'select' ? (
                      <select value={certForm[field]} onChange={e => setCertForm(p => ({ ...p, [field]: e.target.value }))} className="input-field" required>
                        <option value="">-- Select Event --</option>
                        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={certForm[field]} onChange={e => setCertForm(p => ({ ...p, [field]: e.target.value }))} placeholder={[,,'e.g. 21BBA1001', 'Full name'][['uid','studentName'].indexOf(field)+2] || ''} className="input-field" required />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Certificate Type</label>
                  <select value={certForm.certificateType} onChange={e => setCertForm(p => ({ ...p, certificateType: e.target.value }))} className="input-field">
                    {['participation', 'winner', 'runner-up', 'merit'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Certificate File (PDF/Image) <span className="text-red-500">*</span></label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertFile(e.target.files[0])} className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-maroon-50 file:text-maroon hover:file:bg-maroon-100" required />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Uploading...</> : <><Upload size={16} /> Upload Certificate</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="max-w-2xl">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">Upload Gallery Media</h2>
            <div className="card p-8">
              <form onSubmit={handleGalleryUpload} className="space-y-5">
                {[['title', 'Photo/Video Title', 'text'], ['eventName', 'Event Name', 'text'], ['description', 'Description (optional)', 'text']].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">{label}</label>
                    <input type="text" value={galleryForm[field]} onChange={e => setGalleryForm(p => ({ ...p, [field]: e.target.value }))} className="input-field" required={field !== 'description'} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Media Type</label>
                  <select value={galleryForm.mediaType} onChange={e => setGalleryForm(p => ({ ...p, mediaType: e.target.value }))} className="input-field">
                    <option value="image">📷 Image</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">File <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*,video/*" onChange={e => setGalleryFile(e.target.files[0])} className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-maroon-50 file:text-maroon hover:file:bg-maroon-100" required />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Uploading...</> : <><Upload size={16} /> Upload Media</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (() => {
          const filtered = students.filter(s => {
            const q = studentSearch.toLowerCase();
            return !q || s.name?.toLowerCase().includes(q) || s.uid?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.course?.toLowerCase().includes(q);
          });
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-heading font-bold text-xl text-gray-900">
                  All Students <span className="text-gray-400 font-normal text-base">({filtered.length}{studentSearch ? ` of ${students.length}` : ''})</span>
                </h2>
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search by name, UID, email, course…"
                    className="input-field pl-10 py-2 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"/>
                  </svg>
                  {studentSearch && (
                    <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Name', 'UID', 'Email', 'Course', 'Semester', 'Points', 'Joined'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-heading">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map(s => (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-maroon rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{s.name?.charAt(0)}</span>
                              </div>
                              <p className="font-heading font-semibold text-gray-900 text-sm">{s.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-heading text-maroon">{s.uid}</td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-body">{s.email}</td>
                          <td className="px-5 py-4 text-sm text-gray-600 font-body">{s.course || '—'}</td>
                          <td className="px-5 py-4 text-sm text-gray-600 font-body">{s.semester || '—'}</td>
                          <td className="px-5 py-4"><span className="font-bold text-gold-700 font-heading">{s.totalPoints}</span></td>
                          <td className="px-5 py-4 text-xs text-gray-400 font-body">{format(new Date(s.createdAt), 'dd MMM yy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400 font-body">
                      {studentSearch ? `No students match "${studentSearch}"` : 'No students registered yet.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── STAFF MANAGEMENT TAB ── */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading font-bold text-xl text-gray-900">Manage Faculty & Staff</h2>
                <p className="text-gray-500 text-sm font-body mt-1">Create and manage faculty/admin accounts with login credentials</p>
              </div>
              <button onClick={() => setShowStaffModal(true)} className="btn-primary flex items-center gap-2">
                <UserPlus size={16} /> Add Faculty / Admin
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">ℹ</span>
              </div>
              <div>
                <p className="text-blue-800 font-heading font-semibold text-sm">How Staff Login Works</p>
                <p className="text-blue-700 text-xs font-body mt-1">Staff members use the same <strong>/login</strong> page with the email and password you set here. Faculty can create events, manage registrations, upload certificates. Admins have full access including staff management.</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-maroon to-maroon-800 px-6 py-4 flex items-center gap-3">
                <Users size={20} className="text-gold" />
                <h3 className="text-white font-heading font-bold">Staff Accounts ({staff.length})</h3>
              </div>
              {staff.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Name & Designation', 'UID', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-heading">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staff.map(member => (
                        <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-maroon to-maroon-800 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm font-heading">{member.name?.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-heading font-semibold text-gray-900 text-sm">{member.name}</p>
                                <p className="text-gray-400 text-xs font-body">{member.course || 'No designation set'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-heading text-maroon font-semibold">{member.uid}</td>
                          <td className="px-5 py-4 text-sm text-gray-600 font-body">{member.email}</td>
                          <td className="px-5 py-4">
                            <span className={`badge capitalize font-heading ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'badge-blue'}`}>
                              {member.role === 'admin' ? '👑 Admin' : '🎓 Faculty'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`badge ${member.isActive ? 'badge-green' : 'bg-red-100 text-red-700 badge'}`}>
                              {member.isActive ? '● Active' : '● Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setResetPasswordModal(member); setNewPassword(''); }}
                                className="flex items-center gap-1.5 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-heading transition-colors"
                                title="Reset Password">
                                <Key size={12} /> Password
                              </button>
                              <button onClick={() => handleToggleStaffStatus(member._id, member.isActive)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-heading transition-colors ${member.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                                title={member.isActive ? 'Deactivate' : 'Activate'}>
                                {member.isActive ? <><ShieldOff size={12} /> Deactivate</> : <><ShieldCheck size={12} /> Activate</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 text-gray-200" />
                  <h3 className="font-heading font-bold text-lg mb-2">No staff accounts yet</h3>
                  <p className="font-body text-sm mb-5">Add faculty coordinators who can manage events</p>
                  <button onClick={() => setShowStaffModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
                    <UserPlus size={16} /> Add First Faculty Member
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ADD STAFF MODAL ── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowStaffModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-maroon to-maroon-800 px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                  <UserPlus size={18} className="text-maroon" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-lg">Add Faculty / Admin</h3>
                  <p className="text-gray-300 text-xs font-body">Create login credentials for staff</p>
                </div>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-white/60 hover:text-white text-2xl font-light transition-colors">×</button>
            </div>
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dr. Rajesh Kumar" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Staff UID <span className="text-red-500">*</span></label>
                  <input type="text" value={staffForm.uid} onChange={e => setStaffForm(p => ({ ...p, uid: e.target.value.toUpperCase() }))} placeholder="e.g. FAC001" className="input-field uppercase" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Role <span className="text-red-500">*</span></label>
                  <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))} className="input-field">
                    <option value="faculty">🎓 Faculty</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} placeholder="e.g. rajesh.k@cumail.in" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Phone</label>
                  <input type="tel" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit number" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Designation</label>
                  <input type="text" value={staffForm.designation} onChange={e => setStaffForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Asst. Professor" className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Login Password <span className="text-red-500">*</span></label>
                  <input type="text" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} placeholder="Set a strong password (min 6 chars)" className="input-field" required minLength={6} />
                  <p className="text-xs text-gray-400 font-body mt-1">⚠️ Share this password privately with the staff member. They can change it after login.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 font-body">
                <p className="font-semibold text-gray-700 mb-1">📋 Login credentials will be:</p>
                <p>Email: <span className="font-mono text-maroon">{staffForm.email || 'fill email above'}</span></p>
                <p>Password: <span className="font-mono text-maroon">{staffForm.password ? '•'.repeat(staffForm.password.length) : 'fill password above'}</span></p>
                <p className="mt-1">Login URL: <span className="font-mono text-blue-600">http://localhost:3000/login</span></p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 btn-outline py-3">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Creating...</> : <><UserPlus size={16} /> Create Account</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setResetPasswordModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-5 rounded-t-2xl flex items-center gap-3">
              <Key size={20} className="text-white" />
              <div>
                <h3 className="font-heading font-bold text-white text-lg">Reset Password</h3>
                <p className="text-yellow-100 text-xs font-body">{resetPasswordModal.name} ({resetPasswordModal.email})</p>
              </div>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">New Password <span className="text-red-500">*</span></label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" className="input-field" required minLength={6} autoFocus />
                <p className="text-xs text-gray-400 font-body mt-1.5">Share this new password privately with <strong>{resetPasswordModal.name}</strong>.</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetPasswordModal(null)} className="flex-1 btn-outline py-3">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg font-heading transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Saving...</> : <><Key size={16} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Create/Edit Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-heading font-bold text-xl text-gray-900">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
            </div>
            <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Event Title *</label>
                  <input type="text" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} className="input-field" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Description *</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} className="input-field min-h-24 resize-none" required />
                </div>
                {[['category', 'Category', 'select'], ['status', 'Status', 'select'], ['date', 'Event Date & Time', 'datetime-local'], ['registrationDeadline', 'Registration Deadline', 'datetime-local'], ['venue', 'Venue', 'text'], ['maxParticipants', 'Max Participants', 'number'], ['organizer', 'Organizer', 'text'], ['speakerName', 'Speaker Name', 'text'], ['tags', 'Tags (comma-separated)', 'text']].map(([field, label, type]) => (
                  <div key={field} className={field === 'description' || field === 'tags' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">{label}</label>
                    {type === 'select' ? (
                      <select value={eventForm[field]} onChange={e => setEventForm(p => ({ ...p, [field]: e.target.value }))} className="input-field">
                        {(field === 'category' ? CATEGORIES : STATUSES).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={eventForm[field]} onChange={e => setEventForm(p => ({ ...p, [field]: e.target.value }))} className="input-field" required={['date', 'registrationDeadline', 'venue'].includes(field)} min={field === 'maxParticipants' ? 1 : undefined} />
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-heading">Event Poster (optional)</label>
                  <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files[0])} className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-maroon-50 file:text-maroon hover:file:bg-maroon-100" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 btn-outline py-3">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3 disabled:opacity-60">
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Event QR Code Modal ───────────────────────────────────────── */}
      {eventQrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEventQrModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-maroon rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={24} className="text-gold" />
            </div>
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-1">{eventQrModal.title}</h3>
            <p className="text-gray-400 text-sm font-body mb-4">Students can scan this to open the event registration page</p>
            <img
              src={eventQrModal.qrCode}
              alt="Event QR Code"
              className="mx-auto w-52 h-52 rounded-xl border-2 border-maroon-100"
            />
            <p className="text-xs text-gray-400 font-body mt-3 break-all px-2">{eventQrModal.url}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => downloadEventQR(eventQrModal.qrCode, eventQrModal.title)}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
              >
                <Download size={15} /> Download PNG
              </button>
              <button onClick={() => setEventQrModal(null)} className="flex-1 btn-outline py-2.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
