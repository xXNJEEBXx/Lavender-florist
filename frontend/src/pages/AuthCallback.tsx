import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { authApi } from '../services/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        alert('فشل تسجيل الدخول بواسطة جوجل.');
        navigate('/login');
        return;
      }

      if (token) {
        // Save the token
        localStorage.setItem('auth_token', token);
        
        try {
          // Fetch user details
          const response = await authApi.me();
          setUser(response.data);
          
          if (response.data.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch (err) {
          console.error("Failed to fetch user after google login", err);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuth();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-primary-900">جاري تسجيل الدخول...</h2>
      </div>
    </div>
  );
}
