import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-maroon text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
              <span className="text-maroon font-bold text-xl font-heading">A</span>
            </div>
            <div>
              <p className="font-bold text-xl font-heading leading-tight">BBA Apex</p>
              <p className="text-gold-300 text-xs">Chandigarh University</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm font-body leading-relaxed mb-5">
            The official student-driven academic engagement body of Chandigarh University, fostering holistic student development through events, workshops, and industry interactions.
          </p>
          <div className="flex items-center space-x-3">
            {[{ Icon: Facebook, label: 'Facebook' }, { Icon: Instagram, label: 'Instagram' }, { Icon: Linkedin, label: 'LinkedIn' }, { Icon: Twitter, label: 'Twitter' }, { Icon: Youtube, label: 'YouTube' }].map(({ Icon, label }) => (
              <a key={label} href="#" aria-label={label}
                className="w-9 h-9 bg-white/10 hover:bg-gold hover:text-maroon rounded-full flex items-center justify-center transition-all duration-200 text-gray-300">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-gold font-semibold text-base mb-5 font-heading uppercase tracking-wider">Quick Links</h3>
          <ul className="space-y-2.5">
            {[['/', 'Home'], ['/events', 'Events'], ['/gallery', 'Gallery'], ['/certificates', 'Certificates'], ['/leaderboard', 'Leaderboard'], ['/register', 'Register']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-gray-300 hover:text-gold transition-colors text-sm font-body flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full group-hover:scale-150 transition-transform"></span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Events */}
        <div>
          <h3 className="text-gold font-semibold text-base mb-5 font-heading uppercase tracking-wider">Event Categories</h3>
          <ul className="space-y-2.5">
            {['Academic Events', 'Industry Sessions', 'Competitions', 'Workshops', 'Seminars', 'Cultural Activities'].map((cat) => (
              <li key={cat}>
                <Link to={`/events?category=${encodeURIComponent(cat.split(' ')[0])}`}
                  className="text-gray-300 hover:text-gold transition-colors text-sm font-body flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full group-hover:scale-150 transition-transform"></span>
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-gold font-semibold text-base mb-5 font-heading uppercase tracking-wider">Contact Us</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin size={16} className="text-gold mt-1 flex-shrink-0" />
              <p className="text-gray-300 text-sm font-body leading-relaxed">BBA Department, Block 3<br />Chandigarh University<br />Mohali, Punjab - 140413</p>
            </div>
            <div className="flex items-center space-x-3">
              <Phone size={16} className="text-gold flex-shrink-0" />
              <a href="tel:+911234567890" className="text-gray-300 hover:text-gold text-sm font-body transition-colors">+91 123 456 7890</a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail size={16} className="text-gold flex-shrink-0" />
              <a href="mailto:bbapex@cumail.in" className="text-gray-300 hover:text-gold text-sm font-body transition-colors">bbapex@cumail.in</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-sm font-body text-center md:text-left">
            © {new Date().getFullYear()} BBA Apex – Chandigarh University. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs font-body">
            Designed with ❤️ for Student Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
