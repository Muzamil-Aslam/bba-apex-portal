import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Shield, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); setDropdownOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/certificates', label: 'Certificates' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  const navBg = isHome && !scrolled ? 'bg-transparent' : 'bg-maroon shadow-lg';
  const linkClass = 'text-white hover:text-gold transition-colors duration-200 font-medium font-heading text-sm tracking-wide';
  const activeClass = 'text-gold';

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-maroon font-bold text-lg font-heading">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-lg leading-tight font-heading">BBA Apex</p>
              <p className="text-gold-300 text-xs leading-tight">Chandigarh University</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={`${linkClass} ${location.pathname === to ? activeClass : ''} hover:text-gold`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200">
                  <div className="w-7 h-7 bg-gold rounded-full flex items-center justify-center">
                    <span className="text-maroon font-bold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-heading text-sm font-medium">{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 font-heading text-sm">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.uid} • {user.role}</p>
                    </div>
                    {isAdmin ? (
                      <Link to="/admin" className="flex items-center px-4 py-2 text-gray-700 hover:bg-maroon-50 hover:text-maroon transition-colors text-sm font-body">
                        <Shield size={14} className="mr-2" /> Admin Panel
                      </Link>
                    ) : (
                      <Link to="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-maroon-50 hover:text-maroon transition-colors text-sm font-body">
                        <LayoutDashboard size={14} className="mr-2" /> My Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm font-body">
                      <LogOut size={14} className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-gold font-heading text-sm font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-gold hover:bg-gold-600 text-maroon font-semibold text-sm px-5 py-2 rounded-lg transition-all duration-200 font-heading">Register</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-maroon border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={`block py-3 px-4 text-white hover:bg-white/10 rounded-lg font-heading text-sm transition-colors ${location.pathname === to ? 'text-gold bg-white/10' : ''}`}>
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 mt-3">
              {user ? (
                <>
                  <div className="px-4 py-2 text-gold-300 text-sm font-body">{user.name} ({user.uid})</div>
                  {isAdmin ? (
                    <Link to="/admin" className="block py-3 px-4 text-white hover:bg-white/10 rounded-lg font-heading text-sm">Admin Panel</Link>
                  ) : (
                    <Link to="/dashboard" className="block py-3 px-4 text-white hover:bg-white/10 rounded-lg font-heading text-sm">My Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left py-3 px-4 text-red-300 hover:bg-white/10 rounded-lg font-heading text-sm">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-3 px-4 text-white hover:bg-white/10 rounded-lg font-heading text-sm">Login</Link>
                  <Link to="/register" className="block py-3 px-4 bg-gold text-maroon rounded-lg font-heading text-sm font-semibold mt-2 text-center">Register Now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
