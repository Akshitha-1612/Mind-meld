import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaderboard } from '../store/slices/userSlice'
import { Trophy, Medal, Award, Crown, TrendingUp, Calendar } from 'lucide-react'

const Leaderboard = () => {
  const dispatch = useDispatch()
  const { leaderboard, loading } = useSelector((state) => state.user)
  const { user } = useSelector((state) => state.auth)
  const [timeframe, setTimeframe] = useState('weekly')

  useEffect(() => {
    dispatch(fetchLeaderboard({ timeframe, limit: 50 }))
  }, [dispatch, timeframe])

  // Helper functions moved inside component
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</div>
    }
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-yellow-600'
      case 2:
        return 'from-gray-400 to-gray-500'
      case 3:
        return 'from-amber-600 to-amber-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  if (loading.leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl">Loading leaderboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Trophy className="w-10 h-10 mr-3 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600 text-lg">
          See how you rank against other cognitive athletes
        </p>
      </div>

      {/* Timeframe Selection */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-800" />
            <h2 className="text-lg font-semibold text-gray-800">Time Period</h2>
          </div>
          
          <div className="flex space-x-2">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-200 capitalize
                  ${timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Top Performers
          </h2>
          <div className="flex justify-center items-end space-x-8">
            {/* 2nd Place */}
            <PodiumCard
              user={leaderboard[1]}
              rank={2}
              height="h-32"
              color="from-gray-400 to-gray-500"
            />
            
            {/* 1st Place */}
            <PodiumCard
              user={leaderboard[0]}
              rank={1}
              height="h-40"
              color="from-yellow-500 to-yellow-600"
            />
            
            {/* 3rd Place */}
            <PodiumCard
              user={leaderboard[2]}
              rank={3}
              height="h-24"
              color="from-amber-600 to-amber-700"
            />
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Full Rankings
          </h2>
          <div className="text-gray-500 text-sm">
            {leaderboard.length} participants
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((participant) => (
            <LeaderboardRow
              key={participant.userId}
              participant={participant}
              isCurrentUser={participant.userId === user?.id}
              getRankIcon={getRankIcon}
            />
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">
              No rankings available yet
            </div>
            <div className="text-gray-400 text-sm">
              Complete some games to appear on the leaderboard!
            </div>
          </div>
        )}
      </div>

      {/* Your Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Your Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              #{leaderboard.findIndex(p => p.userId === user?.id) + 1 || 'N/A'}
            </div>
            <div className="text-gray-500 text-sm">Current Rank</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {user?.stats?.averageScore?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-gray-500 text-sm">Average Score</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {user?.stats?.totalSessions || 0}
            </div>
            <div className="text-gray-500 text-sm">Total Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PodiumCard = ({ user, rank, height, color }) => (
  <div className="text-center">
    <div className="mb-4">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="text-white font-bold text-lg">
          {user.firstName?.[0]}{user.lastName?.[0]}
        </span>
      </div>
      <div className="text-gray-800 font-semibold">{user.firstName}</div>
      <div className="text-gray-500 text-sm">Level {user.level}</div>
      <div className="text-gray-800 font-bold text-lg">{user.averageScore.toFixed(1)}%</div>
    </div>
    
    <div className={`${height} w-24 bg-gradient-to-t ${color} rounded-t-lg flex items-start justify-center pt-2`}>
      <div className="text-white font-bold text-2xl">{rank}</div>
    </div>
  </div>
)

const LeaderboardRow = ({ participant, isCurrentUser, getRankIcon }) => (
  <div className={`
    flex items-center justify-between p-4 rounded-lg transition-all duration-200
    ${isCurrentUser 
      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30' 
      : 'bg-gray-50 hover:bg-gray-100'
    }
  `}>
    <div className="flex items-center space-x-4">
      {/* Rank */}
      <div className="flex items-center justify-center w-8">
        {getRankIcon(participant.rank)}
      </div>
      
      {/* User Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {participant.firstName?.[0]}{participant.lastName?.[0]}
          </span>
        </div>
        <div>
          <div className={`font-semibold ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
            {participant.firstName} {participant.lastName}
            {isCurrentUser && <span className="text-blue-600 ml-2">(You)</span>}
          </div>
          <div className="text-gray-500 text-sm">Level {participant.level}</div>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="flex items-center space-x-6 text-sm">
      <div className="text-center">
        <div className="text-gray-800 font-semibold">{participant.averageScore.toFixed(1)}%</div>
        <div className="text-gray-500">Avg Score</div>
      </div>
      
      <div className="text-center">
        <div className="text-gray-800 font-semibold">{participant.totalSessions}</div>
        <div className="text-gray-500">Sessions</div>
      </div>
      
      <div className="text-center">
        <div className="text-gray-800 font-semibold">{participant.bestScore}%</div>
        <div className="text-gray-500">Best</div>
      </div>
      
      <div className="text-center">
        <div className="text-gray-800 font-semibold">{Math.round(participant.totalXP)}</div>
        <div className="text-gray-500">XP</div>
      </div>
    </div>
  </div>
)

export default Leaderboard