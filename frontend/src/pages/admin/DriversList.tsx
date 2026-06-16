import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, CheckCircle2, X, Star, Wallet } from 'lucide-react';
import api from '../../services/api';

export default function DriversList() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [payDriver, setPayDriver] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    telegram_username: '',
    is_primary: false,
    is_active: true,
  });

  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/admin/drivers');
      setDrivers(data);
    } catch (error) {
      console.error('Failed to load drivers', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (driver?: any) => {
    if (driver) {
      setEditingId(driver.id);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        telegram_username: driver.telegram_username || '',
        is_primary: driver.is_primary,
        is_active: driver.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        phone: '',
        telegram_username: '',
        is_primary: false,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/drivers/${editingId}`, formData);
        showToast('تم تحديث بيانات المندوب', 'success');
      } else {
        await api.post('/admin/drivers', formData);
        showToast('تمت إضافة المندوب', 'success');
      }
      setIsModalOpen(false);
      loadDrivers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المندوب؟')) return;
    try {
      await api.delete(`/admin/drivers/${id}`);
      showToast('تم الحذف بنجاح', 'success');
      loadDrivers();
    } catch (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const handlePayOpen = (driver: any) => {
    setPayDriver(driver);
    setPayAmount(driver.balance || '');
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDriver || !payAmount) return;
    setIsSaving(true);
    try {
      await api.post(`/admin/drivers/${payDriver.id}/pay`, { amount: Number(payAmount) });
      showToast('تم سداد المستحقات بنجاح', 'success');
      setIsPayModalOpen(false);
      loadDrivers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء السداد', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">المناديب</h1>
          <p className="text-primary-600 mt-1">إدارة فريق التوصيل وحسابات تيليجرام.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-primary-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> إضافة مندوب
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 border-b border-primary-100">
                <th className="px-6 py-4 text-primary-900 font-bold">الاسم</th>
                <th className="px-6 py-4 text-primary-900 font-bold">رقم الجوال</th>
                <th className="px-6 py-4 text-primary-900 font-bold">حساب تيليجرام</th>
                <th className="px-6 py-4 text-primary-900 font-bold">الدور</th>
                <th className="px-6 py-4 text-primary-900 font-bold">الحالة</th>
                <th className="px-6 py-4 text-primary-900 font-bold">المستحقات</th>
                <th className="px-6 py-4 text-primary-900 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-primary-500 font-bold">جاري التحميل...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-primary-500 font-bold">لا يوجد مناديب مضافين حالياً.</td></tr>
              ) : (
                drivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary-900 flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <Users className="w-5 h-5" />
                      </div>
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 text-primary-700" dir="ltr">{driver.phone}</td>
                    <td className="px-6 py-4 text-primary-700">{driver.telegram_username || '-'}</td>
                    <td className="px-6 py-4">
                      {driver.is_primary ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full w-max">
                          <Star className="w-4 h-4 fill-emerald-600" /> مندوب أساسي
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">مندوب احتياطي</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {driver.is_active ? (
                        <span className="text-emerald-600 text-sm font-bold">نشط</span>
                      ) : (
                        <span className="text-rose-500 text-sm font-bold">غير نشط</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      {driver.balance} ر.س
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(driver)} title="تعديل المندوب" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePayOpen(driver)} title="تسديد المستحقات" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(driver.id)} title="حذف المندوب" className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
              <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50/30">
                <h2 className="text-xl font-bold text-primary-900">{editingId ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-primary-400 hover:text-primary-700 bg-white rounded-full hover:bg-primary-50 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">اسم المندوب</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">رقم الجوال</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">معرف تيليجرام (اختياري)</label>
                    <input value={formData.telegram_username} onChange={e => setFormData({...formData, telegram_username: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" placeholder="@username" dir="ltr" />
                    <p className="text-xs text-primary-500 mt-1">يُفضل إضافته إن وجد، أو يمكن للمندوب التحدث مع البوت مباشرة للربط.</p>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_primary} onChange={e => setFormData({...formData, is_primary: e.target.checked})} className="w-5 h-5 text-primary-600 rounded border-primary-300 focus:ring-primary-500" />
                      <span className="font-medium text-primary-900">تعيين كمندوب أساسي (تلقي الطلبات أولاً)</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 text-primary-600 rounded border-primary-300 focus:ring-primary-500" />
                      <span className="font-medium text-primary-900">حساب نشط</span>
                    </label>
                  </div>
                </div>
                <div className="mt-8">
                  <button type="submit" disabled={isSaving} className="w-full py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPayModalOpen && payDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayModalOpen(false)} className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
              <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50/30">
                <h2 className="text-xl font-bold text-primary-900">تسديد مستحقات المندوب</h2>
                <button onClick={() => setIsPayModalOpen(false)} className="p-2 text-primary-400 hover:text-primary-700 bg-white rounded-full hover:bg-primary-50 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handlePaySubmit} className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-primary-900 text-lg">{payDriver.name}</h3>
                  <p className="text-primary-500 mt-1">الرصيد الحالي: <span className="font-bold text-amber-600">{payDriver.balance} ر.س</span></p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">المبلغ المسدد (ر.س)</label>
                    <input type="number" step="0.01" min="0.01" max={payDriver.balance} required value={payAmount} onChange={e => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none text-center font-bold text-xl" dir="ltr" />
                  </div>
                </div>
                <div className="mt-8">
                  <button type="submit" disabled={isSaving || payDriver.balance <= 0} className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50">
                    {isSaving ? 'جاري التنفيذ...' : 'تأكيد السداد'}
                  </button>
                  <p className="text-xs text-primary-400 text-center mt-3">سيتم إرسال إشعار للمندوب عبر تيليجرام.</p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] font-bold text-white border-2 ${toastMessage.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-rose-600 border-rose-400'}`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

