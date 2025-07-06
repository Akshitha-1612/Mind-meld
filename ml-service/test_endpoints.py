#!/usr/bin/env python3
"""
Test script for MindMeld ML Service endpoints
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5001"

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_cognitive_classifier():
    """Test the cognitive profile classification endpoint"""
    print("\n🧠 Testing Cognitive Classifier...")
    
    test_data = {
        "memory": 78,
        "attention": 65,
        "reaction_time": 0.8,
        "problem_solving": 72,
        "age": 25,
        "goal": "Improve Focus"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/classify_profile", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Cognitive classifier test failed: {e}")
        return False

def test_recommendations_engine():
    """Test the personalized recommendations endpoint"""
    print("\n🎯 Testing Recommendations Engine...")
    
    test_data = {
        "user_id": "test_user_123",
        "memory": 55,
        "attention": 42,
        "reaction_time": 1.2,
        "problem_solving": 69,
        "goal": "Improve Memory"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/get_recommendations", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Recommendations test failed: {e}")
        return False

def test_progress_predictor():
    """Test the performance progress prediction endpoint"""
    print("\n📈 Testing Progress Predictor...")
    
    # Generate test data with dates
    base_date = datetime.now() - timedelta(days=21)
    test_data = {
        "user_id": "test_user_456",
        "past_scores": [55, 58, 62, 65, 68, 71, 74],
        "session_dates": [
            (base_date + timedelta(days=i*3)).strftime("%Y-%m-%d") 
            for i in range(7)
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict_progress", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Progress predictor test failed: {e}")
        return False

def test_error_handling():
    """Test error handling with invalid data"""
    print("\n⚠️ Testing Error Handling...")
    
    # Test with missing fields
    invalid_data = {
        "memory": 78,
        "attention": 65
        # Missing required fields
    }
    
    try:
        response = requests.post(f"{BASE_URL}/classify_profile", json=invalid_data)
        print(f"Invalid data test - Status Code: {response.status_code}")
        print(f"Error Response: {json.dumps(response.json(), indent=2)}")
        
        # Should return 400 for bad request
        return response.status_code == 400
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print("🚀 Starting MindMeld ML Service Tests\n")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Cognitive Classifier", test_cognitive_classifier),
        ("Recommendations Engine", test_recommendations_engine),
        ("Progress Predictor", test_progress_predictor),
        ("Error Handling", test_error_handling)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            print(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            results.append((test_name, False))
            print(f"❌ {test_name}: FAILED - {e}")
        print("-" * 30)
    
    # Summary
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n📊 Test Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML service is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        failed_tests = [name for name, result in results if not result]
        print(f"Failed tests: {', '.join(failed_tests)}")
    
    return passed == total

if __name__ == "__main__":
    success = run_comprehensive_test()
    exit(0 if success else 1)