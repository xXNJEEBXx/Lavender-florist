import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Cart() {
  // Placeholder cart items
  const cartItems = [
    {
      id: 1,
      name: 'باقة الحب الأبدي',
      price: 150.00,
      quantity: 1,
      image: null,
      addons: ['تغليف أسود فاخر (+10 ر.س)']
    },
    {
      id: 2,
      name: 'شوكولاتة بستاني',
      price: 80.00,
      quantity: 2,
      image: null,
      addons: []
    }
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 15.00;
  const total = subtotal + deliveryFee;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-primary-950 mb-8">سلة المشتريات</h1>

      {cartItems.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items List */}
          <div className="flex-1 space-y-6">
            {cartItems.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                className="flex gap-6 bg-white p-4 rounded-2xl border border-primary-100 shadow-sm"
              >
                {/* Image Placeholder */}
                <div className="w-24 h-24 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="text-primary-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m8 14 4-4 4 4"/></svg>
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-primary-900 text-lg">{item.name}</h3>
                      {item.addons.map((addon, idx) => (
                        <p key={idx} className="text-sm text-primary-500 mt-1">{addon}</p>
                      ))}
                    </div>
                    <button className="text-primary-400 hover:text-red-500 transition-colors p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-lg font-bold text-accent-700">{item.price} ر.س</div>
                    
                    <div className="flex items-center bg-primary-50 rounded-lg border border-primary-100 overflow-hidden">
                      <button className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors">-</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 sticky top-28">
              <h2 className="text-xl font-bold text-primary-900 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 text-primary-700 mb-6">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{subtotal} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل</span>
                  <span className="font-medium">{deliveryFee} ر.س</span>
                </div>
              </div>
              
              <hr className="border-primary-100 mb-6" />
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-primary-900 text-lg">المجموع الإجمالي</span>
                <span className="font-bold text-accent-700 text-2xl">{total} ر.س</span>
              </div>
              
              <p className="text-xs text-primary-500 mb-6">السعر يشمل ضريبة القيمة المضافة 15%</p>
              
              <button className="w-full bg-primary-800 text-white rounded-xl py-4 font-semibold text-lg hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10">
                إتمام الطلب والدفع
              </button>
              
              <Link to="/products" className="block text-center mt-4 text-sm text-primary-600 hover:text-primary-800 underline decoration-primary-200 underline-offset-4 transition-colors">
                مواصلة التسوق
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-primary-100">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-4">سلة المشتريات فارغة</h2>
          <p className="text-primary-500 mb-8 max-w-md mx-auto">يبدو أنك لم تضف أي منتجات بعد. تصفح مجموعتنا الجميلة واصنع باقتك الخاصة.</p>
          <Link to="/products" className="inline-block px-8 py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 transition-colors">
            تصفح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}
