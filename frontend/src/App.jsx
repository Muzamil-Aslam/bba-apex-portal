import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import Certificates from './pages/Certificates';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminPanel from './pages/AdminPanel';
import Leaderboard from './pages/Leaderboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import QRScanner from './pages/QRScanner';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === 'student') return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/qr-scanner" element={<ProtectedRoute adminOnly><QRScanner /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
