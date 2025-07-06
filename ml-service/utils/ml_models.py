import joblib
import os
import logging

logger = logging.getLogger(__name__)

# Global model storage
_models = {
    'cognitive_classifier': None,
    'scaler': None,
    'label_encoder': None,
    'progress_predictor': None
}

def load_model(model_name, file_path):
    """Load a model from file"""
    try:
        if os.path.exists(file_path):
            model = joblib.load(file_path)
            _models[model_name] = model
            logger.info(f"Loaded {model_name} from {file_path}")
            return model
        else:
            logger.warning(f"Model file not found: {file_path}")
            return None
    except Exception as e:
        logger.error(f"Error loading {model_name}: {str(e)}")
        return None

def save_model(model, model_name, file_path):
    """Save a model to file"""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        joblib.dump(model, file_path)
        _models[model_name] = model
        logger.info(f"Saved {model_name} to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving {model_name}: {str(e)}")
        return False

def get_cognitive_classifier():
    """Get the cognitive classifier model"""
    if _models['cognitive_classifier'] is None:
        _models['cognitive_classifier'] = load_model('cognitive_classifier', 'models/cognitive_classifier.pkl')
    return _models['cognitive_classifier']

def get_scaler():
    """Get the feature scaler"""
    if _models['scaler'] is None:
        _models['scaler'] = load_model('scaler', 'models/scaler.pkl')
    return _models['scaler']

def get_label_encoder():
    """Get the label encoder"""
    if _models['label_encoder'] is None:
        _models['label_encoder'] = load_model('label_encoder', 'models/label_encoder.pkl')
    return _models['label_encoder']

def get_progress_predictor():
    """Get the progress predictor model"""
    if _models['progress_predictor'] is None:
        _models['progress_predictor'] = load_model('progress_predictor', 'models/progress_predictor.pkl')
    return _models['progress_predictor']

def reload_all_models():
    """Reload all models from disk"""
    logger.info("Reloading all models...")
    _models['cognitive_classifier'] = load_model('cognitive_classifier', 'models/cognitive_classifier.pkl')
    _models['scaler'] = load_model('scaler', 'models/scaler.pkl')
    _models['label_encoder'] = load_model('label_encoder', 'models/label_encoder.pkl')
    _models['progress_predictor'] = load_model('progress_predictor', 'models/progress_predictor.pkl')
    
    loaded_count = sum(1 for model in _models.values() if model is not None)
    logger.info(f"Reloaded {loaded_count}/{len(_models)} models successfully")
    
    return loaded_count == len(_models)

def get_model_status():
    """Get the status of all models"""
    status = {}
    for name, model in _models.items():
        status[name] = {
            'loaded': model is not None,
            'type': type(model).__name__ if model is not None else None
        }
    return status