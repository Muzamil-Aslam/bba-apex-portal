import React, { useState } from 'react';
import { Search, Download, Award, FileText, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Certificates() {
  const [uid, setUid] = useState('');
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!uid.trim()) { toast.error('Please enter a UID'); return; }
    setLoading(true); setError(''); setSearched(false);
    try {
      const { data } = await api.get(`/certificates/uid/${uid.trim().toUpperCase()}`);
      setCerts(data.certificates);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch certificates');
    } finally { setLoading(false); }
  };

  const typeColors = { participation: 'badge-green', winner: 'bg-yellow-100 text-yellow-700 badge', 'runner-up': 'bg-orange-100 text-orange-700 badge', merit: 'badge-blue' };
  const typeIcons = { participation: '📜', winner: '🥇', 'runner-up': '🥈', merit: '⭐' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3">Certificates</h1>
          <p className="text-gray-300 font-body text-lg">Download your participation & achievement certificates</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">
        {/* Search Box */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-maroon" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-gray-900">Find Your Certificates</h2>
            <p className="text-gray-500 font-body mt-2">Enter your University UID to view and download certificates</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={uid} onChange={e => setUid(e.target.value.toUpperCase())} placeholder="Enter UID (e.g. 21BBA1001)"
                className="input-field pl-12 uppercase font-heading tracking-wide" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-8 disabled:opacity-60">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span> : 'Search'}
            </button>
          </form>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mt-4 text-sm font-body">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Results */}
        {loading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Searching certificates..." /></div>}
        {searched && !loading && (
          certs.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle size={20} className="text-green-500" />
                <p className="font-heading font-semibold text-gray-800 text-lg">{certs.length} certificate{certs.length > 1 ? 's' : ''} found for UID: <span className="text-maroon">{uid}</span></p>
              </div>
              <div className="space-y-4">
                {certs.map((cert) => (
                  <div key={cert._id} className="card p-6 flex items-center gap-5 hover:border-maroon border-2 border-transparent transition-all duration-300">
                    <div className="w-14 h-14 bg-gradient-to-br from-maroon to-maroon-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-2xl">{typeIcons[cert.certificateType] || '📜'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-bold text-gray-900 text-base">{cert.event?.title || 'Event Certificate'}</h3>
                        <span className={`${typeColors[cert.certificateType]} capitalize flex-shrink-0`}>{cert.certificateType}</span>
                      </div>
                      <p className="text-gray-500 text-sm font-body mt-1">{cert.studentName} • {cert.uid}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-body">
                        <span>🔖 {cert.certificateNumber}</span>
                        {cert.event?.date && <span>📅 {format(new Date(cert.event.date), 'dd MMM yyyy')}</span>}
                        <span>Issued: {format(new Date(cert.issuedAt || cert.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" download
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-5">
                        <Download size={15} /> Download
                      </a>
                      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(cert.fileUrl)}&title=${encodeURIComponent(`${cert.certificateType === 'winner' ? 'Won' : 'Earned'} a certificate at ${cert.event?.title || 'BBA Apex Event'}`)}&summary=${encodeURIComponent(`I ${cert.certificateType === 'winner' ? 'won' : 'participated in'} ${cert.event?.title || 'a BBA Apex event'} at Chandigarh University. Certificate No: ${cert.certificateNumber}`)}&source=BBA+Apex`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm py-2 px-5 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg font-heading font-semibold transition-colors justify-center">
                        <ExternalLink size={13} /> LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <FileText size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-xl text-gray-600 mb-2">No certificates found</h3>
              <p className="text-gray-400 font-body text-sm">No certificates found for UID: <strong>{uid}</strong></p>
              <p className="text-gray-400 font-body text-sm mt-1">Certificates are uploaded by faculty after event completion.</p>
            </div>
          )
        )}

        {/* Info Box */}
        <div className="bg-maroon-50 border border-maroon-100 rounded-2xl p-6 mt-8">
          <h3 className="font-heading font-bold text-maroon mb-3 flex items-center gap-2"><Award size={18} /> How It Works</h3>
          <ol className="space-y-2 text-sm text-gray-600 font-body">
            {['Register and attend events to earn certificates.', 'Faculty coordinators upload certificates after event completion.', 'Enter your UID above to find and download your certificates instantly.', 'Winner certificates include special recognition badges.'].map((step, i) => (
              <li key={i} className="flex items-start gap-3"><span className="w-5 h-5 bg-maroon text-white rounded-full text-xs flex items-center justify-center font-heading font-bold flex-shrink-0 mt-0.5">{i + 1}</span>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
