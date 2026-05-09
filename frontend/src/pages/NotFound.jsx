import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold font-heading text-maroon/10 mb-4">404</div>
        <div className="w-24 h-24 bg-maroon rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold font-heading text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 font-body mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => window.history.back()} className="btn-outline flex items-center gap-2"><ArrowLeft size={16} /> Go Back</button>
          <Link to="/" className="btn-primary flex items-center gap-2"><Home size={16} /> Home</Link>
        </div>
      </div>
    </div>
  );
}
