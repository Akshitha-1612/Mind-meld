import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile')
    }
  }
)

export const fetchLeaderboard = createAsyncThunk(
  'user/fetchLeaderboard',
  async ({ timeframe = 'weekly', limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/leaderboard?timeframe=${timeframe}&limit=${limit}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard')
    }
  }
)

export const fetchRecommendations = createAsyncThunk(
  'user/fetchRecommendations',
  async ({ page = 1, limit = 10, unreadOnly = false } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/recommendations?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`)
      return response.data
    } catch (error) {
      // If API fails, return mock recommendations for demo
      const mockRecommendations = [
        {
          _id: 'mock-1',
          title: 'Increase N-Back Difficulty',
          message: 'Your working memory performance suggests you\'re ready for harder N-Back challenges.',
          priority: 'medium',
          category: 'training',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'mock-2',
          title: 'Focus on Attention Training',
          message: 'Your attention scores could improve with more Flanker task practice.',
          priority: 'high',
          category: 'improvement',
          isRead: false,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: 'mock-3',
          title: 'Maintain Your Streak',
          message: 'You\'re doing great! Keep up your daily training to maintain momentum.',
          priority: 'low',
          category: 'motivation',
          isRead: false,
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      
      return {
        recommendations: mockRecommendations,
        unreadCount: mockRecommendations.filter(r => !r.isRead).length,
        pagination: { current: 1, pages: 1, total: mockRecommendations.length }
      }
    }
  }
)

export const markRecommendationRead = createAsyncThunk(
  'user/markRecommendationRead',
  async (recommendationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/recommendations/${recommendationId}/read`)
      return response.data
    } catch (error) {
      // For demo purposes, still mark as read locally
      return { recommendation: { _id: recommendationId, isRead: true } }
    }
  }
)

export const fetchAchievements = createAsyncThunk(
  'user/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/achievements')
      return response.data
    } catch (error) {
      // Return mock achievements for demo
      const mockAchievements = [
        {
          id: 'first-session',
          name: 'Getting Started',
          description: 'Complete your first training session',
          category: 'milestone',
          progress: 1,
          target: 1,
          completed: true,
          reward: '100 XP'
        },
        {
          id: 'streak-7',
          name: '7-Day Streak',
          description: 'Train for 7 consecutive days',
          category: 'consistency',
          progress: 3,
          target: 7,
          completed: false,
          reward: '200 XP'
        },
        {
          id: 'sessions-50',
          name: 'Half Century',
          description: 'Complete 50 training sessions',
          category: 'milestone',
          progress: 12,
          target: 50,
          completed: false,
          reward: '500 XP + Badge'
        }
      ]
      
      return { achievements: mockAchievements }
    }
  }
)

export const submitFeedback = createAsyncThunk(
  'user/submitFeedback',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/feedback', feedbackData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit feedback')
    }
  }
)

// ML-related thunks
export const getCognitiveClassification = createAsyncThunk(
  'user/getCognitiveClassification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/ml/classify')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get cognitive classification')
    }
  }
)

export const getPersonalizedRecommendations = createAsyncThunk(
  'user/getPersonalizedRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/ml/recommend')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get recommendations')
    }
  }
)

export const getPerformancePrediction = createAsyncThunk(
  'user/getPerformancePrediction',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/ml/predict')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get performance prediction')
    }
  }
)

// Generate AI insights based on user data
export const generateAIInsights = createAsyncThunk(
  'user/generateAIInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/ml/insights')
      return response.data.insights
    } catch (error) {
      // Fallback to local insights generation
      const fallbackInsights = {
        cognitiveProfile: {
          dominantDomain: 'working_memory',
          strengths: ['Pattern Recognition', 'Memory Retention'],
          weaknesses: ['Processing Speed', 'Sustained Attention'],
          level: 'Intermediate'
        },
        recommendations: ['n-back', 'flanker', 'simple-reaction'],
        performancePrediction: {
          nextSessionScore: 75,
          improvementProbability: 0.75,
          recommendedGames: ['n-back', 'simple-reaction']
        },
        trends: {
          improvement: 12.5,
          consistency: 85,
          engagement: 92
        }
      }
      
      return fallbackInsights
    }
  }
)

const initialState = {
  profile: null,
  leaderboard: [],
  recommendations: [],
  achievements: [],
  aiInsights: null,
  cognitiveClassification: null,
  personalizedRecommendations: null,
  performancePrediction: null,
  stats: {
    totalSessions: 0,
    averageScore: 0,
    totalPlayTime: 0,
    bestStreak: 0
  },
  loading: {
    profile: false,
    leaderboard: false,
    recommendations: false,
    achievements: false,
    feedback: false,
    aiInsights: false,
    cognitiveClassification: false,
    personalizedRecommendations: false,
    performancePrediction: false
  },
  error: null,
  unreadRecommendations: 0
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload }
    },
    addRecommendation: (state, action) => {
      state.recommendations.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadRecommendations += 1
      }
    },
    updateAchievementProgress: (state, action) => {
      const { achievementId, progress } = action.payload
      const achievement = state.achievements.find(a => a.id === achievementId)
      if (achievement) {
        achievement.progress = progress
        achievement.completed = progress >= achievement.target
      }
    },
    markAllRecommendationsRead: (state) => {
      state.recommendations.forEach(rec => rec.isRead = true)
      state.unreadRecommendations = 0
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false
        state.profile = action.payload.profile
        state.error = null
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false
        state.error = action.payload
      })
      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading.leaderboard = true
        state.error = null
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading.leaderboard = false
        state.leaderboard = action.payload.leaderboard
        state.error = null
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading.leaderboard = false
        state.error = action.payload
      })
      // Fetch Recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading.recommendations = true
        state.error = null
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading.recommendations = false
        state.recommendations = action.payload.recommendations
        state.unreadRecommendations = action.payload.unreadCount
        state.error = null
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading.recommendations = false
        state.error = action.payload
      })
      // Mark Recommendation Read
      .addCase(markRecommendationRead.fulfilled, (state, action) => {
        const recommendation = state.recommendations.find(r => r._id === action.payload.recommendation._id)
        if (recommendation && !recommendation.isRead) {
          recommendation.isRead = true
          state.unreadRecommendations = Math.max(0, state.unreadRecommendations - 1)
        }
      })
      // Fetch Achievements
      .addCase(fetchAchievements.pending, (state) => {
        state.loading.achievements = true
        state.error = null
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading.achievements = false
        state.achievements = action.payload.achievements
        state.error = null
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading.achievements = false
        state.error = action.payload
      })
      // Submit Feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading.feedback = true
        state.error = null
      })
      .addCase(submitFeedback.fulfilled, (state) => {
        state.loading.feedback = false
        state.error = null
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading.feedback = false
        state.error = action.payload
      })
      // Generate AI Insights
      .addCase(generateAIInsights.pending, (state) => {
        state.loading.aiInsights = true
        state.error = null
      })
      .addCase(generateAIInsights.fulfilled, (state, action) => {
        state.loading.aiInsights = false
        state.aiInsights = action.payload
        state.error = null
      })
      .addCase(generateAIInsights.rejected, (state, action) => {
        state.loading.aiInsights = false
        state.error = action.payload
      })
      // Cognitive Classification
      .addCase(getCognitiveClassification.pending, (state) => {
        state.loading.cognitiveClassification = true
        state.error = null
      })
      .addCase(getCognitiveClassification.fulfilled, (state, action) => {
        state.loading.cognitiveClassification = false
        state.cognitiveClassification = action.payload.classification
        state.error = null
      })
      .addCase(getCognitiveClassification.rejected, (state, action) => {
        state.loading.cognitiveClassification = false
        state.error = action.payload
      })
      // Personalized Recommendations
      .addCase(getPersonalizedRecommendations.pending, (state) => {
        state.loading.personalizedRecommendations = true
        state.error = null
      })
      .addCase(getPersonalizedRecommendations.fulfilled, (state, action) => {
        state.loading.personalizedRecommendations = false
        state.personalizedRecommendations = action.payload.recommendations
        state.error = null
      })
      .addCase(getPersonalizedRecommendations.rejected, (state, action) => {
        state.loading.personalizedRecommendations = false
        state.error = action.payload
      })
      // Performance Prediction
      .addCase(getPerformancePrediction.pending, (state) => {
        state.loading.performancePrediction = true
        state.error = null
      })
      .addCase(getPerformancePrediction.fulfilled, (state, action) => {
        state.loading.performancePrediction = false
        state.performancePrediction = action.payload.prediction
        state.error = null
      })
      .addCase(getPerformancePrediction.rejected, (state, action) => {
        state.loading.performancePrediction = false
        state.error = action.payload
      })
  }
})

export const { 
  clearError, 
  updateStats, 
  addRecommendation, 
  updateAchievementProgress,
  markAllRecommendationsRead 
} = userSlice.actions

export default userSlice.reducer