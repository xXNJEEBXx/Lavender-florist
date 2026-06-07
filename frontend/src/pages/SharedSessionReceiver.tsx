import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SharedSessionReceiver() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (token) {
      localStorage.setItem('shared_order_token', token);
      toast.success('تم الانضمام للجلسة المشتركة! سلتك الآن مرتبطة مع طلب الإدارة.');
      
      const shouldCheckout = searchParams.get('checkout') === 'true';
      const redirectUrl = shouldCheckout ? '/checkout' : '/';
      
      // Small delay to allow CartContext to remount or reload state before redirecting
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } else {
      navigate('/');
    }
  }, [token, navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      <h2 className="text-xl font-bold text-primary-900">جاري تجهيز الجلسة المشتركة...</h2>
      <p className="text-primary-500">سيتم توجيهك لتتصفح المتجر الآن</p>
    </div>
  );
}
