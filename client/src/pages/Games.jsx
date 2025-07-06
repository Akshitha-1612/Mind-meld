import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGames, setFilters } from '../store/slices/gameSlice'
import { Brain, Clock, Target, Zap, Puzzle, Filter, Play } from 'lucide-react'

const Games = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { games, loading, filters } = useSelector((state) => state.game)
  const [selectedDomain, setSelectedDomain] = useState(filters.domain || '')
  const [selectedDifficulty, setSelectedDifficulty] = useState(filters.difficulty || '')

  useEffect(() => {
    dispatch(fetchGames({ domain: selectedDomain, difficulty: selectedDifficulty }))
  }, [dispatch, selectedDomain, selectedDifficulty])

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters }
    newFilters[filterType] = value || null
    
    dispatch(setFilters(newFilters))
    
    if (filterType === 'domain') {
      setSelectedDomain(value)
    } else if (filterType === 'difficulty') {
      setSelectedDifficulty(value)
    }
  }

  const getDomainIcon = (domain) => {
    switch (domain) {
      case 'working_memory':
        return <Brain className="w-5 h-5" />
      case 'attention':
        return <Target className="w-5 h-5" />
      case 'processing_speed':
        return <Zap className="w-5 h-5" />
      case 'problem_solving':
        return <Puzzle className="w-5 h-5" />
      default:
        return <Brain className="w-5 h-5" />
    }
  }

  const getDomainColor = (domain) => {
    switch (domain) {
      case 'working_memory':
        return 'from-blue-500 to-blue-600'
      case 'attention':
        return 'from-green-500 to-green-600'
      case 'processing_speed':
        return 'from-yellow-500 to-yellow-600'
      case 'problem_solving':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (loading.games) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl">Loading games...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Inline Filters */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Cognitive Training Games
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
          Choose from scientifically validated cognitive games designed to assess and improve 
          your mental performance across different domains.
        </p>
        
        {/* Compact Inline Filters */}
        <div className="flex items-center justify-center space-x-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Domain Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Domain:</label>
            <select
              value={selectedDomain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="working_memory">Working Memory</option>
              <option value="attention">Attention</option>
              <option value="processing_speed">Processing Speed</option>
              <option value="problem_solving">Problem Solving</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Difficulty:</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Games Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={() => navigate(`/games/${game.id}`)}
            domainIcon={getDomainIcon(game.domain)}
            domainColor={getDomainColor(game.domain)}
          />
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No games found matching your filters
          </div>
          <button
            onClick={() => {
              setSelectedDomain('')
              setSelectedDifficulty('')
              handleFilterChange('domain', '')
              handleFilterChange('difficulty', '')
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

const GameCard = ({ game, onPlay, domainIcon, domainColor }) => {
  return (
    <div className="game-card card group cursor-pointer" onClick={onPlay}>
      {/* Game Icon */}
      <div className="text-center mb-3">
        <div className="text-4xl mb-2">{game.icon}</div>
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r ${domainColor} text-white text-xs`}>
          {domainIcon}
          <span className="capitalize">{game.domain.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
          {game.name}
        </h3>
        <p className="text-gray-600 text-xs leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Game Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Duration:</span>
          <span className="text-gray-800 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            ~{Math.floor(game.estimatedDuration / 60)} min
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Difficulties:</span>
          <div className="flex space-x-1">
            {game.difficulties.slice(0, 2).map((diff) => (
              <span
                key={diff}
                className={`
                  px-1 py-0.5 rounded text-xs
                  ${diff === 'easy' ? 'bg-green-500/20 text-green-600' :
                    diff === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                    'bg-red-500/20 text-red-600'}
                `}
              >
                {diff}
              </span>
            ))}
            {game.difficulties.length > 2 && (
              <span className="text-gray-400 text-xs">+{game.difficulties.length - 2}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Metrics:</span>
          <span className="text-gray-800 text-xs">
            {game.metrics.slice(0, 1).join(', ')}
            {game.metrics.length > 1 && '...'}
          </span>
        </div>
      </div>

      {/* Play Button */}
      <button className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm">
        <Play className="w-3 h-3" />
        <span>Play Game</span>
      </button>

      {/* Research Citation */}
      {game.researchCitation && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            <strong>Research:</strong> {game.researchCitation.split('.')[0]}...
          </div>
        </div>
      )}
    </div>
  )
}

export default Games