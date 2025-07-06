import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAnalytics } from '../store/slices/performanceSlice'
import { 
  fetchRecommendations, 
  generateAIInsights,
  getCognitiveClassification,
  getPersonalizedRecommendations,
  getPerformancePrediction
} from '../store/slices/userSlice'
import { Link } from 'react-router-dom'
import { 
  Brain, 
  Target, 
  Zap, 
  Puzzle, 
  TrendingUp, 
  Award, 
  Calendar,
  Play,
  BarChart3,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js'
import { Line, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
)

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { analytics, loading } = useSelector((state) => state.performance)
  const { 
    recommendations, 
    aiInsights, 
    cognitiveClassification,
    personalizedRecommendations,
    performancePrediction,
    loading: userLoading 
  } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchAnalytics())
    dispatch(fetchRecommendations({ limit: 5 }))
    dispatch(generateAIInsights())
    
    // Fetch ML-powered insights
    dispatch(getCognitiveClassification())
    dispatch(getPersonalizedRecommendations())
    dispatch(getPerformancePrediction())
  }, [dispatch])

  const domainIcons = {
    working_memory: <Brain className="w-6 h-6" />,
    attention: <Target className="w-6 h-6" />,
    processing_speed: <Zap className="w-6 h-6" />,
    problem_solving: <Puzzle className="w-6 h-6" />
  }

  const domainColors = {
    working_memory: 'from-blue-500 to-blue-600',
    attention: 'from-green-500 to-green-600',
    processing_speed: 'from-yellow-500 to-yellow-600',
    problem_solving: 'from-purple-500 to-purple-600'
  }

  // Prepare chart data
  const performanceChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Average Score',
        data: [65, 72, 78, 85],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  }

  const domainRadarData = {
    labels: ['Working Memory', 'Attention', 'Processing Speed', 'Problem Solving'],
    datasets: [
      {
        label: 'Your Performance',
        data: [
          analytics.domainPerformance?.working_memory?.averageScore || 0,
          analytics.domainPerformance?.attention?.averageScore || 0,
          analytics.domainPerformance?.processing_speed?.averageScore || 0,
          analytics.domainPerformance?.problem_solving?.averageScore || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      }
    ]
  }

  if (loading.analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-800 text-xl">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to challenge your mind today?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Calendar className="w-8 h-8" />}
          title="Current Streak"
          value={`${user?.streak || 0} days`}
          color="from-orange-500 to-red-500"
          subtitle="Keep it up! 🔥"
        />
        <StatCard
          icon={<Award className="w-8 h-8" />}
          title="Level"
          value={user?.level || 1}
          color="from-purple-500 to-pink-500"
          subtitle={`${user?.xp || 0} XP`}
        />
        <StatCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Total Sessions"
          value={analytics.totalSessions || 0}
          color="from-blue-500 to-cyan-500"
          subtitle="Training sessions"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Average Score"
          value={`${Math.round(analytics.averageScore || 0)}%`}
          color="from-green-500 to-emerald-500"
          subtitle="Overall performance"
        />
      </div>

      {/* ML-Powered Cognitive Classification */}
      {cognitiveClassification && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Cognitive Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cognitive Type */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Cognitive Profile</h3>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {cognitiveClassification.cognitive_type || 'Analyzing...'}
              </div>
              <div className="text-sm text-purple-700 mb-2">
                Confidence: {Math.round((cognitiveClassification.confidence || 0) * 100)}%
              </div>
              <div className="text-xs text-purple-600">
                {cognitiveClassification.characteristics?.slice(0, 2).join(', ') || 'Processing profile...'}
              </div>
            </div>

            {/* Domain Strengths */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Your Strengths</h3>
              <div className="space-y-1">
                {(cognitiveClassification.domain_strengths || ['Working Memory']).map((strength, index) => (
                  <div key={index} className="text-sm text-green-700 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {strength}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">AI Recommendations</h3>
              <div className="space-y-1">
                {(cognitiveClassification.recommendations || ['Practice regularly', 'Stay consistent']).slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-xs text-blue-700">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML-Powered Game Recommendations */}
      {personalizedRecommendations && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-600" />
            Personalized Game Recommendations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(personalizedRecommendations.recommended_tests || ['n-back', 'flanker', 'simple-reaction']).map((game, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="font-semibold text-gray-800 mb-1 capitalize">
                  {(game || '').replace('-', ' ')}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Difficulty: {personalizedRecommendations.difficulty_recommendations?.[game] || 'Medium'}
                </div>
                <Link
                  to={`/games/${game}`}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Start Training
                </Link>
              </div>
            ))}
          </div>
          
          {personalizedRecommendations.reasoning && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-700">
                <strong>Why these games?</strong> {personalizedRecommendations.reasoning}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Prediction */}
      {performancePrediction && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Performance Prediction
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800 mb-1">
                {Math.round(performancePrediction.predicted_score_next_week || 70)}%
              </div>
              <div className="text-sm text-green-600">Predicted Next Score</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-800 mb-1 capitalize">
                {(performancePrediction.trend || 'stable').replace('_', ' ')}
              </div>
              <div className="text-sm text-blue-600">Performance Trend</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-800 mb-1">
                {Math.round((performancePrediction.confidence || 0.7) * 100)}%
              </div>
              <div className="text-sm text-purple-600">Prediction Confidence</div>
            </div>
          </div>
          
          {performancePrediction.insights && (
            <div className="mt-4 space-y-2">
              {performancePrediction.insights.map((insight, index) => (
                <div key={index} className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Insights Section */}
      {aiInsights && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Performance Insights
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cognitive Profile */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Cognitive Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Dominant Domain:</span>
                  <span className="text-blue-800 font-medium capitalize">
                    {(aiInsights.cognitiveProfile.dominantDomain || 'working_memory').replace('_', ' ')}
                  </span>
                </div>
                <div className="text-blue-700">
                  <div className="font-medium">Strengths:</div>
                  <div className="text-xs">{(aiInsights.cognitiveProfile.strengths || []).join(', ')}</div>
                </div>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Performance Trends</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Improvement:</span>
                  <span className="text-green-800 font-medium">+{aiInsights.trends.improvement || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Consistency:</span>
                  <span className="text-green-800 font-medium">{aiInsights.trends.consistency || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Engagement:</span>
                  <span className="text-green-800 font-medium">{aiInsights.trends.engagement || 0}%</span>
                </div>
              </div>
            </div>

            {/* Next Session Prediction */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Next Session Prediction</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-600">Expected Score:</span>
                  <span className="text-purple-800 font-medium">
                    {Math.round(aiInsights.performancePrediction.nextSessionScore || 70)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Improvement Chance:</span>
                  <span className="text-purple-800 font-medium">
                    {Math.round((aiInsights.performancePrediction.improvementProbability || 0.75) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Performance Trend
          </h2>
          <div className="h-64">
            <Line 
              data={performanceChartData}
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

        {/* Domain Performance */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Cognitive Domains
          </h2>
          <div className="h-64">
            <Radar 
              data={domainRadarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#374151' }
                  }
                },
                scales: {
                  r: {
                    angleLines: { color: 'rgba(55, 65, 81, 0.2)' },
                    grid: { color: 'rgba(55, 65, 81, 0.2)' },
                    pointLabels: { color: '#374151' },
                    ticks: { color: '#374151', backdropColor: 'transparent' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Domain Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(analytics.domainPerformance || {}).map(([domain, data]) => (
          <DomainCard
            key={domain}
            domain={domain}
            data={data}
            icon={domainIcons[domain]}
            color={domainColors[domain]}
          />
        ))}
      </div>

      {/* Quick Actions & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Quick Start
          </h2>
          <div className="space-y-3">
            <Link
              to="/games"
              className="block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Browse All Games</div>
                  <div className="text-blue-100 text-sm">Choose from 8 cognitive games</div>
                </div>
                <Play className="w-6 h-6 text-white" />
              </div>
            </Link>
            
            <Link
              to="/analytics"
              className="block p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">View Analytics</div>
                  <div className="text-green-100 text-sm">Detailed performance insights</div>
                </div>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </Link>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            AI Recommendations
          </h2>
          <div className="space-y-3">
            {userLoading.recommendations ? (
              <div className="text-center py-4">
                <div className="loading-spinner mx-auto mb-2"></div>
                <div className="text-gray-500 text-sm">Loading recommendations...</div>
              </div>
            ) : recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec) => (
                <div key={rec._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-gray-800 font-medium text-sm">
                      {rec.title}
                    </div>
                    <div className={`
                      px-2 py-1 rounded text-xs flex items-center space-x-1
                      ${rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'}
                    `}>
                      {rec.priority === 'high' && <AlertCircle className="w-3 h-3" />}
                      {rec.priority === 'medium' && <Clock className="w-3 h-3" />}
                      {rec.priority === 'low' && <CheckCircle className="w-3 h-3" />}
                      <span>{rec.priority}</span>
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs">
                    {rec.message}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                Complete more sessions to get personalized recommendations
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.badges?.slice(-3).map((badge, index) => (
            <div key={index} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-gray-800 font-semibold">{badge.name}</div>
              <div className="text-gray-600 text-sm">{badge.description}</div>
            </div>
          )) || (
            <div className="col-span-3 text-center text-gray-500 py-8">
              Complete games to earn your first achievements!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon, title, value, color, subtitle }) => (
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

const DomainCard = ({ domain, data, icon, color }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
        {icon}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-800">
          {Math.round(data.averageScore || 0)}%
        </div>
        <div className="text-gray-500 text-sm">avg score</div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-gray-800 font-medium capitalize">
        {domain.replace('_', ' ')}
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Sessions:</span>
        <span className="text-gray-800">{data.sessionCount || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Best Score:</span>
        <span className="text-gray-800">{Math.round(data.bestScore || 0)}%</span>
      </div>
    </div>
  </div>
)

export default Dashboard