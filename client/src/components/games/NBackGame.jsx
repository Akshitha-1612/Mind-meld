import React, { useState, useEffect } from 'react'

const NBackGame = ({ config, trial, onResponse }) => {
  const [sequence, setSequence] = useState([])
  const [currentStimulus, setCurrentStimulus] = useState(null)
  const [showStimulus, setShowStimulus] = useState(false)

  useEffect(() => {
    // Generate sequence for N-Back
    const newSequence = []
    for (let i = 0; i < config.trials; i++) {
      if (i >= config.nLevel && Math.random() < 0.3) {
        // 30% chance of N-back match
        newSequence.push(newSequence[i - config.nLevel])
      } else {
        newSequence.push(Math.floor(Math.random() * 9)) // 0-8 positions
      }
    }
    setSequence(newSequence)
  }, [config])

  useEffect(() => {
    if (sequence.length > 0 && trial < sequence.length) {
      setCurrentStimulus(sequence[trial])
      setShowStimulus(true)
      
      const timer = setTimeout(() => {
        setShowStimulus(false)
      }, config.stimulusDuration)

      return () => clearTimeout(timer)
    }
  }, [trial, sequence, config.stimulusDuration])

  const handleResponse = (isMatch) => {
    const correctAnswer = trial >= config.nLevel && 
      sequence[trial] === sequence[trial - config.nLevel]
    
    onResponse({
      correct: isMatch === correctAnswer,
      data: {
        stimulus: currentStimulus,
        userResponse: isMatch,
        correctAnswer,
        nLevel: config.nLevel
      }
    })
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          {config.nLevel}-Back Task
        </h3>
        <p className="text-gray-600">
          Press "Match" if the current position matches the one from {config.nLevel} steps back
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-48 h-48 mx-auto mb-8">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((position) => (
          <div
            key={position}
            className={`
              w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center transition-all duration-200
              ${showStimulus && currentStimulus === position 
                ? 'bg-blue-500 border-blue-300 scale-110' 
                : 'bg-white'
              }
            `}
          >
            {showStimulus && currentStimulus === position && (
              <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => handleResponse(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 rounded-lg transition-colors disabled:opacity-50"
          disabled={showStimulus}
        >
          Match
        </button>
        <button
          onClick={() => handleResponse(false)}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors disabled:opacity-50"
          disabled={showStimulus}
        >
          No Match
        </button>
      </div>
    </div>
  )
}

export default NBackGame