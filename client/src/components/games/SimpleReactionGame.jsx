import React, { useState, useEffect } from 'react'

const SimpleReactionGame = ({ config, trial, onResponse }) => {
  const [showStimulus, setShowStimulus] = useState(false)
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [stimulusStartTime, setStimulusStartTime] = useState(null)
  const [gamePhase, setGamePhase] = useState('waiting') // waiting, ready, stimulus, responded

  useEffect(() => {
    setGamePhase('waiting')
    const delay = config.minInterval + Math.random() * (config.maxInterval - config.minInterval)
    
    const timer = setTimeout(() => {
      setShowStimulus(true)
      setWaitingForResponse(true)
      setStimulusStartTime(Date.now())
      setGamePhase('stimulus')
    }, delay)

    return () => clearTimeout(timer)
  }, [trial, config])

  const handleResponse = () => {
    if (!waitingForResponse || !stimulusStartTime || gamePhase !== 'stimulus') return
    
    const reactionTime = Date.now() - stimulusStartTime
    setWaitingForResponse(false)
    setShowStimulus(false)
    setGamePhase('responded')
    
    // Calculate score based on reaction time
    let score = 100
    if (reactionTime > 1000) score = 60
    else if (reactionTime > 800) score = 70
    else if (reactionTime > 600) score = 80
    else if (reactionTime > 400) score = 90
    else score = 100
    
    onResponse({
      correct: true, // Always correct for simple RT
      data: {
        reactionTime,
        stimulusType: 'visual',
        score
      }
    })
  }

  const getReactionFeedback = () => {
    if (!stimulusStartTime || gamePhase !== 'responded') return ''
    const rt = Date.now() - stimulusStartTime
    if (rt < 300) return '⚡ Lightning Fast!'
    if (rt < 500) return '🚀 Very Quick!'
    if (rt < 700) return '👍 Good!'
    if (rt < 1000) return '👌 Not bad!'
    return '🐌 Try to be faster!'
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Simple Reaction Time</h3>
        <p className="text-gray-600">
          Click as quickly as possible when you see the red circle
        </p>
      </div>

      <div className="h-64 flex items-center justify-center mb-8">
        {gamePhase === 'waiting' && (
          <div className="text-gray-500 text-xl">
            Wait for the red circle...
          </div>
        )}
        
        {gamePhase === 'stimulus' && showStimulus && (
          <div 
            className="w-32 h-32 bg-red-500 rounded-full cursor-pointer animate-pulse hover:bg-red-600 transition-colors shadow-lg"
            onClick={handleResponse}
          />
        )}
        
        {gamePhase === 'responded' && (
          <div className="text-center">
            <div className="text-2xl text-green-600 mb-2">
              {getReactionFeedback()}
            </div>
            <div className="text-gray-600">
              Reaction Time: {stimulusStartTime ? Date.now() - stimulusStartTime : 0}ms
            </div>
          </div>
        )}
      </div>

      {gamePhase === 'waiting' && (
        <div className="text-gray-500">
          Get ready... the circle will appear soon!
        </div>
      )}
    </div>
  )
}

export default SimpleReactionGame