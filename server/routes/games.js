const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Game definitions with research citations
const GAMES = {
  'n-back': {
    id: 'n-back',
    name: 'Stellar Memory Challenge',
    description: 'Test your working memory by identifying when stimuli match those from N steps back',
    domain: 'working_memory',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 300, // 5 minutes
    instructions: 'Watch the sequence of stimuli and press the button when the current stimulus matches the one from N positions back.',
    researchCitation: 'Kirchner, W. K. (1958). Age differences in short-term retention of rapidly changing information. Journal of Experimental Psychology, 55(4), 352-358.',
    metrics: ['accuracy', 'dPrime', 'criterion', 'reactionTime'],
    icon: '🌟'
  },
  'dual-task': {
    id: 'dual-task',
    name: 'Mental Juggler',
    description: 'Perform two cognitive tasks simultaneously to measure working memory capacity',
    domain: 'working_memory',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 240,
    instructions: 'Perform both the primary and secondary tasks as accurately as possible.',
    researchCitation: 'Baddeley, A., & Hitch, G. (1974). Working memory. Psychology of Learning and Motivation, 8, 47-89.',
    metrics: ['primaryAccuracy', 'secondaryAccuracy', 'dualTaskCost'],
    icon: '🤹'
  },
  'flanker': {
    id: 'flanker',
    name: 'Arrow Focus Challenge',
    description: 'Identify the direction of a central arrow while ignoring distracting flanker arrows',
    domain: 'attention',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 180,
    instructions: 'Respond to the direction of the central arrow, ignoring the surrounding arrows.',
    researchCitation: 'Eriksen, B. A., & Eriksen, C. W. (1974). Effects of noise letters upon the identification of a target letter in a nonsearch task. Perception & Psychophysics, 16(1), 143-149.',
    metrics: ['accuracy', 'congruentRT', 'incongruentRT', 'flankerEffect'],
    icon: '🏹'
  },
  'attention-network': {
    id: 'attention-network',
    name: 'Attention Network Analyzer',
    description: 'Comprehensive test measuring alerting, orienting, and executive attention networks',
    domain: 'attention',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 420,
    instructions: 'Respond to the direction of the central arrow. Use cues when provided.',
    researchCitation: 'Fan, J., McCandliss, B. D., Sommer, T., Raz, A., & Posner, M. I. (2002). Testing the efficiency and independence of attentional networks. Journal of Cognitive Neuroscience, 14(3), 340-347.',
    metrics: ['alertingEffect', 'orientingEffect', 'executiveEffect', 'overallRT'],
    icon: '🎯'
  },
  'simple-reaction': {
    id: 'simple-reaction',
    name: 'Lightning Reflex',
    description: 'Measure your basic processing speed with simple reaction time tasks',
    domain: 'processing_speed',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 120,
    instructions: 'Press the button as quickly as possible when you see the stimulus.',
    researchCitation: 'Donders, F. C. (1969). On the speed of mental processes. Acta Psychologica, 30, 412-431.',
    metrics: ['meanRT', 'medianRT', 'variabilityRT'],
    icon: '⚡'
  },
  'choice-reaction': {
    id: 'choice-reaction',
    name: 'Quick Decision Maker',
    description: 'Test choice reaction time across different levels of complexity (Hick\'s Law)',
    domain: 'processing_speed',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 200,
    instructions: 'Choose the correct response for each stimulus as quickly and accurately as possible.',
    researchCitation: 'Hick, W. E. (1952). On the rate of gain of information. Quarterly Journal of Experimental Psychology, 4(1), 11-26.',
    metrics: ['accuracy', 'meanRT', 'hicksLawSlope', 'complexity'],
    icon: '🎲'
  },
  'ravens-matrices': {
    id: 'ravens-matrices',
    name: 'Pattern Logic Challenge',
    description: 'Solve visual pattern puzzles to measure fluid intelligence and reasoning',
    domain: 'problem_solving',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 600,
    instructions: 'Study the pattern and select the missing piece that completes the sequence.',
    researchCitation: 'Raven, J. C. (1938). Progressive Matrices: A Perceptual Test of Intelligence. London: H.K. Lewis.',
    metrics: ['accuracy', 'problemsSolved', 'averageTimePerProblem'],
    icon: '🧩'
  },
  'tower-hanoi': {
    id: 'tower-hanoi',
    name: 'Tower Puzzle Master',
    description: 'Plan and execute moves to solve the classic Tower of Hanoi puzzle',
    domain: 'problem_solving',
    difficulties: ['easy', 'medium', 'hard'],
    estimatedDuration: 480,
    instructions: 'Move all disks to the target peg following the rules: only one disk at a time, never place a larger disk on a smaller one.',
    researchCitation: 'Shallice, T. (1982). Specific impairments of planning. Philosophical Transactions of the Royal Society B, 298(1089), 199-209.',
    metrics: ['moves', 'optimalMoves', 'efficiency', 'planningTime'],
    icon: '🗼'
  }
};

// @route   GET /api/games
// @desc    Get all available games
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const { domain, difficulty } = req.query;
    
    let games = Object.values(GAMES);
    
    // Filter by domain if specified
    if (domain) {
      games = games.filter(game => game.domain === domain);
    }
    
    // Filter by difficulty if specified
    if (difficulty) {
      games = games.filter(game => game.difficulties.includes(difficulty));
    }

    res.json({
      success: true,
      games,
      totalGames: games.length,
      domains: ['working_memory', 'attention', 'processing_speed', 'problem_solving']
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/games/:gameId
// @desc    Get specific game details
// @access  Private
router.get('/:gameId', auth, (req, res) => {
  try {
    const game = GAMES[req.params.gameId];
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/games/:gameId/config
// @desc    Get game configuration for specific difficulty
// @access  Private
router.get('/:gameId/config', auth, (req, res) => {
  try {
    const { difficulty = 'medium' } = req.query;
    const game = GAMES[req.params.gameId];
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (!game.difficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level' });
    }

    // Generate game-specific configuration based on difficulty
    const config = generateGameConfig(req.params.gameId, difficulty);

    res.json({
      success: true,
      config: {
        ...config,
        gameId: req.params.gameId,
        difficulty,
        estimatedDuration: game.estimatedDuration
      }
    });
  } catch (error) {
    console.error('Get game config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate game-specific configurations
function generateGameConfig(gameId, difficulty) {
  const difficultyMultipliers = {
    easy: 0.7,
    medium: 1.0,
    hard: 1.4
  };
  
  const multiplier = difficultyMultipliers[difficulty];
  
  switch (gameId) {
    case 'n-back':
      return {
        nLevel: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        trials: Math.floor(20 * multiplier),
        stimulusDuration: Math.floor(500 / multiplier),
        interstimulus: Math.floor(2500 / multiplier)
      };
      
    case 'dual-task':
      return {
        primaryTaskComplexity: difficulty === 'easy' ? 'low' : difficulty === 'medium' ? 'medium' : 'high',
        secondaryTaskFrequency: Math.floor(3 * multiplier),
        trials: Math.floor(30 * multiplier)
      };
      
    case 'flanker':
      return {
        trials: Math.floor(40 * multiplier),
        congruentRatio: difficulty === 'easy' ? 0.7 : 0.5,
        stimulusDuration: Math.floor(1000 / multiplier),
        responseWindow: Math.floor(2000 / multiplier)
      };
      
    case 'attention-network':
      return {
        trials: Math.floor(48 * multiplier),
        cueTypes: ['none', 'center', 'spatial'],
        flankerTypes: ['congruent', 'incongruent', 'neutral'],
        cueDuration: 100,
        stimulusDuration: Math.floor(1700 / multiplier)
      };
      
    case 'simple-reaction':
      return {
        trials: Math.floor(30 * multiplier),
        minInterval: Math.floor(1000 / multiplier),
        maxInterval: Math.floor(4000 / multiplier),
        stimulusTypes: difficulty === 'easy' ? ['visual'] : ['visual', 'auditory']
      };
      
    case 'choice-reaction':
      return {
        trials: Math.floor(40 * multiplier),
        choiceOptions: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 8,
        stimulusMapping: 'spatial',
        responseDeadline: Math.floor(3000 / multiplier)
      };
      
    case 'ravens-matrices':
      return {
        problems: Math.floor(12 * multiplier),
        timeLimit: Math.floor(600 / multiplier), // seconds per problem
        matrixSize: difficulty === 'easy' ? '2x2' : difficulty === 'medium' ? '3x3' : '3x3_complex',
        distractors: difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8
      };
      
    case 'tower-hanoi':
      return {
        disks: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5,
        timeLimit: Math.floor(300 * multiplier),
        showOptimalMoves: difficulty === 'easy',
        hintsAvailable: difficulty !== 'hard'
      };
      
    default:
      return {
        difficulty,
        trials: Math.floor(20 * multiplier),
        timeLimit: Math.floor(300 * multiplier)
      };
  }
}

module.exports = router;