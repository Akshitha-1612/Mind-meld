import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

def generate_synthetic_user_data(n_users=1000):
    """Generate synthetic user data for testing ML models"""
    np.random.seed(42)
    
    users = []
    for i in range(n_users):
        # Generate user profile
        age = np.random.randint(18, 80)
        
        # Age affects cognitive performance
        age_factor = 1.0 - (age - 25) * 0.005 if age > 25 else 1.0 + (25 - age) * 0.002
        
        # Base cognitive scores with age adjustment
        memory = np.clip(np.random.normal(70, 15) * age_factor, 0, 100)
        attention = np.clip(np.random.normal(65, 20) * age_factor, 0, 100)
        reaction_time = np.clip(np.random.normal(0.8, 0.3) / age_factor, 0.2, 3.0)
        problem_solving = np.clip(np.random.normal(68, 18) * age_factor, 0, 100)
        
        # Generate goal based on weakest area
        scores = {
            'memory': memory,
            'attention': attention,
            'processing_speed': 100 - (reaction_time * 33.33),
            'problem_solving': problem_solving
        }
        weakest_domain = min(scores, key=scores.get)
        
        goals = ['memory', 'attention', 'processing_speed', 'problem_solving', 'overall']
        goal = weakest_domain if np.random.random() < 0.6 else np.random.choice(goals)
        
        user = {
            'user_id': f'user_{i:04d}',
            'age': age,
            'memory': round(memory, 1),
            'attention': round(attention, 1),
            'reaction_time': round(reaction_time, 3),
            'problem_solving': round(problem_solving, 1),
            'goal': goal
        }
        
        users.append(user)
    
    return users

def generate_session_history(user_data, n_sessions_per_user=10):
    """Generate synthetic session history for users"""
    sessions = []
    
    for user in user_data:
        user_id = user['user_id']
        base_performance = (user['memory'] + user['attention'] + user['problem_solving']) / 3
        
        # Generate sessions over time
        start_date = datetime.now() - timedelta(days=30)
        
        for session_num in range(n_sessions_per_user):
            session_date = start_date + timedelta(days=session_num * 3)
            
            # Simulate improvement over time with some noise
            improvement_factor = 1 + (session_num * 0.02)  # 2% improvement per session
            noise = np.random.normal(0, 5)
            
            score = np.clip(base_performance * improvement_factor + noise, 0, 100)
            
            session = {
                'user_id': user_id,
                'session_date': session_date.isoformat(),
                'score': round(score, 1),
                'game_type': np.random.choice(['n-back', 'flanker', 'simple-reaction', 'choice-reaction', 'ravens-matrices', 'tower-hanoi']),
                'difficulty': np.random.choice(['easy', 'medium', 'hard'])
            }
            
            sessions.append(session)
    
    return sessions

def save_synthetic_data():
    """Generate and save synthetic data for testing"""
    print("Generating synthetic user data...")
    users = generate_synthetic_user_data(100)
    
    print("Generating session history...")
    sessions = generate_session_history(users, 8)
    
    # Save to JSON files
    with open('data/synthetic_users.json', 'w') as f:
        json.dump(users, f, indent=2)
    
    with open('data/synthetic_sessions.json', 'w') as f:
        json.dump(sessions, f, indent=2)
    
    print(f"Generated data for {len(users)} users with {len(sessions)} sessions")
    print("Data saved to data/synthetic_users.json and data/synthetic_sessions.json")

if __name__ == "__main__":
    save_synthetic_data()