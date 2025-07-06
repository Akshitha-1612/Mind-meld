import React, { useState, useEffect } from 'react'

const FlankerGame = ({ config, trial, onResponse }) => {
  const [stimulus, setStimulus] = useState(null)
  const [showStimulus, setShowStimulus] = useState(false)

  useEffect(() => {
    // Generate flanker stimulus
    const isCongruent = Math.random() < config.congruentRatio
    const targetDirection = Math.random() < 0.5 ? 'left' : 'right'
    const flankerDirection = isCongruent ? targetDirection : (targetDirection === 'left' ? 'right' : 'left')
    
    const newStimulus = {
      target: targetDirection,
      flankers: flankerDirection,
      congruent: isCongruent,
      display: isCongruent 
        ? (targetDirection === 'left' ? '<<<<<' : '>>>>>')
        : (targetDirection === 'left' ? '>><<>' : '<<><<')
    }
    
    setStimulus(newStimulus)
    setShowStimulus(true)

    const timer = setTimeout(() => {
      setShowStimulus(false)
    }, config.stimulusDuration)

    return () => clearTimeout(timer)
  }, [trial, config])

  const handleResponse = (direction) => {
    if (!stimulus) return
    
    onResponse({
      correct: direction === stimulus.target,
      data: {
        targetDirection: stimulus.target,
        userResponse: direction,
        congruent: stimulus.congruent,
        flankerEffect: !stimulus.congruent
      }
    })
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Flanker Task</h3>
        <p className="text-gray-600">
          Respond to the direction of the CENTER arrow, ignore the flankers
        </p>
      </div>

      <div className="h-32 flex items-center justify-center mb-8">
        {showStimulus && stimulus && (
          <div className="text-6xl font-mono text-gray-800 animate-pulse">
            {stimulus.display}
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-8">
        <button
          onClick={() => handleResponse('left')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 text-xl rounded-lg transition-colors disabled:opacity-50"
          disabled={showStimulus}
        >
          ← Left
        </button>
        <button
          onClick={() => handleResponse('right')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 text-xl rounded-lg transition-colors disabled:opacity-50"
          disabled={showStimulus}
        >
          Right →
        </button>
      </div>
    </div>
  )
}

export default FlankerGame