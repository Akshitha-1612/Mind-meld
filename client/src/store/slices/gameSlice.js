import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// Async thunks
export const fetchGames = createAsyncThunk(
  'game/fetchGames',
  async ({ domain, difficulty } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      if (domain) params.append('domain', domain)
      if (difficulty) params.append('difficulty', difficulty)
      
      const response = await api.get(`/games?${params.toString()}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch games')
    }
  }
)

export const fetchGameDetails = createAsyncThunk(
  'game/fetchGameDetails',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/games/${gameId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game details')
    }
  }
)

export const fetchGameConfig = createAsyncThunk(
  'game/fetchGameConfig',
  async ({ gameId, difficulty = 'medium' }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/games/${gameId}/config?difficulty=${difficulty}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game config')
    }
  }
)

const initialState = {
  games: [],
  currentGame: null,
  gameConfig: null,
  gameSession: {
    isActive: false,
    startTime: null,
    currentTrial: 0,
    totalTrials: 0,
    responses: [],
    score: 0,
    accuracy: 0
  },
  loading: {
    games: false,
    gameDetails: false,
    gameConfig: false
  },
  error: null,
  filters: {
    domain: null,
    difficulty: null
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    startGameSession: (state, action) => {
      state.gameSession = {
        isActive: true,
        startTime: Date.now(),
        currentTrial: 0,
        totalTrials: action.payload.totalTrials || 20,
        responses: [],
        score: 0,
        accuracy: 0,
        gameId: action.payload.gameId,
        difficulty: action.payload.difficulty
      }
    },
    endGameSession: (state) => {
      state.gameSession.isActive = false
    },
    recordResponse: (state, action) => {
      const { correct, reactionTime, trialData } = action.payload
      state.gameSession.responses.push({
        trial: state.gameSession.currentTrial,
        correct,
        reactionTime,
        timestamp: Date.now(),
        ...trialData
      })
      
      // Update current trial
      state.gameSession.currentTrial += 1
      
      // Calculate running accuracy
      const correctResponses = state.gameSession.responses.filter(r => r.correct).length
      state.gameSession.accuracy = (correctResponses / state.gameSession.responses.length) * 100
      
      // Calculate score (accuracy weighted by speed)
      const avgReactionTime = state.gameSession.responses.reduce((sum, r) => sum + r.reactionTime, 0) / state.gameSession.responses.length
      const speedBonus = Math.max(0, (2000 - avgReactionTime) / 2000) * 20 // Up to 20 point speed bonus
      state.gameSession.score = Math.min(100, state.gameSession.accuracy + speedBonus)
    },
    updateGameSession: (state, action) => {
      state.gameSession = { ...state.gameSession, ...action.payload }
    },
    resetGameSession: (state) => {
      state.gameSession = {
        isActive: false,
        startTime: null,
        currentTrial: 0,
        totalTrials: 0,
        responses: [],
        score: 0,
        accuracy: 0
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Games
      .addCase(fetchGames.pending, (state) => {
        state.loading.games = true
        state.error = null
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading.games = false
        state.games = action.payload.games
        state.error = null
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading.games = false
        state.error = action.payload
      })
      // Fetch Game Details
      .addCase(fetchGameDetails.pending, (state) => {
        state.loading.gameDetails = true
        state.error = null
      })
      .addCase(fetchGameDetails.fulfilled, (state, action) => {
        state.loading.gameDetails = false
        state.currentGame = action.payload.game
        state.error = null
      })
      .addCase(fetchGameDetails.rejected, (state, action) => {
        state.loading.gameDetails = false
        state.error = action.payload
      })
      // Fetch Game Config
      .addCase(fetchGameConfig.pending, (state) => {
        state.loading.gameConfig = true
        state.error = null
      })
      .addCase(fetchGameConfig.fulfilled, (state, action) => {
        state.loading.gameConfig = false
        state.gameConfig = action.payload.config
        state.error = null
      })
      .addCase(fetchGameConfig.rejected, (state, action) => {
        state.loading.gameConfig = false
        state.error = action.payload
      })
  }
})

export const {
  clearError,
  setFilters,
  startGameSession,
  endGameSession,
  recordResponse,
  updateGameSession,
  resetGameSession
} = gameSlice.actions

export default gameSlice.reducer