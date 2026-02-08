import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initializeSession } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (initialized.current) return;
    
    const token = searchParams.get('token');
    
    if (token) {
      initialized.current = true;
      initializeSession(token)
        .then(() => {
          navigate('/app', { replace: true });
        })
        .catch(() => {
          navigate('/login?error=init_failed', { replace: true });
        });
    } else {
      navigate('/login?error=no_token_received', { replace: true });
    }
  }, [navigate, searchParams, initializeSession]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-public">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-400">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
}
