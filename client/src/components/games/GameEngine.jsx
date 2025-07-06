import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { recordResponse, endGameSession } from '../../store/slices/gameSlice'
import { createSession } from '../../store/slices/performanceSlice'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Import individual game components
import NBackGame from './NBackGame'
import FlankerGame from './FlankerGame'
import SimpleReactionGame from './SimpleReactionGame'
import ChoiceReactionGame from './ChoiceReactionGame'
import RavensGame from './RavensGame'
import TowerHanoiGame from './TowerHanoiGame'

const GameEngine = ({ gameConfig, onGameComplete }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { gameSession } = useSelector((state) => state.game)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [gameState, setGameState] = useState('ready') // ready, playing, finished
  const [trialStartTime, setTrialStartTime] = useState(null)
  const [responses, setResponses] = useState([])

  const handleResponse = useCallback((response) => {
    if (gameState !== 'playing' || !trialStartTime) return

    const reactionTime = Date.now() - trialStartTime
    const responseData = {
      correct: response.correct,
      reactionTime,
      trialData: response.data || {}
    }

    dispatch(recordResponse(responseData))
    setResponses(prev => [...prev, responseData])

    // Move to next trial or end game
    if (currentTrial + 1 >= gameConfig.totalTrials) {
      endGame()
    } else {
      setCurrentTrial(prev => prev + 1)
      setTrialStartTime(Date.now())
    }
  }, [gameState, trialStartTime, currentTrial, gameConfig.totalTrials, dispatch])

  const startGame = () => {
    setGameState('playing')
    setCurrentTrial(0)
    setTrialStartTime(Date.now())
    setResponses([]) // Reset responses
  }

  const endGame = async () => {
    setGameState('finished')
    dispatch(endGameSession())

    // Calculate final metrics with proper scoring logic
    const correctResponses = responses.filter(r => r.correct).length
    const totalResponses = responses.length
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0
    
    // Calculate average reaction time only for correct responses
    const correctResponseTimes = responses.filter(r => r.correct).map(r => r.reactionTime)
    const avgReactionTime = correctResponseTimes.length > 0 
      ? correctResponseTimes.reduce((sum, rt) => sum + rt, 0) / correctResponseTimes.length 
      : 0

    // Improved scoring logic based on accuracy and reaction time
    let score = accuracy // Base score is accuracy percentage
    
    // Add reaction time bonus only if accuracy is good
    if (accuracy >= 50 && avgReactionTime > 0) {
      const reactionTimeBonus = Math.max(0, (2000 - avgReactionTime) / 2000) * 20
      score = Math.min(100, accuracy + reactionTimeBonus)
    }
    
    // Penalty for very low accuracy
    if (accuracy < 30) {
      score = accuracy * 0.5
    }

    // Create session record
    const sessionData = {
      gameType: gameConfig.gameId,
      domain: gameConfig.domain,
      difficulty: gameConfig.difficulty,
      duration: Math.floor((Date.now() - gameSession.startTime) / 1000),
      score: Math.round(score),
      accuracy: Math.round(accuracy),
      reactionTime: Math.round(avgReactionTime),
      metrics: {
        correctResponses,
        totalResponses,
        errors: totalResponses - correctResponses
      }
    }

    try {
      await dispatch(createSession(sessionData)).unwrap()
      toast.success('Session completed successfully!')
      
      // Navigate to game summary
      navigate('/game-summary', { 
        state: { sessionData },
        replace: true 
      })
    } catch (error) {
      toast.error('Failed to save session')
      // Still navigate to summary even if save failed
      navigate('/game-summary', { 
        state: { sessionData },
        replace: true 
      })
    }
  }

  // Handle game not implemented
  const isGameImplemented = (gameId) => {
    const implementedGames = ['n-back', 'flanker', 'simple-reaction', 'choice-reaction', 'ravens-matrices', 'tower-hanoi']
    return implementedGames.includes(gameId)
  }

  if (!isGameImplemented(gameConfig.gameId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Coming Soon!</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {gameConfig.name} is currently under development. We're working hard to bring you this exciting cognitive challenge!
          </p>
          <button
            onClick={() => navigate('/games')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {gameState === 'ready' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{gameConfig.name}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{gameConfig.instructions}</p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-xl px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <GameRenderer
            gameConfig={gameConfig}
            currentTrial={currentTrial}
            onResponse={handleResponse}
            trialStartTime={trialStartTime}
          />
        )}

        {gameState === 'finished' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Complete!</h2>
            <p className="text-gray-600 mb-8">Processing your results...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {/* Fixed Progress Bar - positioned below navbar */}
        {gameState === 'playing' && (
          <div className="fixed top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-40">
            <div className="text-gray-800 text-sm font-medium">
              Trial: {currentTrial + 1} / {gameConfig.totalTrials}
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentTrial + 1) / gameConfig.totalTrials) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Game-specific renderer component
const GameRenderer = ({ gameConfig, currentTrial, onResponse, trialStartTime }) => {
  switch (gameConfig.gameId) {
    case 'n-back':
      return <NBackGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    case 'flanker':
      return <FlankerGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    case 'simple-reaction':
      return <SimpleReactionGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    case 'choice-reaction':
      return <ChoiceReactionGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    case 'ravens-matrices':
      return <RavensGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    case 'tower-hanoi':
      return <TowerHanoiGame config={gameConfig} trial={currentTrial} onResponse={onResponse} />
    default:
      return <div className="text-gray-800 text-center">Game not implemented</div>
  }
}

export default GameEngine