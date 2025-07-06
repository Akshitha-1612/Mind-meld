from flask import Blueprint, request, jsonify
import numpy as np
from datetime import datetime, timedelta
from utils.ml_models import get_progress_predictor
import logging

logger = logging.getLogger(__name__)
progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/predict_progress', methods=['POST'])
def predict_performance_progress():
    """
    Predict future performance using Linear Regression
    Algorithm: Linear Regression with trend analysis
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
        user_id = data['user_id']
        
        # Validate data
        if len(past_scores) < 2:
            return jsonify({'error': 'At least 2 past scores required for prediction'}), 400
        
        if len(past_scores) != len(session_dates):
            return jsonify({'error': 'Number of scores and dates must match'}), 400
        
        # Validate score values
        for i, score in enumerate(past_scores):
            try:
                score_val = float(score)
                if not (0 <= score_val <= 100):
                    return jsonify({'error': f'Score {i+1} must be between 0 and 100'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Invalid score value at position {i+1}'}), 400
        
        # Convert to numpy array
        scores_array = np.array([float(score) for score in past_scores])
        
        # Parse and validate dates
        try:
            dates = []
            for date_str in session_dates:
                # Handle different date formats
                if 'T' in date_str:
                    date_str = date_str.split('T')[0]
                dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
        except ValueError as e:
            return jsonify({'error': f'Invalid date format. Use YYYY-MM-DD: {str(e)}'}), 400
        
        # Generate comprehensive prediction
        prediction_result = generate_comprehensive_prediction(scores_array, dates, user_id)
        
        return jsonify(prediction_result)
        
    except Exception as e:
        logger.error(f"Error in predict_progress: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def generate_comprehensive_prediction(scores, dates, user_id):
    """Generate comprehensive performance prediction with multiple methods"""
    
    # Method 1: Linear regression prediction
    linear_prediction = predict_with_linear_regression(scores)
    
    # Method 2: Trend-based prediction
    trend_prediction = predict_with_trend_analysis(scores)
    
    # Method 3: Moving average prediction
    moving_avg_prediction = predict_with_moving_average(scores)
    
    # Method 4: Weighted prediction combining all methods
    final_prediction = combine_predictions(linear_prediction, trend_prediction, moving_avg_prediction)
    
    # Ensure prediction is within valid range
    final_prediction = np.clip(final_prediction, 0, 100)
    
    # Calculate trend analysis
    trend_info = analyze_performance_trend(scores, dates)
    
    # Calculate confidence based on data quality
    confidence = calculate_prediction_confidence(scores, dates)
    
    # Generate insights
    insights = generate_progress_insights(scores, final_prediction, trend_info)
    
    # Calculate additional metrics
    improvement_rate = calculate_improvement_rate(scores, dates)
    consistency_score = calculate_consistency_score(scores)
    volatility = calculate_volatility(scores)
    
    # Generate recommendations
    recommendations = generate_progress_recommendations(scores, trend_info, final_prediction)
    
    return {
        'predicted_score_next_week': round(final_prediction, 1),
        'trend': trend_info['trend_direction'],
        'confidence': round(confidence, 3),
        'insights': insights,
        'improvement_rate': improvement_rate,
        'consistency_score': consistency_score,
        'volatility': round(volatility, 2),
        'trend_analysis': trend_info,
        'prediction_methods': {
            'linear_regression': round(linear_prediction, 1),
            'trend_based': round(trend_prediction, 1),
            'moving_average': round(moving_avg_prediction, 1),
            'final_weighted': round(final_prediction, 1)
        },
        'recommendations': recommendations,
        'data_quality': assess_data_quality(scores, dates)
    }

def predict_with_linear_regression(scores):
    """Predict using linear regression on the score sequence"""
    if len(scores) < 3:
        # Simple linear trend for limited data
        if len(scores) == 2:
            trend = scores[-1] - scores[-2]
            return scores[-1] + trend
        else:
            return scores[-1]
    
    # Use the global progress predictor if available
    predictor = get_progress_predictor()
    if predictor and len(scores) >= 3:
        try:
            recent_scores = scores[-3:].reshape(1, -1)
            prediction = predictor.predict(recent_scores)[0]
            return prediction
        except:
            pass
    
    # Fallback: simple linear regression
    x = np.arange(len(scores)).reshape(-1, 1)
    y = scores
    
    # Calculate linear regression manually
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    
    numerator = np.sum((x.flatten() - x_mean) * (y - y_mean))
    denominator = np.sum((x.flatten() - x_mean) ** 2)
    
    if denominator == 0:
        return scores[-1]
    
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    
    # Predict next value
    next_x = len(scores)
    prediction = slope * next_x + intercept
    
    return prediction

def predict_with_trend_analysis(scores):
    """Predict based on recent trend analysis"""
    if len(scores) < 2:
        return scores[-1]
    
    # Calculate recent trend (last 3-5 sessions)
    recent_window = min(5, len(scores))
    recent_scores = scores[-recent_window:]
    
    if len(recent_scores) >= 3:
        # Use linear trend on recent scores
        x = np.arange(len(recent_scores))
        trend = np.polyfit(x, recent_scores, 1)[0]
    else:
        # Simple difference for 2 scores
        trend = recent_scores[-1] - recent_scores[-2]
    
    # Apply trend with some dampening for stability
    dampening_factor = 0.7
    prediction = scores[-1] + (trend * dampening_factor)
    
    return prediction

def predict_with_moving_average(scores):
    """Predict using weighted moving average"""
    if len(scores) < 2:
        return scores[-1]
    
    # Use weighted moving average with more weight on recent scores
    window_size = min(4, len(scores))
    recent_scores = scores[-window_size:]
    
    # Create weights (more recent = higher weight)
    weights = np.array([i + 1 for i in range(len(recent_scores))])
    weights = weights / np.sum(weights)
    
    # Calculate weighted average
    weighted_avg = np.sum(recent_scores * weights)
    
    # Add small trend component
    if len(recent_scores) >= 2:
        trend = (recent_scores[-1] - recent_scores[0]) / len(recent_scores)
        prediction = weighted_avg + (trend * 0.5)
    else:
        prediction = weighted_avg
    
    return prediction

def combine_predictions(linear_pred, trend_pred, moving_avg_pred):
    """Combine multiple predictions with weighted average"""
    # Weights for different prediction methods
    weights = {
        'linear': 0.4,
        'trend': 0.35,
        'moving_avg': 0.25
    }
    
    combined = (weights['linear'] * linear_pred + 
                weights['trend'] * trend_pred + 
                weights['moving_avg'] * moving_avg_pred)
    
    return combined

def analyze_performance_trend(scores, dates):
    """Analyze performance trend over time"""
    if len(scores) < 2:
        return {
            'trend_direction': 'insufficient_data',
            'trend_strength': 0,
            'trend_consistency': 0
        }
    
    # Calculate overall trend
    x = np.arange(len(scores))
    trend_slope = np.polyfit(x, scores, 1)[0]
    
    # Determine trend direction
    if trend_slope > 1.5:
        trend_direction = "strongly_improving"
    elif trend_slope > 0.5:
        trend_direction = "improving"
    elif trend_slope > -0.5:
        trend_direction = "stable"
    elif trend_slope > -1.5:
        trend_direction = "declining"
    else:
        trend_direction = "strongly_declining"
    
    # Calculate trend strength (R-squared)
    y_pred = np.polyval([trend_slope, np.mean(scores) - trend_slope * np.mean(x)], x)
    ss_res = np.sum((scores - y_pred) ** 2)
    ss_tot = np.sum((scores - np.mean(scores)) ** 2)
    
    if ss_tot == 0:
        trend_strength = 1.0
    else:
        trend_strength = max(0, 1 - (ss_res / ss_tot))
    
    # Calculate trend consistency (how consistent the direction is)
    if len(scores) >= 3:
        differences = np.diff(scores)
        positive_changes = np.sum(differences > 0)
        negative_changes = np.sum(differences < 0)
        total_changes = len(differences)
        
        if total_changes == 0:
            trend_consistency = 1.0
        else:
            trend_consistency = max(positive_changes, negative_changes) / total_changes
    else:
        trend_consistency = 1.0
    
    return {
        'trend_direction': trend_direction,
        'trend_strength': round(trend_strength, 3),
        'trend_consistency': round(trend_consistency, 3),
        'slope': round(trend_slope, 3)
    }

def calculate_prediction_confidence(scores, dates):
    """Calculate confidence in the prediction based on data quality"""
    base_confidence = 0.5
    
    # Factor 1: Amount of data
    data_amount_factor = min(1.0, len(scores) / 10)  # More data = higher confidence
    
    # Factor 2: Data consistency (lower variance = higher confidence)
    if len(scores) > 1:
        score_variance = np.var(scores)
        consistency_factor = max(0.3, 1.0 - (score_variance / 1000))
    else:
        consistency_factor = 0.5
    
    # Factor 3: Recency of data
    if len(dates) > 1:
        time_gaps = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
        avg_gap = np.mean(time_gaps)
        recency_factor = max(0.5, 1.0 - (avg_gap / 30))  # Prefer recent, regular data
    else:
        recency_factor = 0.7
    
    # Factor 4: Trend stability
    if len(scores) >= 3:
        recent_trend = np.polyfit(range(len(scores)), scores, 1)[0]
        stability_factor = max(0.4, 1.0 - abs(recent_trend) / 20)
    else:
        stability_factor = 0.6
    
    # Combine factors
    confidence = (base_confidence + 
                 data_amount_factor * 0.2 + 
                 consistency_factor * 0.2 + 
                 recency_factor * 0.1 + 
                 stability_factor * 0.1)
    
    return min(1.0, confidence)

def generate_progress_insights(scores, predicted_score, trend_info):
    """Generate insights about user's progress"""
    insights = []
    
    current_score = scores[-1]
    trend_direction = trend_info['trend_direction']
    
    # Trend-based insights
    if trend_direction == "strongly_improving":
        insights.append("🚀 Excellent progress! You're on a strong upward trajectory.")
    elif trend_direction == "improving":
        insights.append("📈 Good progress! You're steadily improving.")
    elif trend_direction == "stable":
        insights.append("📊 Your performance is stable. Consider increasing challenge level.")
    elif trend_direction == "declining":
        insights.append("📉 Recent performance shows some decline. Consider adjusting your approach.")
    else:
        insights.append("⚠️ Significant decline detected. Take a break or reduce difficulty.")
    
    # Prediction-based insights
    score_change = predicted_score - current_score
    if score_change > 5:
        insights.append("🎯 Your next session is predicted to show significant improvement!")
    elif score_change > 2:
        insights.append("✨ Expecting modest improvement in your next session.")
    elif score_change < -5:
        insights.append("💪 Next session may be challenging. Focus on fundamentals.")
    
    # Performance level insights
    if predicted_score > 90:
        insights.append("🌟 You're performing at an expert level!")
    elif predicted_score > 80:
        insights.append("⭐ Excellent performance - you're in the advanced range.")
    elif predicted_score > 70:
        insights.append("👍 Good performance - you're above average.")
    elif predicted_score > 60:
        insights.append("📚 Solid progress - consistent practice will help you improve.")
    else:
        insights.append("🎯 Focus on fundamentals and regular practice for steady improvement.")
    
    # Consistency insights
    if len(scores) > 3:
        score_std = np.std(scores)
        if score_std < 5:
            insights.append("🎯 Your performance is very consistent!")
        elif score_std > 15:
            insights.append("🎲 Your performance varies significantly. Try to maintain consistency.")
    
    return insights

def calculate_improvement_rate(scores, dates):
    """Calculate the rate of improvement over time"""
    if len(scores) < 2:
        return 0
    
    # Calculate improvement per day
    total_days = (dates[-1] - dates[0]).days
    if total_days == 0:
        total_days = len(scores) - 1  # Fallback to session count
    
    total_improvement = scores[-1] - scores[0]
    improvement_per_day = total_improvement / max(1, total_days)
    
    return round(improvement_per_day, 3)

def calculate_consistency_score(scores):
    """Calculate consistency score based on variance"""
    if len(scores) < 2:
        return 100
    
    # Calculate coefficient of variation
    mean_score = np.mean(scores)
    std_score = np.std(scores)
    
    if mean_score == 0:
        return 0
    
    cv = std_score / mean_score
    
    # Convert to consistency score (0-100, higher is more consistent)
    consistency = max(0, 100 - (cv * 100))
    return round(consistency, 1)

def calculate_volatility(scores):
    """Calculate performance volatility"""
    if len(scores) < 2:
        return 0
    
    # Calculate average absolute change between consecutive sessions
    changes = np.abs(np.diff(scores))
    volatility = np.mean(changes)
    
    return volatility

def generate_progress_recommendations(scores, trend_info, predicted_score):
    """Generate recommendations based on progress analysis"""
    recommendations = []
    
    trend_direction = trend_info['trend_direction']
    current_score = scores[-1]
    
    # Trend-based recommendations
    if trend_direction in ["strongly_improving", "improving"]:
        recommendations.append("Keep up the excellent work! Your current approach is working well.")
        if current_score > 75:
            recommendations.append("Consider increasing difficulty to maintain challenge.")
    elif trend_direction == "stable":
        recommendations.append("Try varying your training routine to break through the plateau.")
        recommendations.append("Consider focusing on your weakest cognitive domains.")
    elif trend_direction in ["declining", "strongly_declining"]:
        recommendations.append("Take a short break to avoid burnout and return refreshed.")
        recommendations.append("Consider reducing difficulty temporarily to rebuild confidence.")
    
    # Performance level recommendations
    if predicted_score > 85:
        recommendations.append("You're performing excellently! Focus on maintaining consistency.")
    elif predicted_score < 60:
        recommendations.append("Focus on regular practice and gradual improvement.")
        recommendations.append("Set small, achievable goals to build momentum.")
    
    # Consistency recommendations
    if len(scores) > 3:
        volatility = calculate_volatility(scores)
        if volatility > 15:
            recommendations.append("Work on consistency - try to maintain regular training schedule.")
    
    # Data-based recommendations
    if len(scores) < 5:
        recommendations.append("Continue training to build a better performance history.")
    
    return recommendations[:4]  # Limit to 4 recommendations

def assess_data_quality(scores, dates):
    """Assess the quality of the input data"""
    quality_factors = {}
    
    # Data amount
    if len(scores) >= 10:
        quality_factors['data_amount'] = 'excellent'
    elif len(scores) >= 5:
        quality_factors['data_amount'] = 'good'
    elif len(scores) >= 3:
        quality_factors['data_amount'] = 'fair'
    else:
        quality_factors['data_amount'] = 'limited'
    
    # Data consistency
    if len(scores) > 1:
        cv = np.std(scores) / np.mean(scores) if np.mean(scores) > 0 else 1
        if cv < 0.15:
            quality_factors['consistency'] = 'high'
        elif cv < 0.25:
            quality_factors['consistency'] = 'moderate'
        else:
            quality_factors['consistency'] = 'low'
    else:
        quality_factors['consistency'] = 'unknown'
    
    # Data recency
    if len(dates) > 1:
        days_since_last = (datetime.now() - dates[-1]).days
        if days_since_last <= 7:
            quality_factors['recency'] = 'recent'
        elif days_since_last <= 30:
            quality_factors['recency'] = 'moderate'
        else:
            quality_factors['recency'] = 'outdated'
    else:
        quality_factors['recency'] = 'unknown'
    
    return quality_factors