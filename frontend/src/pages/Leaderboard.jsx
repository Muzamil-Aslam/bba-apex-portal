import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, TrendingUp, Users } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/users/leaderboard?limit=50').then(({ data }) => {
      setLeaders(data.leaderboard);
      if (user) {
        const idx = data.leaderboard.findIndex(l => l._id === user.id);
        if (idx !== -1) setMyRank(idx + 1);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const rankStyle = (i) => {
    if (i === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (i === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (i === 2) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    return 'bg-maroon-100 text-maroon';
  };

  const rankEmoji = (i) => ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3">Leaderboard</h1>
          <p className="text-gray-300 font-body text-lg">Top participants ranked by points earned</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">
        {/* Points Guide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[['Workshop', '5 pts', '🎓'], ['Industry Session', '5 pts', '🏢'], ['Competition', '10 pts', '⚔️'], ['Winner Bonus', '20 pts', '🏆']].map(([label, pts, icon]) => (
            <div key={label} className="card p-4 text-center">
              <span className="text-2xl">{icon}</span>
              <p className="font-heading font-bold text-maroon text-lg mt-1">{pts}</p>
              <p className="text-gray-500 text-xs font-body mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* My Rank Banner */}
        {user && myRank && (
          <div className="bg-gradient-to-r from-maroon to-maroon-800 text-white rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-maroon font-bold text-lg font-heading">#{myRank}</span>
            </div>
            <div>
              <p className="font-heading font-bold text-lg">Your Current Rank</p>
              <p className="text-gray-300 text-sm font-body">Keep participating to climb higher!</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-gold font-bold text-2xl font-heading">{user.totalPoints || 0}</p>
              <p className="text-gray-300 text-xs font-body">total points</p>
            </div>
          </div>
        )}

        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div> : leaders.length > 0 ? (
          <>
            {/* Podium - Top 3 */}
            {topThree.length === 3 && (
              <div className="flex items-end justify-center gap-4 mb-10 py-6">
                {[topThree[1], topThree[0], topThree[2]].map((student, podiumIdx) => {
                  const actualRank = topThree.indexOf(student);
                  const heights = ['h-28', 'h-36', 'h-24'];
                  return (
                    <div key={student._id} className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-maroon to-maroon-800 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                        <span className="text-white font-bold text-lg">{student.name?.charAt(0)}</span>
                      </div>
                      <p className="font-heading font-bold text-gray-800 text-sm text-center w-24 truncate">{student.name?.split(' ')[0]}</p>
                      <p className="text-gold-700 font-bold text-sm font-heading">{student.totalPoints} pts</p>
                      <div className={`${heights[podiumIdx]} w-20 rounded-t-xl flex items-center justify-center text-white font-bold text-2xl shadow-md ${actualRank === 0 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' : actualRank === 1 ? 'bg-gradient-to-t from-gray-500 to-gray-300' : 'bg-gradient-to-t from-orange-600 to-orange-400'}`}>
                        {rankEmoji(actualRank)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full List */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-maroon to-maroon-800 px-6 py-4 flex items-center gap-3">
                <Trophy className="text-gold" size={22} />
                <h2 className="text-white font-heading font-bold text-lg">Full Rankings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {leaders.map((student, i) => (
                  <div key={student._id} className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${user && student._id === user.id ? 'bg-maroon-50' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-heading text-sm flex-shrink-0 ${rankStyle(i)}`}>
                      {i < 3 ? rankEmoji(i) : i + 1}
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-maroon to-maroon-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm font-heading">{student.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                        {user && student._id === user.id && <span className="badge bg-maroon text-white text-xs">You</span>}
                      </div>
                      <p className="text-gray-400 text-xs font-body">{student.uid}{student.course ? ` • ${student.course}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-2 rounded-full">
                      <Award size={13} className="text-gold-600" />
                      <span className="text-gold-700 font-bold font-heading">{student.totalPoints}</span>
                      <span className="text-gray-400 text-xs font-body">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-4 text-gray-200" />
            <h3 className="font-heading font-bold text-xl mb-2">No rankings yet</h3>
            <p className="font-body text-sm">Participate in events to earn points and appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
