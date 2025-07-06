import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// Async thunks
export const createSession = createAsyncThunk(
  'performance/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/sessions', sessionData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create session')
    }
  }
)

export const fetchSessions = createAsyncThunk(
  'performance/fetchSessions',
  async ({ page = 1, limit = 20, gameType, domain, startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (gameType) params.append('gameType', gameType)
      if (domain) params.append('domain', domain)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await api.get(`/sessions?${params.toString()}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions')
    }
  }
)

export const fetchAnalytics = createAsyncThunk(
  'performance/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/dashboard')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics')
    }
  }
)

export const fetchDetailedPerformance = createAsyncThunk(
  'performance/fetchDetailedPerformance',
  async ({ timeRange = '30d', gameType, domain } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ timeRange })
      if (gameType) params.append('gameType', gameType)
      if (domain) params.append('domain', domain)
      
      const response = await api.get(`/analytics/performance?${params.toString()}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch detailed performance')
    }
  
  }
)

export const exportData = createAsyncThunk(
  'performance/exportData',
  async (format = 'json', { rejectWithValue }) => {
    try {
      const response = await api.get(`/analytics/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      })
      return { data: response.data, format }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export data')
    }
  }
)

const initialState = {
  sessions: [],
  analytics: {
    performanceTrends: null,
    domainPerformance: {},
    weeklyStats: {},
    percentileAnalysis: {},
    totalSessions: 0,
    averageScore: 0,
    averageAccuracy: 0
  },
  detailedPerformance: {
    dailyPerformance: [],
    improvementMetrics: {},
    gameInsights: {}
  },
  loading: {
    sessions: false,
    analytics: false,
    detailedPerformance: false,
    export: false,
    createSession: false
  },
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  }
}

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    addSession: (state, action) => {
      state.sessions.unshift(action.payload)
      state.analytics.totalSessions += 1
    },
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload }
    },
    clearSessions: (state) => {
      state.sessions = []
      state.pagination = { current: 1, pages: 1, total: 0 }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Session
      .addCase(createSession.pending, (state) => {
        state.loading.createSession = true
        state.error = null
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading.createSession = false
        state.sessions.unshift(action.payload.session)
        state.analytics.totalSessions += 1
        state.error = null
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading.createSession = false
        state.error = action.payload
      })
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading.sessions = true
        state.error = null
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading.sessions = false
        state.sessions = action.payload.sessions
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading.sessions = false
        state.error = action.payload
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading.analytics = true
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false
        state.analytics = action.payload.analytics
        state.error = null
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading.analytics = false
        state.error = action.payload
      })
      // Fetch Detailed Performance
      .addCase(fetchDetailedPerformance.pending, (state) => {
        state.loading.detailedPerformance = true
        state.error = null
      })
      .addCase(fetchDetailedPerformance.fulfilled, (state, action) => {
        state.loading.detailedPerformance = false
        state.detailedPerformance = action.payload.performance
        state.error = null
      })
      .addCase(fetchDetailedPerformance.rejected, (state, action) => {
        state.loading.detailedPerformance = false
        state.error = action.payload
      })
      // Export Data
      .addCase(exportData.pending, (state) => {
        state.loading.export = true
        state.error = null
      })
      .addCase(exportData.fulfilled, (state) => {
        state.loading.export = false
        state.error = null
      })
      .addCase(exportData.rejected, (state, action) => {
        state.loading.export = false
        state.error = action.payload
      })
  }
})

export const { clearError, addSession, updateAnalytics, clearSessions } = performanceSlice.actions
export default performanceSlice.reducer