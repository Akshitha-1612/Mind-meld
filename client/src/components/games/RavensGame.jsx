import React, { useState, useEffect } from 'react'

const RavensGame = ({ config, trial, onResponse }) => {
  const [problem, setProblem] = useState(null)

  useEffect(() => {
    // Generate a simple pattern problem
    const patterns = [
      { matrix: ['●', '○', '●', '○', '●', '○', '●', '○'], answer: 0, options: ['●', '○', '◆', '◇'] },
      { matrix: ['▲', '▲▲', '▲▲▲', '▲▲▲▲', '▲▲▲▲▲', '▲▲▲▲▲▲', '▲▲▲▲▲▲▲'], answer: 1, options: ['▲▲▲▲▲▲▲▲', '▲▲▲▲▲▲▲▲▲', '▲▲▲▲▲▲', '▲▲▲▲▲'] },
      { matrix: ['■', '□', '■', '□', '■', '□', '■'], answer: 0, options: ['□', '■', '◆', '○'] }
    ]
    
    setProblem(patterns[trial % patterns.length])
  }, [trial])

  const handleResponse = (choice) => {
    if (!problem) return
    
    onResponse({
      correct: choice === problem.answer,
      data: {
        problemType: 'pattern',
        userResponse: choice,
        correctAnswer: problem.answer
      }
    })
  }

  if (!problem) return <div className="text-gray-800">Loading...</div>

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Pattern Logic</h3>
        <p className="text-gray-600">
          Study the pattern and select what comes next
        </p>
      </div>

      <div className="bg-white/80 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {problem.matrix.map((item, index) => (
            <div key={index} className="bg-gray-100 rounded p-4 text-2xl text-center">
              {item}
            </div>
          ))}
          <div className="bg-yellow-100 rounded p-4 text-2xl text-center border-2 border-yellow-500">
            ?
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        {problem.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleResponse(index)}
            className="bg-white/80 hover:bg-white rounded-lg p-4 text-2xl text-gray-800 transition-colors border border-gray-200 hover:border-gray-300"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default RavensGame