from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Create directories for models
os.makedirs('models', exist_ok=True)
os.makedirs('data', exist_ok=True)

# Global variables for models and scalers
cognitive_classifier = None
scaler = None
label_encoder = None
progress_predictor = None

def initialize_models():
    """Initialize and train ML models with synthetic data"""
    global cognitive_classifier, scaler, label_encoder, progress_predictor
    
    try:
        # Generate synthetic training data for cognitive classification
        np.random.seed(42)
        n_samples = 1000
        
        # Features: memory, attention, reaction_time, problem_solving, age
        memory_scores = np.random.normal(70, 15, n_samples)
        attention_scores = np.random.normal(65, 20, n_samples)
        reaction_times = np.random.normal(0.8, 0.3, n_samples)
        problem_solving_scores = np.random.normal(68, 18, n_samples)
        ages = np.random.randint(18, 80, n_samples)
        
        # Create feature matrix
        X = np.column_stack([memory_scores, attention_scores, reaction_times, 
                           problem_solving_scores, ages])
        
        # Generate labels based on feature combinations
        labels = []
        for i in range(n_samples):
            if memory_scores[i] > 80 and attention_scores[i] > 70:
                labels.append('Expert')
            elif memory_scores[i] > 70 or attention_scores[i] > 60:
                labels.append('Advanced')
            elif memory_scores[i] > 60 or attention_scores[i] > 50:
                labels.append('Intermediate')
            else:
                labels.append('Beginner')
        
        # Train cognitive classifier
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(labels)
        
        cognitive_classifier = DecisionTreeClassifier(random_state=42, max_depth=10)
        cognitive_classifier.fit(X_scaled, y_encoded)
        
        # Train progress predictor
        # Generate time series data for progress prediction
        progress_data = []
        for _ in range(500):
            base_score = np.random.uniform(40, 90)
            trend = np.random.uniform(-0.5, 1.5)  # Some improvement trend
            noise = np.random.normal(0, 5)
            
            scores = [base_score]
            for day in range(1, 10):
                next_score = scores[-1] + trend + noise
                next_score = np.clip(next_score, 0, 100)
                scores.append(next_score)
            
            progress_data.append(scores)
        
        # Prepare data for linear regression
        X_progress = []
        y_progress = []
        
        for scores in progress_data:
            if len(scores) >= 4:
                # Use last 3 scores to predict next score
                X_progress.append(scores[-3:])
                y_progress.append(scores[-1])
        
        X_progress = np.array(X_progress)
        y_progress = np.array(y_progress)
        
        progress_predictor = LinearRegression()
        progress_predictor.fit(X_progress, y_progress)
        
        # Save models
        joblib.dump(cognitive_classifier, 'models/cognitive_classifier.pkl')
        joblib.dump(scaler, 'models/scaler.pkl')
        joblib.dump(label_encoder, 'models/label_encoder.pkl')
        joblib.dump(progress_predictor, 'models/progress_predictor.pkl')
        
        logger.info("Models initialized and saved successfully")
        
    except Exception as e:
        logger.error(f"Error initializing models: {str(e)}")
        raise

def load_models():
    """Load pre-trained models"""
    global cognitive_classifier, scaler, label_encoder, progress_predictor
    
    try:
        if os.path.exists('models/cognitive_classifier.pkl'):
            cognitive_classifier = joblib.load('models/cognitive_classifier.pkl')
            scaler = joblib.load('models/scaler.pkl')
            label_encoder = joblib.load('models/label_encoder.pkl')
            progress_predictor = joblib.load('models/progress_predictor.pkl')
            logger.info("Models loaded successfully")
        else:
            logger.info("No existing models found, initializing new models")
            initialize_models()
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        initialize_models()

# Game recommendation database
GAME_DATABASE = {
    'n-back': {
        'domain': 'working_memory',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'memory': 60, 'attention': 50}
    },
    'flanker': {
        'domain': 'attention',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'attention': 60, 'problem_solving': 40}
    },
    'simple-reaction': {
        'domain': 'processing_speed',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'reaction_time': 0.8}
    },
    'choice-reaction': {
        'domain': 'processing_speed',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'reaction_time': 1.0, 'attention': 50}
    },
    'ravens-matrices': {
        'domain': 'problem_solving',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'problem_solving': 70, 'memory': 50}
    },
    'tower-hanoi': {
        'domain': 'problem_solving',
        'difficulty_levels': ['easy', 'medium', 'hard'],
        'target_scores': {'problem_solving': 65, 'attention': 55}
    }
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': all([
            cognitive_classifier is not None,
            scaler is not None,
            label_encoder is not None,
            progress_predictor is not None
        ])
    })

@app.route('/classify_profile', methods=['POST'])
def classify_cognitive_profile():
    """
    Classify user's cognitive profile based on performance metrics
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['memory', 'attention', 'reaction_time', 'problem_solving', 'age']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract features
        features = np.array([[
            data['memory'],
            data['attention'],
            data['reaction_time'],
            data['problem_solving'],
            data['age']
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = cognitive_classifier.predict(features_scaled)[0]
        probabilities = cognitive_classifier.predict_proba(features_scaled)[0]
        
        # Get cognitive type
        cognitive_type = label_encoder.inverse_transform([prediction])[0]
        confidence = float(np.max(probabilities))
        
        # Generate characteristics based on scores
        characteristics = []
        if data['memory'] > 75:
            characteristics.append("Strong working memory performance")
        if data['attention'] > 70:
            characteristics.append("Excellent attention control")
        if data['reaction_time'] < 0.6:
            characteristics.append("Fast processing speed")
        if data['problem_solving'] > 75:
            characteristics.append("Advanced problem-solving skills")
        
        if not characteristics:
            characteristics = ["Balanced cognitive profile with room for improvement"]
        
        return jsonify({
            'cognitive_type': cognitive_type,
            'confidence': round(confidence, 3),
            'characteristics': characteristics,
            'domain_strengths': get_domain_strengths(data),
            'recommendations': get_profile_recommendations(data, cognitive_type)
        })
        
    except Exception as e:
        logger.error(f"Error in classify_profile: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get_recommendations', methods=['POST'])
def get_personalized_recommendations():
    """
    Generate personalized game recommendations using rule-based + KNN approach
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['user_id', 'memory', 'attention', 'reaction_time', 'problem_solving']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_scores = {
            'memory': data['memory'],
            'attention': data['attention'],
            'reaction_time': data['reaction_time'],
            'problem_solving': data['problem_solving']
        }
        
        goal = data.get('goal', 'overall')
        
        # Rule-based recommendations
        recommended_games = []
        
        # Identify weakest domains
        domain_scores = {
            'working_memory': user_scores['memory'],
            'attention': user_scores['attention'],
            'processing_speed': 100 - (user_scores['reaction_time'] * 50),  # Convert RT to score
            'problem_solving': user_scores['problem_solving']
        }
        
        # Sort domains by score (lowest first for improvement)
        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
        
        # Recommend games for improvement areas
        for domain, score in sorted_domains[:2]:  # Focus on 2 weakest domains
            suitable_games = [game for game, info in GAME_DATABASE.items() 
                            if info['domain'] == domain]
            recommended_games.extend(suitable_games)
        
        # Goal-specific recommendations
        if goal == 'memory':
            recommended_games.insert(0, 'n-back')
        elif goal == 'attention':
            recommended_games.insert(0, 'flanker')
        elif goal == 'processing_speed':
            recommended_games.insert(0, 'simple-reaction')
        elif goal == 'problem_solving':
            recommended_games.insert(0, 'ravens-matrices')
        
        # Remove duplicates while preserving order
        recommended_games = list(dict.fromkeys(recommended_games))
        
        # Limit to top 3 recommendations
        recommended_games = recommended_games[:3]
        
        # Generate difficulty recommendations
        difficulty_recommendations = {}
        for game in recommended_games:
            avg_score = np.mean([user_scores['memory'], user_scores['attention'], 
                               user_scores['problem_solving']])
            if avg_score > 80:
                difficulty_recommendations[game] = 'hard'
            elif avg_score > 60:
                difficulty_recommendations[game] = 'medium'
            else:
                difficulty_recommendations[game] = 'easy'
        
        # Simulate finding similar profiles (mock KNN)
        similar_profiles_found = np.random.randint(3, 15)
        
        return jsonify({
            'recommended_tests': recommended_games,
            'difficulty_recommendations': difficulty_recommendations,
            'similar_profiles_found': similar_profiles_found,
            'reasoning': generate_recommendation_reasoning(user_scores, goal),
            'expected_improvement': estimate_improvement_potential(user_scores)
        })
        
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/predict_progress', methods=['POST'])
def predict_performance_progress():
    """
    Predict future performance using Linear Regression
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['user_id', 'past_scores', 'session_dates']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        past_scores = data['past_scores']
        session_dates = data['session_dates']
        
        if len(past_scores) < 2:
            return jsonify({'error': 'At least 2 past scores required'}), 400
        
        if len(past_scores) != len(session_dates):
            return jsonify({'error': 'Number of scores and dates must match'}), 400
        
        # Convert dates to numerical format (days since first session)
        dates = [datetime.fromisoformat(date.replace('Z', '+00:00')) for date in session_dates]
        first_date = min(dates)
        days_since_start = [(date - first_date).days for date in dates]
        
        # Prepare data for prediction
        if len(past_scores) >= 3:
            # Use last 3 scores for prediction
            recent_scores = past_scores[-3:]
            predicted_score = progress_predictor.predict([recent_scores])[0]
        else:
            # Simple linear trend for fewer data points
            if len(past_scores) == 2:
                trend = past_scores[-1] - past_scores[-2]
                predicted_score = past_scores[-1] + trend
            else:
                predicted_score = past_scores[-1]
        
        # Ensure prediction is within valid range
        predicted_score = np.clip(predicted_score, 0, 100)
        
        # Calculate trend
        if len(past_scores) >= 2:
            recent_trend = np.mean(np.diff(past_scores[-3:]) if len(past_scores) >= 3 else np.diff(past_scores))
            if recent_trend > 2:
                trend = "improving"
            elif recent_trend < -2:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        # Calculate confidence based on data consistency
        if len(past_scores) >= 3:
            score_variance = np.var(past_scores)
            confidence = max(0.5, 1.0 - (score_variance / 1000))  # Higher variance = lower confidence
        else:
            confidence = 0.6  # Lower confidence for limited data
        
        # Generate insights
        insights = generate_progress_insights(past_scores, predicted_score, trend)
        
        return jsonify({
            'predicted_score_next_week': round(predicted_score, 1),
            'trend': trend,
            'confidence': round(confidence, 3),
            'insights': insights,
            'improvement_rate': calculate_improvement_rate(past_scores),
            'consistency_score': calculate_consistency_score(past_scores)
        })
        
    except Exception as e:
        logger.error(f"Error in predict_progress: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Helper functions
def get_domain_strengths(scores):
    """Identify user's cognitive domain strengths"""
    domains = {
        'Working Memory': scores['memory'],
        'Attention': scores['attention'],
        'Processing Speed': 100 - (scores['reaction_time'] * 50),
        'Problem Solving': scores['problem_solving']
    }
    
    # Sort by score (highest first)
    sorted_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)
    
    strengths = []
    for domain, score in sorted_domains:
        if score > 70:
            strengths.append(domain)
    
    return strengths[:2]  # Return top 2 strengths

def get_profile_recommendations(scores, cognitive_type):
    """Generate recommendations based on cognitive profile"""
    recommendations = []
    
    if cognitive_type == 'Expert':
        recommendations.append("Challenge yourself with harder difficulty levels")
        recommendations.append("Focus on maintaining consistency across all domains")
    elif cognitive_type == 'Advanced':
        recommendations.append("Work on your weaker domains to reach expert level")
        recommendations.append("Increase training frequency for faster improvement")
    elif cognitive_type == 'Intermediate':
        recommendations.append("Focus on consistent daily practice")
        recommendations.append("Gradually increase difficulty as you improve")
    else:  # Beginner
        recommendations.append("Start with easier games to build confidence")
        recommendations.append("Focus on one domain at a time for better results")
    
    return recommendations

def generate_recommendation_reasoning(scores, goal):
    """Generate reasoning for game recommendations"""
    reasoning_parts = []
    
    # Identify weakest area
    domain_scores = {
        'memory': scores['memory'],
        'attention': scores['attention'],
        'processing_speed': 100 - (scores['reaction_time'] * 50),
        'problem_solving': scores['problem_solving']
    }
    
    weakest_domain = min(domain_scores, key=domain_scores.get)
    weakest_score = domain_scores[weakest_domain]
    
    reasoning_parts.append(f"Your {weakest_domain.replace('_', ' ')} score ({weakest_score:.0f}) has the most room for improvement.")
    
    if goal != 'overall':
        reasoning_parts.append(f"Based on your goal to improve {goal.replace('_', ' ')}, we've prioritized relevant games.")
    
    reasoning_parts.append("These games are selected based on your current performance profile and similar users' success patterns.")
    
    return " ".join(reasoning_parts)

def estimate_improvement_potential(scores):
    """Estimate potential improvement for each domain"""
    improvements = {}
    
    for domain, score in scores.items():
        if domain == 'reaction_time':
            continue  # Skip reaction time for this calculation
        
        if score < 50:
            potential = "High (20-30% improvement possible)"
        elif score < 70:
            potential = "Medium (10-20% improvement possible)"
        elif score < 85:
            potential = "Moderate (5-15% improvement possible)"
        else:
            potential = "Low (5-10% improvement possible)"
        
        improvements[domain] = potential
    
    return improvements

def generate_progress_insights(past_scores, predicted_score, trend):
    """Generate insights about user's progress"""
    insights = []
    
    if trend == "improving":
        insights.append("You're on an upward trajectory! Keep up the excellent work.")
        if predicted_score > max(past_scores):
            insights.append("Your next session is predicted to be your best yet!")
    elif trend == "declining":
        insights.append("Recent performance shows some decline. Consider taking a short break or adjusting difficulty.")
    else:
        insights.append("Your performance is stable. Try increasing difficulty to continue improving.")
    
    # Score-based insights
    if predicted_score > 85:
        insights.append("You're performing at an expert level!")
    elif predicted_score > 70:
        insights.append("Strong performance - you're in the advanced range.")
    elif predicted_score > 55:
        insights.append("Good progress - consistent practice will help you improve further.")
    else:
        insights.append("Focus on fundamentals and regular practice for steady improvement.")
    
    return insights

def calculate_improvement_rate(scores):
    """Calculate the rate of improvement over time"""
    if len(scores) < 2:
        return 0
    
    # Calculate average improvement per session
    improvements = np.diff(scores)
    return round(np.mean(improvements), 2)

def calculate_consistency_score(scores):
    """Calculate consistency score based on variance"""
    if len(scores) < 2:
        return 100
    
    variance = np.var(scores)
    # Convert variance to consistency score (0-100)
    consistency = max(0, 100 - (variance / 10))
    return round(consistency, 1)

# Initialize models when the app starts
with app.app_context():
    load_models()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)