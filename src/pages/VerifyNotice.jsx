import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';

const VerifyNotice = () => {
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { resendVerification, verifyEmail, error, clearError, user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = location.state?.email || user?.email;
  const fromRegistration = location.state?.fromRegistration;
  const verificationToken = searchParams.get('token');

  // Handle email verification from URL
  useEffect(() => {
    const handleVerification = async () => {
      if (verificationToken) {
        setIsVerifying(true);
        try {
          const response = await verifyEmail(verificationToken);
          setSuccessMessage(response.message);
          
          // Redirect to login after successful verification
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                successMessage: 'Email verified successfully! Please log in.' 
              }
            });
          }, 3000);
        } catch (err) {
          // Error handled by context
        } finally {
          setIsVerifying(false);
        }
      }
    };

    handleVerification();
  }, [verificationToken, verifyEmail, navigate]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.isVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.isVerified, navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      setLocalError('Email address not found. Please try registering again.');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerification(email);
      setSuccessMessage(response.message);
    } catch (err) {
      // Error handled by context
    } finally {
      setIsResending(false);
    }
  };

  const currentError = error || localError;

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 text-lg">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <ErrorAlert 
        error={currentError} 
        onClose={() => {
          clearError();
          setLocalError('');
        }} 
      />
      
      <SuccessAlert
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {fromRegistration 
              ? 'We\'ve sent a verification link to your email address'
              : 'Please verify your email to continue'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <div className="text-center space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <svg className="mx-auto h-12 w-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Almost there!
              </h3>
              <p className="text-sm text-gray-600">
                We've sent a verification email to:
              </p>
              <p className="text-sm font-medium text-blue-600 mt-1 break-all">
                {email || 'your email address'}
              </p>
            </div>

            <div className="text-left space-y-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700">To complete your registration:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">1.</span>
                  Check your email inbox
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">2.</span>
                  Click the verification link in the email
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">3.</span>
                  Return here to sign in
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the email? Check your spam folder or request a new one.
              </p>
              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isResending ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already verified?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyNotice;