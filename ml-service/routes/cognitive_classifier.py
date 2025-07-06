from flask import Blueprint, request, jsonify
import numpy as np
from utils.ml_models import get_cognitive_classifier, get_scaler, get_label_encoder
import logging

logger = logging.getLogger(__name__)
cognitive_bp = Blueprint('cognitive', __name__)

@cognitive_bp.route('/classify_profile', methods=['POST'])
def classify_cognitive_profile():
    """
    Classify user's cognitive profile based on performance metrics
    Algorithm: Decision Tree Classifier
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['memory', 'attention', 'reaction_time', 'problem_solving', 'age']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Load models
        classifier = get_cognitive_classifier()
        scaler = get_scaler()
        label_encoder = get_label_encoder()
        
        if not all([classifier, scaler, label_encoder]):
            return jsonify({'error': 'Models not properly loaded'}), 500
        
        # Extract and validate features
        try:
            features = np.array([[
                float(data['memory']),
                float(data['attention']),
                float(data['reaction_time']),
                float(data['problem_solving']),
                int(data['age'])
            ]])
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid data types in input: {str(e)}'}), 400
        
        # Validate ranges
        if not (0 <= data['memory'] <= 100):
            return jsonify({'error': 'Memory score must be between 0 and 100'}), 400
        if not (0 <= data['attention'] <= 100):
            return jsonify({'error': 'Attention score must be between 0 and 100'}), 400
        if not (0.1 <= data['reaction_time'] <= 5.0):
            return jsonify({'error': 'Reaction time must be between 0.1 and 5.0 seconds'}), 400
        if not (0 <= data['problem_solving'] <= 100):
            return jsonify({'error': 'Problem solving score must be between 0 and 100'}), 400
        if not (13 <= data['age'] <= 120):
            return jsonify({'error': 'Age must be between 13 and 120'}), 400
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = classifier.predict(features_scaled)[0]
        probabilities = classifier.predict_proba(features_scaled)[0]
        
        # Get cognitive type
        cognitive_type = label_encoder.inverse_transform([prediction])[0]
        confidence = float(np.max(probabilities))
        
        # Generate characteristics based on scores
        characteristics = generate_characteristics(data)
        
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

def generate_characteristics(data):
    """Generate characteristics based on user scores"""
    characteristics = []
    
    if data['memory'] > 80:
        characteristics.append("Excellent working memory capacity")
    elif data['memory'] > 65:
        characteristics.append("Good working memory performance")
    elif data['memory'] < 50:
        characteristics.append("Working memory needs improvement")
    
    if data['attention'] > 75:
        characteristics.append("Strong attention control and focus")
    elif data['attention'] > 60:
        characteristics.append("Adequate attention abilities")
    elif data['attention'] < 50:
        characteristics.append("Attention skills could be enhanced")
    
    if data['reaction_time'] < 0.6:
        characteristics.append("Very fast processing speed")
    elif data['reaction_time'] < 0.9:
        characteristics.append("Good processing speed")
    elif data['reaction_time'] > 1.2:
        characteristics.append("Processing speed could be improved")
    
    if data['problem_solving'] > 80:
        characteristics.append("Advanced problem-solving abilities")
    elif data['problem_solving'] > 65:
        characteristics.append("Solid problem-solving skills")
    elif data['problem_solving'] < 50:
        characteristics.append("Problem-solving skills need development")
    
    # Age-related characteristics
    if data['age'] < 30:
        characteristics.append("Young adult cognitive profile")
    elif data['age'] > 60:
        characteristics.append("Mature adult cognitive profile")
    
    if not characteristics:
        characteristics = ["Balanced cognitive profile with room for improvement"]
    
    return characteristics

def get_domain_strengths(scores):
    """Identify user's cognitive domain strengths"""
    domains = {
        'Working Memory': scores['memory'],
        'Attention': scores['attention'],
        'Processing Speed': max(0, 100 - (scores['reaction_time'] * 50)),
        'Problem Solving': scores['problem_solving']
    }
    
    # Sort by score (highest first)
    sorted_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)
    
    strengths = []
    for domain, score in sorted_domains:
        if score > 70:
            strengths.append(domain)
    
    return strengths[:2] if strengths else [sorted_domains[0][0]]

def get_profile_recommendations(scores, cognitive_type):
    """Generate recommendations based on cognitive profile"""
    recommendations = []
    
    if cognitive_type == 'Expert':
        recommendations.append("Challenge yourself with the hardest difficulty levels")
        recommendations.append("Focus on maintaining consistency across all domains")
        recommendations.append("Consider helping others or teaching cognitive strategies")
    elif cognitive_type == 'Advanced':
        recommendations.append("Work on your weaker domains to reach expert level")
        recommendations.append("Increase training frequency for faster improvement")
        recommendations.append("Try mixed-domain training sessions")
    elif cognitive_type == 'Intermediate':
        recommendations.append("Focus on consistent daily practice")
        recommendations.append("Gradually increase difficulty as you improve")
        recommendations.append("Set specific improvement goals for each domain")
    else:  # Beginner
        recommendations.append("Start with easier games to build confidence")
        recommendations.append("Focus on one domain at a time for better results")
        recommendations.append("Establish a regular training routine")
    
    # Add specific recommendations based on weak areas
    if scores['memory'] < 60:
        recommendations.append("Prioritize working memory games like N-Back")
    if scores['attention'] < 60:
        recommendations.append("Practice attention games like Flanker tasks")
    if scores['reaction_time'] > 1.0:
        recommendations.append("Work on processing speed with reaction time games")
    if scores['problem_solving'] < 60:
        recommendations.append("Challenge yourself with logic puzzles and reasoning tasks")
    
    return recommendations[:5]  # Limit to 5 recommendations