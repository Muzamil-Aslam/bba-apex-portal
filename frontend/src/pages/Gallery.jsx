import React, { useState, useEffect } from 'react';
import { X, Image, Play, Star, Search, Trash2 } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Gallery() {
  const [gallery, setGallery] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'faculty';

  useEffect(() => {
    api.get('/gallery').then(({ data }) => {
      setGallery(data.grouped || {});
      setAllItems(data.gallery || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/gallery/${id}`);
      setAllItems(prev => prev.filter(i => i._id !== id));
      if (lightbox?._id === id) setLightbox(null);
      toast.success('Media deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const groups = ['All', ...Object.keys(gallery)];
  const filtered = allItems.filter(item => {
    const matchGroup = activeGroup === 'All' || item.eventName === activeGroup;
    const matchType = filter === 'all' || item.mediaType === filter;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.eventName.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchType && matchSearch;
  });

  // Fallback demo items if no data
  const displayItems = filtered.length > 0 ? filtered : [
    { _id: '1', title: 'Entrepreneurship Summit', eventName: 'Entrepreneurship Summit 2024', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', isFeatured: true },
    { _id: '2', title: 'Business Plan Competition', eventName: 'Business Plan Competition', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600', isFeatured: false },
    { _id: '3', title: 'Digital Marketing Workshop', eventName: 'Digital Marketing Masterclass', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600', isFeatured: true },
    { _id: '4', title: 'Finance Workshop', eventName: 'Finance & Investment Workshop', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600', isFeatured: false },
    { _id: '5', title: 'HR Seminar', eventName: 'HR & Talent Management Seminar', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=600', isFeatured: false },
    { _id: '6', title: 'Award Ceremony', eventName: 'Annual Awards 2024', mediaType: 'image', fileUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600', isFeatured: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3">Event Gallery</h1>
          <p className="text-gray-300 font-body text-lg">Relive the moments from our events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search gallery..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon text-sm font-body" />
          </div>
          <div className="flex gap-2">
            {['all', 'image', 'video'].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-heading font-semibold capitalize transition-all ${filter === t ? 'bg-maroon text-white' : 'bg-gray-100 text-gray-600 hover:bg-maroon-100 hover:text-maroon'}`}>
                {t === 'all' ? '📸 All' : t === 'image' ? '🖼️ Photos' : '🎥 Videos'}
              </button>
            ))}
          </div>
        </div>

        {/* Group Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {groups.slice(0, 8).map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${activeGroup === g ? 'bg-maroon text-white shadow-md' : 'bg-white text-gray-600 hover:bg-maroon-50 hover:text-maroon border border-gray-200'}`}>
              {g}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading gallery..." /></div> : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {displayItems.map((item) => (
              <div key={item._id} className="break-inside-avoid group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setLightbox(item)}>
                {item.mediaType === 'video' ? (
                  <video
                    src={item.fileUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500 bg-black"
                    style={{ minHeight: '200px', maxHeight: '320px' }}
                    onMouseEnter={e => e.target.play()}
                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                ) : (
                  <img src={item.fileUrl || item.thumbnailUrl} alt={item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-heading font-semibold text-sm">{item.title}</p>
                    <p className="text-gray-300 text-xs font-body">{item.eventName}</p>
                  </div>
                </div>
                {item.isFeatured && (
                  <div className="absolute top-3 right-3"><Star size={14} className="text-yellow-400 fill-yellow-400" /></div>
                )}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/60">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, item._id, item.title)}
                    className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {displayItems.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <Image size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading font-bold text-xl mb-2">No gallery items found</h3>
            <p className="font-body text-sm">Images will appear here once events are held</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white hover:text-gray-300 transition-colors z-10" onClick={() => setLightbox(null)}>
            <X size={32} />
          </button>
          {isAdmin && (
            <button
              className="absolute top-5 left-5 bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1.5 text-xs font-heading font-semibold flex items-center gap-1.5 z-10 transition-colors"
              onClick={(e) => handleDelete(e, lightbox._id, lightbox.title)}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <div className="max-w-4xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            {lightbox.mediaType === 'video' ? (
              <video
                src={lightbox.fileUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl outline-none"
                style={{ maxWidth: '80vw' }}
              >
                <source src={lightbox.fileUrl} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={lightbox.fileUrl} alt={lightbox.title} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
            )}
            <div className="text-center mt-4">
              <p className="text-white font-heading font-bold text-lg">{lightbox.title}</p>
              <p className="text-gray-400 text-sm font-body mt-1">{lightbox.eventName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
