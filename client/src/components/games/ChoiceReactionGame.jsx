import React, { useState, useEffect } from 'react'

const ChoiceReactionGame = ({ config, trial, onResponse }) => {
  const [stimulus, setStimulus] = useState(null)
  const [showStimulus, setShowStimulus] = useState(false)
  const [stimulusStartTime, setStimulusStartTime] = useState(null)

  useEffect(() => {
    const stimulusValue = Math.floor(Math.random() * config.choiceOptions)
    setStimulus(stimulusValue)
    setShowStimulus(true)
    setStimulusStartTime(Date.now())
  }, [trial, config])

  const handleResponse = (choice) => {
    if (!showStimulus || !stimulusStartTime) return
    
    const reactionTime = Date.now() - stimulusStartTime
    setShowStimulus(false)
    
    onResponse({
      correct: choice === stimulus,
      data: {
        stimulus,
        userResponse: choice,
        choiceOptions: config.choiceOptions,
        reactionTime
      }
    })
  }

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']
  const colorClasses = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Choice Reaction Time</h3>
        <p className="text-gray-600">
          Click the button that matches the stimulus color as quickly as possible
        </p>
      </div>

      <div className="h-32 flex items-center justify-center mb-8">
        {showStimulus && stimulus !== null && (
          <div className={`w-24 h-24 rounded-lg ${colorClasses[stimulus]} shadow-lg animate-pulse`} />
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
        {Array.from({ length: config.choiceOptions }, (_, i) => (
          <button
            key={i}
            onClick={() => handleResponse(i)}
            className={`w-16 h-16 rounded-lg ${colorClasses[i]} hover:scale-110 transition-transform shadow-md disabled:opacity-50`}
            disabled={!showStimulus}
          />
        ))}
      </div>
    </div>
  )
}

export default ChoiceReactionGame