import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDetailedPerformance, exportData } from '../store/slices/performanceSlice'
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  Target,
  Clock,
  Award
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const Analytics = () => {
  const dispatch = useDispatch()
  const { detailedPerformance, loading } = useSelector((state) => state.performance)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')

  useEffect(() => {
    dispatch(fetchDetailedPerformance({ 
      timeRange, 
      gameType: selectedGame, 
      domain: selectedDomain 
    }))
  }, [dispatch, timeRange, selectedGame, selectedDomain])

  const handleExport = async (format) => {
    try {
      await dispatch(exportData(format)).unwrap()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Prepare chart data
  const dailyPerformanceData = {
    labels: detailedPerformance.dailyPerformance?.map(d => 
      new Date(d.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Average Score',
        data: detailedPerformance.dailyPerformance?.map(d => d.averageScore) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Accuracy',
        data: detailedPerformance.dailyPerformance?.map(d => d.averageAccuracy) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  }

  const gameInsightsData = {
    labels: Object.keys(detailedPerformance.gameInsights || {}),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(detailedPerformance.gameInsights || {}).map(g => g.averageScore),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ]
      }
    ]
  }

  if (loading.detailedPerformance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-600">
            Deep insights into your cognitive performance
          </p>
        </div>
        
        <div className="flex space-x-2">
          {/* <button
            onClick={() => handleExport('json')}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading.export}
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button> */}
          {/* <button
            onClick={() => handleExport('csv')}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading.export}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button> */}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-800" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Game Type
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="input-field"
            >
              <option value="">All Games</option>
              <option value="n-back">N-Back</option>
              <option value="flanker">Flanker</option>
              <option value="simple-reaction">Simple Reaction</option>
              <option value="choice-reaction">Choice Reaction</option>
              <option value="ravens-matrices">Raven's Matrices</option>
              <option value="tower-hanoi">Tower of Hanoi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="input-field"
            >
              <option value="">All Domains</option>
              <option value="working_memory">Working Memory</option>
              <option value="attention">Attention</option>
              <option value="processing_speed">Processing Speed</option>
              <option value="problem_solving">Problem Solving</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Improvement"
          value={`${Math.round(detailedPerformance.improvementMetrics?.improvement || 0)}%`}
          color="from-green-500 to-emerald-500"
          subtitle="vs previous period"
        />
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          title="Consistency"
          value={`${Math.round(detailedPerformance.improvementMetrics?.consistency || 0)}%`}
          color="from-blue-500 to-cyan-500"
          subtitle="performance stability"
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          title="Avg Reaction Time"
          value="1.2s"
          color="from-yellow-500 to-orange-500"
          subtitle="across all games"
        />
        <MetricCard
          icon={<Award className="w-6 h-6" />}
          title="Best Streak"
          value="12 days"
          color="from-purple-500 to-pink-500"
          subtitle="personal record"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance Trend */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Daily Performance
          </h2>
          <div className="h-80">
            <Line 
              data={dailyPerformanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#374151' }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#374151' },
                    grid: { color: 'rgba(55, 65, 81, 0.1)' }
                  },
                  y: {
                    ticks: { color: '#374151' },
                    grid: { color: 'rgba(55, 65, 81, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Game Performance Comparison */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Game Performance
          </h2>
          <div className="h-80">
            <Bar 
              data={gameInsightsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#374151' }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#374151' },
                    grid: { color: 'rgba(55, 65, 81, 0.1)' }
                  },
                  y: {
                    ticks: { color: '#374151' },
                    grid: { color: 'rgba(55, 65, 81, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Insights */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Performance Insights
          </h2>
          <div className="space-y-4">
            <InsightItem
              title="Strongest Domain"
              value="Working Memory"
              description="You excel in tasks requiring temporary information storage"
              color="text-green-600"
            />
            <InsightItem
              title="Improvement Area"
              value="Processing Speed"
              description="Focus on reaction time games to boost this domain"
              color="text-yellow-600"
            />
            <InsightItem
              title="Optimal Time"
              value="Morning Sessions"
              description="Your performance peaks between 9-11 AM"
              color="text-blue-600"
            />
          </div>
        </div>

        {/* Recommendations */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            AI Recommendations
          </h2>
          <div className="space-y-4">
            <RecommendationItem
              title="Increase Difficulty"
              description="You're ready for harder challenges in N-Back tasks"
              priority="medium"
            />
            <RecommendationItem
              title="Focus Training"
              description="Spend more time on attention-based games this week"
              priority="high"
            />
            <RecommendationItem
              title="Consistency Goal"
              description="Aim for 5 consecutive days of training"
              priority="low"
            />
          </div>
        </div>
      </div>

      {/* Session History Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Sessions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-gray-500 pb-2">Date</th>
                <th className="text-left text-gray-500 pb-2">Game</th>
                <th className="text-left text-gray-500 pb-2">Difficulty</th>
                <th className="text-left text-gray-500 pb-2">Score</th>
                <th className="text-left text-gray-500 pb-2">Accuracy</th>
                <th className="text-left text-gray-500 pb-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock data - in real app, this would come from sessions */}
              <SessionRow
                date="2024-01-15"
                game="N-Back"
                difficulty="Medium"
                score={85}
                accuracy={78}
                duration="5:23"
              />
              <SessionRow
                date="2024-01-14"
                game="Flanker"
                difficulty="Hard"
                score={92}
                accuracy={89}
                duration="3:45"
              />
              <SessionRow
                date="2024-01-14"
                game="Simple Reaction"
                difficulty="Easy"
                score={76}
                accuracy={95}
                duration="2:10"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({ icon, title, value, color, subtitle }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-sm mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
        <div className="text-gray-400 text-xs">{subtitle}</div>
      </div>
      <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
        {icon}
      </div>
    </div>
  </div>
)

const InsightItem = ({ title, value, description, color }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <div className="flex justify-between items-start mb-2">
      <div className="text-gray-800 font-medium">{title}</div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
    <div className="text-gray-600 text-sm">{description}</div>
  </div>
)

const RecommendationItem = ({ title, description, priority }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <div className="flex justify-between items-start mb-2">
      <div className="text-gray-800 font-medium">{title}</div>
      <div className={`
        px-2 py-1 rounded text-xs
        ${priority === 'high' ? 'bg-red-500/20 text-red-600' :
          priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
          'bg-green-500/20 text-green-600'}
      `}>
        {priority}
      </div>
    </div>
    <div className="text-gray-600 text-sm">{description}</div>
  </div>
)

const SessionRow = ({ date, game, difficulty, score, accuracy, duration }) => (
  <tr className="border-b border-gray-100">
    <td className="py-2 text-gray-600">{date}</td>
    <td className="py-2 text-gray-800">{game}</td>
    <td className="py-2">
      <span className={`
        px-2 py-1 rounded text-xs
        ${difficulty === 'Easy' ? 'bg-green-500/20 text-green-600' :
          difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-600' :
          'bg-red-500/20 text-red-600'}
      `}>
        {difficulty}
      </span>
    </td>
    <td className="py-2 text-gray-800 font-semibold">{score}%</td>
    <td className="py-2 text-gray-600">{accuracy}%</td>
    <td className="py-2 text-gray-600">{duration}</td>
  </tr>
)

export default Analytics