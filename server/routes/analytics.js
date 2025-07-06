const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get recent sessions
    const recentSessions = await Session.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Calculate performance trends
    const performanceTrends = calculatePerformanceTrends(recentSessions);
    
    // Get domain-specific performance
    const domainPerformance = calculateDomainPerformance(recentSessions);
    
    // Get weekly stats
    const weeklyStats = await calculateWeeklyStats(userId, sevenDaysAgo);
    
    // Get percentile analysis
    const percentileAnalysis = calculatePercentileAnalysis(recentSessions);

    res.json({
      success: true,
      analytics: {
        performanceTrends,
        domainPerformance,
        weeklyStats,
        percentileAnalysis,
        totalSessions: recentSessions.length,
        averageScore: recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length || 0,
        averageAccuracy: recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length || 0
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get detailed performance analytics
// @access  Private
router.get('/performance', auth, async (req, res) => {
  try {
    const { timeRange = '30d', gameType, domain } = req.query;
    const userId = req.user.id;
    
    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const query = {
      userId,
      createdAt: { $gte: startDate }
    };
    
    if (gameType) query.gameType = gameType;
    if (domain) query.domain = domain;

    const sessions = await Session.find(query).sort({ createdAt: 1 });
    
    // Group sessions by date for trend analysis
    const dailyPerformance = groupSessionsByDate(sessions);
    
    // Calculate improvement metrics
    const improvementMetrics = calculateImprovementMetrics(sessions);
    
    // Get game-specific insights
    const gameInsights = calculateGameInsights(sessions);

    res.json({
      success: true,
      performance: {
        dailyPerformance,
        improvementMetrics,
        gameInsights,
        totalSessions: sessions.length,
        dateRange: { start: startDate, end: new Date() }
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/export
// @desc    Export user data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId).select('-password');
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    
    const exportData = {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        profession: user.profession,
        cognitiveGoal: user.cognitiveGoal,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        stats: user.stats,
        exportedAt: new Date().toISOString()
      },
      sessions: sessions.map(session => ({
        id: session._id,
        gameType: session.gameType,
        domain: session.domain,
        difficulty: session.difficulty,
        score: session.score,
        accuracy: session.accuracy,
        reactionTime: session.reactionTime,
        duration: session.duration,
        metrics: session.metrics,
        percentileScores: session.percentileScores,
        createdAt: session.createdAt
      })),
      summary: {
        totalSessions: sessions.length,
        averageScore: sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length || 0,
        bestScore: Math.max(...sessions.map(s => s.score), 0),
        totalPlayTime: sessions.reduce((sum, s) => sum + s.duration, 0),
        gamesPlayed: [...new Set(sessions.map(s => s.gameType))].length
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData.sessions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=mindmeld-data.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=mindmeld-data.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function calculatePerformanceTrends(sessions) {
  if (sessions.length < 2) return { trend: 'stable', change: 0 };
  
  const recent = sessions.slice(0, 5);
  const older = sessions.slice(5, 10);
  
  const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length || recentAvg;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  return {
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
    change: Math.round(change * 100) / 100,
    recentAverage: Math.round(recentAvg * 100) / 100
  };
}

function calculateDomainPerformance(sessions) {
  const domains = ['working_memory', 'attention', 'processing_speed', 'problem_solving'];
  const performance = {};
  
  domains.forEach(domain => {
    const domainSessions = sessions.filter(s => s.domain === domain);
    if (domainSessions.length > 0) {
      performance[domain] = {
        averageScore: domainSessions.reduce((sum, s) => sum + s.score, 0) / domainSessions.length,
        sessionCount: domainSessions.length,
        bestScore: Math.max(...domainSessions.map(s => s.score)),
        averageAccuracy: domainSessions.reduce((sum, s) => sum + s.accuracy, 0) / domainSessions.length
      };
    }
  });
  
  return performance;
}

async function calculateWeeklyStats(userId, sevenDaysAgo) {
  const sessions = await Session.find({
    userId,
    createdAt: { $gte: sevenDaysAgo }
  });
  
  return {
    sessionsThisWeek: sessions.length,
    averageScore: sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length || 0,
    totalPlayTime: sessions.reduce((sum, s) => sum + s.duration, 0),
    gamesPlayed: [...new Set(sessions.map(s => s.gameType))].length
  };
}

function calculatePercentileAnalysis(sessions) {
  if (sessions.length === 0) return {};
  
  return {
    overall: sessions.reduce((sum, s) => sum + (s.percentileScores?.overall || 50), 0) / sessions.length,
    ageGroup: sessions.reduce((sum, s) => sum + (s.percentileScores?.ageGroup || 50), 0) / sessions.length,
    profession: sessions.reduce((sum, s) => sum + (s.percentileScores?.profession || 50), 0) / sessions.length
  };
}

function groupSessionsByDate(sessions) {
  const grouped = {};
  
  sessions.forEach(session => {
    const date = session.createdAt.toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = {
        date,
        sessions: [],
        averageScore: 0,
        averageAccuracy: 0,
        totalDuration: 0
      };
    }
    grouped[date].sessions.push(session);
  });
  
  // Calculate averages for each date
  Object.values(grouped).forEach(day => {
    day.averageScore = day.sessions.reduce((sum, s) => sum + s.score, 0) / day.sessions.length;
    day.averageAccuracy = day.sessions.reduce((sum, s) => sum + s.accuracy, 0) / day.sessions.length;
    day.totalDuration = day.sessions.reduce((sum, s) => sum + s.duration, 0);
    day.sessionCount = day.sessions.length;
  });
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calculateImprovementMetrics(sessions) {
  if (sessions.length < 2) return { improvement: 0, consistency: 0 };
  
  const scores = sessions.map(s => s.score);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  const improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  // Calculate consistency (inverse of standard deviation)
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const consistency = Math.max(0, 100 - Math.sqrt(variance));
  
  return {
    improvement: Math.round(improvement * 100) / 100,
    consistency: Math.round(consistency * 100) / 100
  };
}

function calculateGameInsights(sessions) {
  const gameStats = {};
  
  sessions.forEach(session => {
    if (!gameStats[session.gameType]) {
      gameStats[session.gameType] = {
        sessions: [],
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        averageAccuracy: 0
      };
    }
    
    gameStats[session.gameType].sessions.push(session);
    gameStats[session.gameType].totalSessions++;
  });
  
  // Calculate stats for each game
  Object.keys(gameStats).forEach(gameType => {
    const game = gameStats[gameType];
    game.averageScore = game.sessions.reduce((sum, s) => sum + s.score, 0) / game.sessions.length;
    game.bestScore = Math.max(...game.sessions.map(s => s.score));
    game.averageAccuracy = game.sessions.reduce((sum, s) => sum + s.accuracy, 0) / game.sessions.length;
  });
  
  return gameStats;
}

function convertToCSV(sessions) {
  if (sessions.length === 0) return '';
  
  const headers = ['Date', 'Game Type', 'Domain', 'Difficulty', 'Score', 'Accuracy', 'Reaction Time', 'Duration'];
  const rows = sessions.map(session => [
    session.createdAt,
    session.gameType,
    session.domain,
    session.difficulty,
    session.score,
    session.accuracy,
    session.reactionTime || '',
    session.duration
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;