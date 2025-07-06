const express = require('express');
const User = require('../models/User');
const Session = require('../models/Session');
const Recommendation = require('../models/Recommendation');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const recentSessions = await Session.find({ userId: req.user.id })
      .limit(5)
      .sort({ createdAt: -1 });
    
    const recommendations = await Recommendation.find({ 
      userId: req.user.id,
      isRead: false 
    }).limit(3).sort({ createdAt: -1 });

    res.json({
      success: true,
      profile: {
        user,
        recentSessions,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard data
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { timeframe = 'weekly', limit = 10 } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Aggregate user performance for the timeframe
    const leaderboard = await Session.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalXP: { $sum: { $multiply: ['$score', 0.1] } }, // Mock XP calculation
          bestScore: { $max: '$score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          level: '$user.level',
          totalSessions: 1,
          averageScore: { $round: ['$averageScore', 1] },
          totalXP: { $round: ['$totalXP', 0] },
          bestScore: 1
        }
      },
      {
        $sort: { averageScore: -1, totalSessions: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.userId.toString() === req.user.id
    }));

    // Find current user's position if not in top results
    let currentUserRank = null;
    const currentUserInTop = rankedLeaderboard.find(u => u.isCurrentUser);
    
    if (!currentUserInTop) {
      const allUsers = await Session.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$userId',
            averageScore: { $avg: '$score' },
            totalSessions: { $sum: 1 }
          }
        },
        { $sort: { averageScore: -1, totalSessions: -1 } }
      ]);
      
      currentUserRank = allUsers.findIndex(u => u._id.toString() === req.user.id) + 1;
    }

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      currentUserRank: currentUserInTop ? currentUserInTop.rank : currentUserRank,
      timeframe,
      totalParticipants: await User.countDocuments()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/recommendations
// @desc    Get user recommendations
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const query = { userId: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const recommendations = await Recommendation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recommendation.countDocuments(query);
    const unreadCount = await Recommendation.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });

    res.json({
      success: true,
      recommendations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/recommendations/:id/read
// @desc    Mark recommendation as read
// @access  Private
router.put('/recommendations/:id/read', auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Mark recommendation read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements and progress
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sessions = await Session.find({ userId: req.user.id });
    
    // Calculate achievement progress
    const achievements = [
      {
        id: 'first-session',
        name: 'Getting Started',
        description: 'Complete your first training session',
        category: 'milestone',
        progress: Math.min(user.stats.totalSessions, 1),
        target: 1,
        completed: user.stats.totalSessions >= 1,
        reward: '100 XP'
      },
      {
        id: 'streak-7',
        name: '7-Day Streak',
        description: 'Train for 7 consecutive days',
        category: 'consistency',
        progress: Math.min(user.streak, 7),
        target: 7,
        completed: user.streak >= 7,
        reward: '200 XP'
      },
      {
        id: 'sessions-50',
        name: 'Half Century',
        description: 'Complete 50 training sessions',
        category: 'milestone',
        progress: Math.min(user.stats.totalSessions, 50),
        target: 50,
        completed: user.stats.totalSessions >= 50,
        reward: '500 XP + Badge'
      },
      {
        id: 'perfect-score',
        name: 'Perfect Performance',
        description: 'Achieve a perfect score (100%)',
        category: 'performance',
        progress: sessions.filter(s => s.score === 100).length > 0 ? 1 : 0,
        target: 1,
        completed: sessions.some(s => s.score === 100),
        reward: '300 XP'
      },
      {
        id: 'all-games',
        name: 'Game Master',
        description: 'Play all 8 cognitive games',
        category: 'exploration',
        progress: new Set(sessions.map(s => s.gameType)).size,
        target: 8,
        completed: new Set(sessions.map(s => s.gameType)).size >= 8,
        reward: '400 XP + Title'
      }
    ];

    // Add earned badges from user profile
    const earnedBadges = user.badges.map(badge => ({
      ...badge,
      completed: true,
      earnedAt: badge.earnedAt
    }));

    res.json({
      success: true,
      achievements,
      earnedBadges,
      totalAchievements: achievements.length,
      completedAchievements: achievements.filter(a => a.completed).length,
      totalXP: user.xp,
      currentLevel: user.level
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/feedback
// @desc    Submit user feedback
// @access  Private
router.post('/feedback', auth, async (req, res) => {
  try {
    const { type, message, rating } = req.body;
    
    // In a real app, you'd save this to a Feedback model
    // For now, we'll just log it and return success
    console.log('User feedback received:', {
      userId: req.user.id,
      type,
      message,
      rating,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;