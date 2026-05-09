import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function QRScanner() {
  const [regNumber, setRegNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!regNumber.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/registrations/scan-qr', { registrationNumber: regNumber.trim().toUpperCase() });
      setResult({ success: true, data: data });
      setHistory(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
      toast.success(data.message);
      setRegNumber('');
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Scan failed' });
      toast.error(err.response?.data?.message || 'Invalid QR code');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-header">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold font-heading mb-2">QR Attendance Scanner</h1>
          <p className="text-gray-300 font-body">Scan or type the registration number to mark attendance</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
        {/* Scanner Input */}
        <div className="space-y-6">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={40} className="text-maroon" />
              </div>
              <h2 className="font-heading font-bold text-xl text-gray-900">Scan QR Code</h2>
              <p className="text-gray-500 text-sm font-body mt-1">Use a USB barcode scanner or type the registration number manually</p>
            </div>
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-heading">Registration Number</label>
                <input
                  type="text" value={regNumber}
                  onChange={e => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX2024000001"
                  className="input-field text-center text-lg font-heading tracking-widest uppercase"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading || !regNumber.trim()} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Checking...</span> : '✓ Mark Attended'}
              </button>
            </form>

            {/* Scan Result */}
            {result && (
              <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {result.success ? <CheckCircle size={22} className="text-green-500 flex-shrink-0 mt-0.5" /> : <AlertCircle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className={`font-heading font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅ Attendance Marked!' : '❌ Failed'}
                  </p>
                  {result.success && result.data?.registration && (
                    <div className="mt-1 text-sm font-body text-green-700">
                      <p><strong>{result.data.registration.studentName}</strong> ({result.data.registration.uid})</p>
                    </div>
                  )}
                  {!result.success && <p className="text-red-600 text-sm font-body mt-1">{result.message}</p>}
                </div>
                <button onClick={() => setResult(null)} className="ml-auto text-gray-400 hover:text-gray-600"><RotateCcw size={14} /></button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-heading font-bold text-gray-900 mb-3 flex items-center gap-2"><QrCode size={16} className="text-maroon" /> How to Use</h3>
            <ol className="space-y-2 text-sm text-gray-600 font-body">
              {['Students show their QR code from the dashboard.', 'Scan with a barcode scanner or type the code.', 'Points are auto-awarded upon marking.', 'Each registration can only be marked once.'].map((s, i) => (
                <li key={i} className="flex gap-2"><span className="w-5 h-5 bg-maroon text-white rounded-full text-xs flex items-center justify-center font-heading flex-shrink-0">{i+1}</span>{s}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Scan History */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-maroon to-maroon-800 px-5 py-4">
            <h3 className="text-white font-heading font-bold">Today's Scan History ({history.length})</h3>
          </div>
          {history.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-sm text-gray-900">{h.registration?.studentName}</p>
                    <p className="text-xs text-gray-400 font-body">{h.registration?.uid} • {h.time}</p>
                  </div>
                  <span className="badge-green text-xs">Attended</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <QrCode size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-body text-sm">No scans yet — start scanning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
