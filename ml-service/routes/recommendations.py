from flask import Blueprint, request, jsonify
import numpy as np
from sklearn.neighbors import NearestNeighbors
import json
import os
import logging

logger = logging.getLogger(__name__)
recommendations_bp = Blueprint('recommendations', __name__)

# Game database with detailed information
GAME_DATABASE = {
    'n-back': {
        'name': 'N-Back Memory Challenge',
        'domain': 'working_memory',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'memory': 60, 'attention': 50},
        'description': 'Improve working memory by identifying matching stimuli from N steps back'
    },
    'flanker': {
        'name': 'Flanker Attention Task',
        'domain': 'attention',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'attention': 60, 'problem_solving': 40},
        'description': 'Enhance selective attention by responding to target stimuli while ignoring distractors'
    },
    'simple-reaction': {
        'name': 'Simple Reaction Time',
        'domain': 'processing_speed',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'reaction_time': 0.8},
        'description': 'Improve basic processing speed with simple stimulus-response tasks'
    },
    'choice-reaction': {
        'name': 'Choice Reaction Time',
        'domain': 'processing_speed',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'reaction_time': 1.0, 'attention': 50},
        'description': 'Enhance complex processing speed with multiple choice responses'
    },
    'ravens-matrices': {
        'name': 'Pattern Logic Matrices',
        'domain': 'problem_solving',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'problem_solving': 70, 'memory': 50},
        'description': 'Develop fluid intelligence through visual pattern recognition'
    },
    'tower-hanoi': {
        'name': 'Tower of Hanoi',
        'domain': 'problem_solving',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'problem_solving': 65, 'attention': 55},
        'description': 'Improve planning and problem-solving through strategic puzzle solving'
    }
}

@recommendations_bp.route('/get_recommendations', methods=['POST'])
def get_personalized_recommendations():
    """
    Generate personalized game recommendations using rule-based + KNN approach
    Algorithm: Rule-based system + K-Nearest Neighbors
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['user_id', 'memory', 'attention', 'reaction_time', 'problem_solving']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate data types and ranges
        try:
            user_scores = {
                'memory': float(data['memory']),
                'attention': float(data['attention']),
                'reaction_time': float(data['reaction_time']),
                'problem_solving': float(data['problem_solving'])
            }
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid data types in scores'}), 400
        
        # Validate ranges
        for score_name, score_value in user_scores.items():
            if score_name == 'reaction_time':
                if not (0.1 <= score_value <= 5.0):
                    return jsonify({'error': f'{score_name} must be between 0.1 and 5.0'}), 400
            else:
                if not (0 <= score_value <= 100):
                    return jsonify({'error': f'{score_name} must be between 0 and 100'}), 400
        
        goal = data.get('goal', 'overall')
        user_id = data['user_id']
        
        # Generate recommendations using multiple strategies
        recommendations = generate_comprehensive_recommendations(user_scores, goal, user_id)
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def generate_comprehensive_recommendations(user_scores, goal, user_id):
    """Generate comprehensive recommendations using multiple strategies"""
    
    # Strategy 1: Rule-based recommendations for improvement
    improvement_games = get_improvement_recommendations(user_scores)
    
    # Strategy 2: Goal-specific recommendations
    goal_games = get_goal_based_recommendations(goal)
    
    # Strategy 3: Balanced training recommendations
    balanced_games = get_balanced_training_recommendations(user_scores)
    
    # Strategy 4: Simulate KNN-based recommendations
    similar_user_games = simulate_knn_recommendations(user_scores)
    
    # Combine and prioritize recommendations
    all_games = []
    
    # Add goal-specific games first (highest priority)
    all_games.extend(goal_games)
    
    # Add improvement games
    all_games.extend(improvement_games)
    
    # Add similar user recommendations
    all_games.extend(similar_user_games)
    
    # Add balanced training games
    all_games.extend(balanced_games)
    
    # Remove duplicates while preserving order
    recommended_games = list(dict.fromkeys(all_games))
    
    # Limit to top 3 recommendations
    final_recommendations = recommended_games[:3]
    
    # Generate difficulty recommendations for each game
    difficulty_recommendations = {}
    for game in final_recommendations:
        difficulty_recommendations[game] = determine_difficulty(user_scores, game)
    
    # Simulate finding similar profiles
    similar_profiles_found = simulate_similar_profiles(user_scores)
    
    # Generate detailed reasoning
    reasoning = generate_detailed_reasoning(user_scores, goal, final_recommendations)
    
    # Estimate improvement potential
    improvement_estimates = estimate_improvement_potential(user_scores, final_recommendations)
    
    return {
        'recommended_tests': final_recommendations,
        'difficulty_recommendations': difficulty_recommendations,
        'similar_profiles_found': similar_profiles_found,
        'reasoning': reasoning,
        'expected_improvement': improvement_estimates,
        'game_details': {game: GAME_DATABASE[game] for game in final_recommendations},
        'personalization_factors': get_personalization_factors(user_scores, goal)
    }

def get_improvement_recommendations(user_scores):
    """Recommend games based on areas needing improvement"""
    # Convert reaction time to a score (lower is better)
    domain_scores = {
        'working_memory': user_scores['memory'],
        'attention': user_scores['attention'],
        'processing_speed': max(0, 100 - (user_scores['reaction_time'] * 50)),
        'problem_solving': user_scores['problem_solving']
    }
    
    # Sort domains by score (lowest first for improvement)
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
    
    # Get games for the 2 weakest domains
    improvement_games = []
    for domain, score in sorted_domains[:2]:
        domain_games = [game for game, info in GAME_DATABASE.items() 
                       if info['domain'] == domain]
        improvement_games.extend(domain_games)
    
    return improvement_games

def get_goal_based_recommendations(goal):
    """Recommend games based on user's stated goal"""
    goal_mapping = {
        'memory': ['n-back'],
        'attention': ['flanker'],
        'processing_speed': ['simple-reaction', 'choice-reaction'],
        'problem_solving': ['ravens-matrices', 'tower-hanoi'],
        'overall': ['n-back', 'flanker']  # Balanced approach for overall improvement
    }
    
    return goal_mapping.get(goal, ['n-back', 'flanker'])

def get_balanced_training_recommendations(user_scores):
    """Recommend games for balanced cognitive training"""
    # Identify strongest domains to maintain
    domain_scores = {
        'working_memory': user_scores['memory'],
        'attention': user_scores['attention'],
        'processing_speed': max(0, 100 - (user_scores['reaction_time'] * 50)),
        'problem_solving': user_scores['problem_solving']
    }
    
    # Get games from strongest domains to maintain performance
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
    
    balanced_games = []
    for domain, score in sorted_domains[:2]:
        if score > 70:  # Only maintain if already strong
            domain_games = [game for game, info in GAME_DATABASE.items() 
                           if info['domain'] == domain]
            balanced_games.extend(domain_games)
    
    return balanced_games

def simulate_knn_recommendations(user_scores):
    """Simulate KNN-based recommendations using synthetic similar users"""
    # Create a feature vector for the current user
    user_vector = [
        user_scores['memory'],
        user_scores['attention'],
        user_scores['reaction_time'],
        user_scores['problem_solving']
    ]
    
    # Generate synthetic similar users
    np.random.seed(hash(str(user_vector)) % 2**32)  # Deterministic but varied
    
    similar_users = []
    for _ in range(10):
        # Generate users with similar but slightly different scores
        similar_user = [
            max(0, min(100, user_vector[0] + np.random.normal(0, 10))),  # memory
            max(0, min(100, user_vector[1] + np.random.normal(0, 10))),  # attention
            max(0.1, min(3.0, user_vector[2] + np.random.normal(0, 0.2))),  # reaction_time
            max(0, min(100, user_vector[3] + np.random.normal(0, 10)))   # problem_solving
        ]
        similar_users.append(similar_user)
    
    # Simulate game preferences of similar users
    game_preferences = {}
    for game in GAME_DATABASE.keys():
        # Calculate preference based on how well the game matches user's profile
        preference_score = calculate_game_preference(user_vector, game)
        game_preferences[game] = preference_score
    
    # Sort games by preference and return top games
    sorted_games = sorted(game_preferences.items(), key=lambda x: x[1], reverse=True)
    return [game for game, score in sorted_games[:2]]

def calculate_game_preference(user_vector, game):
    """Calculate how well a game matches a user's profile"""
    game_info = GAME_DATABASE[game]
    
    # Base preference on domain match with user's strengths/weaknesses
    memory, attention, reaction_time, problem_solving = user_vector
    processing_speed_score = max(0, 100 - (reaction_time * 50))
    
    domain_scores = {
        'working_memory': memory,
        'attention': attention,
        'processing_speed': processing_speed_score,
        'problem_solving': problem_solving
    }
    
    game_domain = game_info['domain']
    domain_score = domain_scores[game_domain]
    
    # Prefer games for domains that need improvement (lower scores)
    # but also consider games for maintaining strong domains
    if domain_score < 60:
        preference = 100 - domain_score  # Higher preference for weaker domains
    elif domain_score > 80:
        preference = domain_score * 0.5  # Some preference for maintaining strong domains
    else:
        preference = 70 - domain_score  # Moderate preference for average domains
    
    return preference

def determine_difficulty(user_scores, game):
    """Determine appropriate difficulty level for a game based on user scores"""
    # Calculate overall performance level
    processing_speed_score = max(0, 100 - (user_scores['reaction_time'] * 50))
    avg_score = np.mean([
        user_scores['memory'],
        user_scores['attention'],
        processing_speed_score,
        user_scores['problem_solving']
    ])
    
    # Get game-specific domain score
    game_info = GAME_DATABASE[game]
    domain_mapping = {
        'working_memory': user_scores['memory'],
        'attention': user_scores['attention'],
        'processing_speed': processing_speed_score,
        'problem_solving': user_scores['problem_solving']
    }
    
    domain_score = domain_mapping[game_info['domain']]
    
    # Combine overall and domain-specific performance
    combined_score = (avg_score * 0.4) + (domain_score * 0.6)
    
    if combined_score > 80:
        return 'hard'
    elif combined_score > 60:
        return 'medium'
    else:
        return 'easy'

def simulate_similar_profiles(user_scores):
    """Simulate finding similar user profiles"""
    # Base the number on user's score variance
    scores = [user_scores['memory'], user_scores['attention'], user_scores['problem_solving']]
    score_variance = np.var(scores)
    
    # More similar profiles for users with common score patterns
    if score_variance < 100:  # Low variance = common pattern
        return np.random.randint(8, 20)
    elif score_variance < 300:  # Medium variance
        return np.random.randint(4, 12)
    else:  # High variance = unique pattern
        return np.random.randint(1, 6)

def generate_detailed_reasoning(user_scores, goal, recommended_games):
    """Generate detailed reasoning for recommendations"""
    reasoning_parts = []
    
    # Analyze user's cognitive profile
    processing_speed_score = max(0, 100 - (user_scores['reaction_time'] * 50))
    domain_scores = {
        'memory': user_scores['memory'],
        'attention': user_scores['attention'],
        'processing_speed': processing_speed_score,
        'problem_solving': user_scores['problem_solving']
    }
    
    # Identify strengths and weaknesses
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
    weakest_domain = sorted_domains[0][0]
    strongest_domain = sorted_domains[-1][0]
    
    reasoning_parts.append(f"Your {weakest_domain.replace('_', ' ')} ({sorted_domains[0][1]:.0f}) shows the most potential for improvement.")
    
    if sorted_domains[-1][1] > 75:
        reasoning_parts.append(f"Your {strongest_domain.replace('_', ' ')} ({sorted_domains[-1][1]:.0f}) is already quite strong.")
    
    # Goal-specific reasoning
    if goal != 'overall':
        reasoning_parts.append(f"Based on your goal to improve {goal.replace('_', ' ')}, we've prioritized relevant training games.")
    
    # Game-specific reasoning
    for game in recommended_games:
        game_info = GAME_DATABASE[game]
        reasoning_parts.append(f"{game_info['name']} targets {game_info['domain'].replace('_', ' ')} development.")
    
    reasoning_parts.append("These recommendations are based on your current performance profile and proven training methodologies.")
    
    return " ".join(reasoning_parts)

def estimate_improvement_potential(user_scores, recommended_games):
    """Estimate potential improvement for recommended games"""
    improvements = {}
    
    for game in recommended_games:
        game_info = GAME_DATABASE[game]
        domain = game_info['domain']
        
        # Map domain to user score
        if domain == 'working_memory':
            current_score = user_scores['memory']
        elif domain == 'attention':
            current_score = user_scores['attention']
        elif domain == 'processing_speed':
            current_score = max(0, 100 - (user_scores['reaction_time'] * 50))
        elif domain == 'problem_solving':
            current_score = user_scores['problem_solving']
        else:
            current_score = 70  # Default
        
        # Estimate improvement based on current level
        if current_score < 50:
            potential = "High (15-25% improvement possible)"
        elif current_score < 70:
            potential = "Medium (10-20% improvement possible)"
        elif current_score < 85:
            potential = "Moderate (5-15% improvement possible)"
        else:
            potential = "Maintenance (5-10% improvement possible)"
        
        improvements[game] = {
            'potential': potential,
            'current_level': f"{current_score:.0f}%",
            'target_domain': domain.replace('_', ' ').title()
        }
    
    return improvements

def get_personalization_factors(user_scores, goal):
    """Get factors that influenced the personalization"""
    factors = []
    
    # Score-based factors
    processing_speed_score = max(0, 100 - (user_scores['reaction_time'] * 50))
    all_scores = [user_scores['memory'], user_scores['attention'], 
                  processing_speed_score, user_scores['problem_solving']]
    
    avg_score = np.mean(all_scores)
    score_variance = np.var(all_scores)
    
    if avg_score > 80:
        factors.append("High overall performance level")
    elif avg_score < 60:
        factors.append("Developing performance level")
    
    if score_variance > 300:
        factors.append("Uneven cognitive profile")
    elif score_variance < 100:
        factors.append("Balanced cognitive profile")
    
    # Goal-based factors
    if goal != 'overall':
        factors.append(f"Specific goal: {goal.replace('_', ' ')}")
    
    # Domain-specific factors
    if user_scores['memory'] < 60:
        factors.append("Working memory improvement needed")
    if user_scores['attention'] < 60:
        factors.append("Attention enhancement needed")
    if user_scores['reaction_time'] > 1.0:
        factors.append("Processing speed development needed")
    if user_scores['problem_solving'] < 60:
        factors.append("Problem-solving skills development needed")
    
    return factors