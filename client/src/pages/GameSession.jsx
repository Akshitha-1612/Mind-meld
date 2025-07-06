import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGameDetails, fetchGameConfig, startGameSession, resetGameSession } from '../store/slices/gameSlice'
import GameEngine from '../components/games/GameEngine'
import { ArrowLeft, Play, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const GameSession = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { currentGame, gameConfig, gameSession, loading } = useSelector((state) => state.game)
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (gameId) {
      dispatch(fetchGameDetails(gameId))
      dispatch(fetchGameConfig({ gameId, difficulty: selectedDifficulty }))
    }
    
    return () => {
      dispatch(resetGameSession())
    }
  }, [gameId, selectedDifficulty, dispatch])

  const handleStartGame = () => {
    if (!gameConfig) {
      toast.error('Game configuration not loaded')
      return
    }

    dispatch(startGameSession({
      gameId,
      difficulty: selectedDifficulty,
      totalTrials: gameConfig.trials || 20
    }))
    setGameStarted(true)
  }

  const handleGameComplete = (sessionData) => {
    setGameStarted(false)
    toast.success(`Game completed! Score: ${sessionData.score}`)
    
    // Navigate back to games page after a delay
    setTimeout(() => {
      navigate('/games')
    }, 3000)
  }

  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulty(difficulty)
    dispatch(fetchGameConfig({ gameId, difficulty }))
  }

  if (loading.gameDetails || loading.gameConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl">Loading game...</div>
        </div>
      </div>
    )
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-800 text-xl mb-4">Game not found</div>
          <button
            onClick={() => navigate('/games')}
            className="btn-primary"
          >
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  if (gameStarted && gameSession.isActive) {
    return (
      <GameEngine
        gameConfig={{
          ...gameConfig,
          gameId,
          name: currentGame.name,
          instructions: currentGame.instructions,
          domain: currentGame.domain,
          difficulty: selectedDifficulty,
          totalTrials: gameConfig.trials || 20
        }}
        onGameComplete={handleGameComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Games</span>
          </button>
        </div>

        {/* Game Info */}
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <div className="flex items-start space-x-6">
              <div className="text-6xl">{currentGame.icon}</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {currentGame.name}
                </h1>
                <p className="text-gray-600 mb-4">
                  {currentGame.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Domain: {currentGame.domain.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>Duration: ~{Math.floor(currentGame.estimatedDuration / 60)} minutes</span>
                  <span>•</span>
                  <span>Metrics: {currentGame.metrics.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Instructions
            </h2>
            <p className="text-gray-600 mb-4">
              {currentGame.instructions}
            </p>
            {currentGame.researchCitation && (
              <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                <strong>Research Citation:</strong> {currentGame.researchCitation}
              </div>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Select Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {currentGame.difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => handleDifficultyChange(difficulty)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${selectedDifficulty === difficulty
                      ? 'border-blue-500 bg-blue-500/20 text-gray-800'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-semibold capitalize mb-1">
                    {difficulty}
                  </div>
                  <div className="text-sm opacity-75">
                    {getDifficultyDescription(difficulty)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Game Configuration Preview */}
          {gameConfig && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Game Configuration
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {Object.entries(gameConfig).map(([key, value]) => {
                  if (key === 'gameId' || key === 'difficulty') return null
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </div>
                      <div className="text-gray-800 font-semibold">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Start Game Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={!gameConfig}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-xl px-12 py-4 flex items-center space-x-3 mx-auto rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="w-6 h-6" />
              <span>Start Game</span>
            </button>
            {!gameConfig && (
              <p className="text-gray-500 text-sm mt-2">
                Loading game configuration...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const getDifficultyDescription = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 'Relaxed pace, fewer trials'
    case 'medium':
      return 'Standard challenge level'
    case 'hard':
      return 'Fast pace, more complex'
    default:
      return ''
  }
}

export default GameSession