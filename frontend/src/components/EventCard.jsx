import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Award, Timer } from 'lucide-react';
import { format } from 'date-fns';

const categoryColors = {
  'Academic': 'badge-blue', 'Workshop': 'badge-green', 'Competition': 'bg-orange-100 text-orange-700 badge',
  'Industry Session': 'bg-purple-100 text-purple-700 badge', 'Cultural': 'bg-pink-100 text-pink-700 badge',
  'Seminar': 'badge-maroon', 'Other': 'badge-gold'
};

const statusColors = {
  'upcoming': 'badge-green', 'ongoing': 'bg-blue-100 text-blue-700 badge',
  'completed': 'bg-gray-100 text-gray-600 badge', 'cancelled': 'bg-red-100 text-red-700 badge'
};

// Live countdown hook
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return { d, h, m };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 60000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

export default function EventCard({ event, onRegister, isRegistered }) {
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull           = event.currentParticipants >= event.maxParticipants;
  const spotsLeft        = event.maxParticipants - event.currentParticipants;
  const fillPct          = Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100));
  const countdown        = useCountdown(event.date);

  const barColor =
    fillPct >= 90 ? 'bg-red-500' :
    fillPct >= 70 ? 'bg-orange-400' :
    'bg-green-500';

  const countdownText = countdown
    ? countdown.d > 0
      ? `Starts in ${countdown.d}d ${countdown.h}h`
      : countdown.h > 0
      ? `Starts in ${countdown.h}h ${countdown.m}m`
      : `Starts in ${countdown.m}m`
    : null;

  return (
    <div className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      {/* Poster */}
      <div className="relative h-48 bg-gradient-to-br from-maroon to-maroon-800 overflow-hidden">
        {event.poster ? (
          <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white/80">
              <Award size={40} className="mx-auto mb-2 text-gold" />
              <p className="font-heading text-sm font-medium">BBA Apex Event</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className={`${categoryColors[event.category] || 'badge-gold'} text-xs px-2 py-1 rounded-full font-semibold font-heading`}>
            {event.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`${statusColors[event.status]} text-xs px-2 py-1 rounded-full font-semibold font-heading capitalize`}>
            {event.status}
          </span>
        </div>

        {/* Countdown chip */}
        {event.status === 'upcoming' && countdownText && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-heading font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Timer size={11} /> {countdownText}
          </div>
        )}

        <div className="absolute bottom-3 right-3 bg-gold text-maroon text-xs font-bold px-2 py-1 rounded-full font-heading">
          +{event.points} pts
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading font-bold text-gray-900 text-lg leading-tight mb-3 line-clamp-2 group-hover:text-maroon transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-500 text-sm font-body mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 font-body gap-2">
            <Calendar size={14} className="text-maroon flex-shrink-0" />
            <span>{format(new Date(event.date), 'dd MMM yyyy, h:mm a')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 font-body gap-2">
            <MapPin size={14} className="text-maroon flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 font-body gap-2">
            <Clock size={14} className="text-maroon flex-shrink-0" />
            <span>Deadline: {format(new Date(event.registrationDeadline), 'dd MMM yyyy')}</span>
          </div>

          {/* Capacity row + progress bar */}
          <div>
            <div className="flex items-center text-sm font-body gap-2 mb-1.5">
              <Users size={14} className="text-maroon flex-shrink-0" />
              <span className={fillPct >= 90 ? 'text-red-600 font-semibold' : fillPct >= 70 ? 'text-orange-500 font-medium' : 'text-gray-600'}>
                {isFull ? '🔴 Fully Booked' : `${spotsLeft} spots left`}
                <span className="text-gray-400 font-normal"> ({event.currentParticipants}/{event.maxParticipants})</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Link to={`/events/${event._id}`} className="flex-1 text-center btn-outline py-2 text-sm rounded-lg">
            Details
          </Link>
          {event.status !== 'completed' && event.status !== 'cancelled' && (
            isRegistered ? (
              <span className="flex-1 text-center bg-green-100 text-green-700 font-semibold py-2 text-sm rounded-lg font-heading flex items-center justify-center gap-1">
                ✓ Registered
              </span>
            ) : (
              <button
                onClick={() => onRegister && onRegister(event._id)}
                disabled={isDeadlinePassed || isFull}
                className={`flex-1 text-sm rounded-lg font-heading font-semibold py-2 transition-all duration-200 ${isDeadlinePassed || isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}
              >
                {isDeadlinePassed ? 'Closed' : isFull ? 'Full' : 'Register'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
