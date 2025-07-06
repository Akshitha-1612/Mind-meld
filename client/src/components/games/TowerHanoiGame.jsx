import React, { useState, useEffect } from 'react'

const TowerHanoiGame = ({ config, trial, onResponse }) => {
  const [towers, setTowers] = useState([[], [], []])
  const [selectedTower, setSelectedTower] = useState(null)
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)

  useEffect(() => {
    // Initialize towers - all disks start on the first tower
    const initialTowers = [[], [], []]
    for (let i = config.disks; i >= 1; i--) {
      initialTowers[0].push(i)
    }
    setTowers(initialTowers)
    setMoves(0)
    setGameStarted(true)
    setGameCompleted(false)
  }, [config.disks])

  // Check for game completion whenever towers change
  useEffect(() => {
    if (gameStarted && !gameCompleted && towers[2].length === config.disks) {
      // All disks are on the rightmost tower - game is complete!
      setGameCompleted(true)
      
      const optimalMoves = Math.pow(2, config.disks) - 1
      const efficiency = Math.min(100, (optimalMoves / Math.max(moves, 1)) * 100)
      
      // Small delay to show the completed state before ending
      setTimeout(() => {
        onResponse({
          correct: true,
          data: {
            moves,
            optimalMoves,
            efficiency: Math.round(efficiency),
            solved: true,
            disks: config.disks,
            completionTime: Date.now()
          }
        })
      }, 1500) // Give user time to see completion
    }
  }, [towers, gameStarted, gameCompleted, config.disks, moves, onResponse])

  const handleTowerClick = (towerIndex) => {
    if (gameCompleted) return // Don't allow moves after completion
    
    if (selectedTower === null) {
      // Select a tower to move from
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex)
      }
    } else {
      // Move disk to selected tower
      if (selectedTower !== towerIndex) {
        const newTowers = [...towers]
        const disk = newTowers[selectedTower][newTowers[selectedTower].length - 1] // Get top disk
        
        // Check if move is valid (can only place smaller disk on larger disk or empty tower)
        const targetTower = newTowers[towerIndex]
        const canMove = targetTower.length === 0 || targetTower[targetTower.length - 1] > disk
        
        if (canMove) {
          // Valid move - remove disk from source and add to target
          newTowers[selectedTower].pop()
          newTowers[towerIndex].push(disk)
          setTowers(newTowers)
          setMoves(prev => prev + 1)
        }
      }
      setSelectedTower(null) // Always deselect after attempting a move
    }
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Tower of Hanoi</h3>
        <p className="text-gray-600 mb-2">
          Move all disks to the rightmost tower. Larger disks cannot go on smaller ones.
        </p>
        <div className="text-gray-800 font-semibold">
          Moves: {moves}
          {config.hintsAvailable && (
            <span className="text-gray-500 text-sm ml-4">
              (Optimal: {Math.pow(2, config.disks) - 1} moves)
            </span>
          )}
        </div>
        {gameCompleted && (
          <div className="text-green-600 font-bold text-lg mt-2 animate-pulse">
            🎉 Puzzle Solved! Excellent work!
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-8 mb-8">
        {towers.map((tower, towerIndex) => (
          <div
            key={towerIndex}
            className={`
              relative w-32 h-48 bg-gray-100 rounded-lg cursor-pointer border-2 transition-all duration-200
              ${selectedTower === towerIndex ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'}
              ${gameCompleted ? 'cursor-not-allowed' : 'hover:border-gray-400'}
            `}
            onClick={() => !gameCompleted && handleTowerClick(towerIndex)}
          >
            {/* Tower pole */}
            <div className="absolute left-1/2 top-2 bottom-2 w-1 bg-gray-400 transform -translate-x-1/2"></div>
            
            {/* Tower base */}
            <div className="absolute bottom-2 left-2 right-2 h-2 bg-gray-400 rounded"></div>
            
            {/* Disks */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col-reverse items-center">
              {tower.map((disk, diskIndex) => {
                const diskWidth = 20 + (disk * 15) // Larger number = wider disk
                return (
                  <div
                    key={diskIndex}
                    className={`
                      h-4 rounded mb-1 bg-gradient-to-r transition-all duration-200
                      ${disk === 1 ? 'from-red-400 to-red-500' :
                        disk === 2 ? 'from-blue-400 to-blue-500' :
                        disk === 3 ? 'from-green-400 to-green-500' :
                        disk === 4 ? 'from-yellow-400 to-yellow-500' :
                        'from-purple-400 to-purple-500'}
                      ${selectedTower === towerIndex && diskIndex === tower.length - 1 ? 'ring-2 ring-yellow-400' : ''}
                    `}
                    style={{ width: `${diskWidth}px` }}
                  >
                    <div className="text-white text-xs font-bold text-center leading-4">
                      {disk}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Tower label */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              {towerIndex === 0 ? 'Start' : towerIndex === 1 ? 'Helper' : 'Goal'}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-gray-500 text-sm max-w-md mx-auto mb-4">
        {gameCompleted ? (
          <p className="text-green-600 font-semibold">Game completed! Redirecting to summary...</p>
        ) : selectedTower !== null ? (
          <p>Click on another tower to move the top disk, or click the same tower to cancel.</p>
        ) : (
          <p>Click on a tower with disks to select it, then click another tower to move the top disk.</p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mt-6">
        <div className="text-sm text-gray-600 mb-2">
          Progress: {towers[2].length} / {config.disks} disks moved to goal
        </div>
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              gameCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
            style={{ width: `${(towers[2].length / config.disks) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default TowerHanoiGame