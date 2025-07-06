import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Home, 
  RotateCcw,
  Star,
  Award
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const GameSummary = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Get session data from navigation state
  const sessionData = location.state?.sessionData || {
    gameType: 'Unknown Game',
    score: 0,
    accuracy: 0,
    reactionTime: 0,
    duration: 0,
    difficulty: 'medium'
  }

  useEffect(() => {
    // Show confetti for high scores
    if (sessionData.score >= 90) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [sessionData.score])

  const getPerformanceRating = (score) => {
    if (score >= 90) return { rating: 'Excellent', color: 'text-green-600', icon: '🌟' }
    if (score >= 80) return { rating: 'Great', color: 'text-blue-600', icon: '⭐' }
    if (score >= 70) return { rating: 'Good', color: 'text-yellow-600', icon: '👍' }
    if (score >= 60) return { rating: 'Fair', color: 'text-orange-600', icon: '👌' }
    return { rating: 'Keep Practicing', color: 'text-red-600', icon: '💪' }
  }

  const performance = getPerformanceRating(sessionData.score)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatGameName = (gameType) => {
    return gameType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Navbar and Sidebar - maintaining layout consistency */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 pt-16 min-h-screen lg:pl-64">
          <div className="w-full max-w-none mx-auto p-4 lg:p-8">
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-50">
                <div className="confetti-animation">🎉</div>
              </div>
            )}
            
            <div className="w-full max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Game Complete!
                </h1>
                <p className="text-gray-600 text-lg">
                  {formatGameName(sessionData.gameType)} • {sessionData.difficulty} difficulty
                </p>
              </div>

              {/* Performance Card */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-8 shadow-lg mb-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-2">{performance.icon}</div>
                  <div className={`text-2xl font-bold ${performance.color} mb-2`}>
                    {performance.rating}
                  </div>
                  <div className="text-5xl font-bold text-gray-800">
                    {Math.round(sessionData.score)}%
                  </div>
                  <div className="text-gray-600">Overall Score</div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.round(sessionData.accuracy)}%
                    </div>
                    <div className="text-gray-600 text-sm">Accuracy</div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">
                      {sessionData.reactionTime ? `${Math.round(sessionData.reactionTime)}ms` : 'N/A'}
                    </div>
                    <div className="text-gray-600 text-sm">Avg. Reaction</div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">
                      {formatTime(sessionData.duration)}
                    </div>
                    <div className="text-gray-600 text-sm">Duration</div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">
                      +{Math.floor(sessionData.score / 10) * 10 + 50}
                    </div>
                    <div className="text-gray-600 text-sm">XP Gained</div>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Star className="w-5 h-5 text-blue-600 mr-2" />
                    Performance Insights
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    {sessionData.score >= 90 && (
                      <p>🎯 Outstanding performance! You're in the top tier of players.</p>
                    )}
                    {sessionData.accuracy >= 95 && (
                      <p>🎯 Exceptional accuracy! Your precision is remarkable.</p>
                    )}
                    {sessionData.reactionTime && sessionData.reactionTime < 500 && (
                      <p>⚡ Lightning-fast reactions! Your processing speed is excellent.</p>
                    )}
                    {sessionData.score < 70 && (
                      <p>💪 Keep practicing! Consistency is key to improvement.</p>
                    )}
                    <p>📈 Your current level: {user?.level || 1} | Total XP: {user?.xp || 0}</p>
                  </div>
                </div>

                {/* Achievements */}
                {sessionData.score === 100 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <Award className="w-6 h-6 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-semibold text-yellow-800">Perfect Score Achievement!</div>
                        <div className="text-yellow-700 text-sm">You achieved a flawless performance. Bonus XP awarded!</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/games')}
                  className="flex-1 bg-white/80 hover:bg-white text-gray-800 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Play Again</span>
                </button>
              </div>

              {/* Tips */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  💡 Tip: Regular practice improves cognitive performance. Try to maintain your daily streak!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default GameSummary