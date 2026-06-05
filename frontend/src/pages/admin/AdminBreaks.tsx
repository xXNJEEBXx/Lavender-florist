import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { adminSettingsApi } from '../../services/api';

export default function AdminBreaks() {
  const [breaks, setBreaks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [newBreak, setNewBreak] = useState({
    start_date: new Date().toISOString().split('T')[0],
    start_time: '12:00',
    end_date: new Date().toISOString().split('T')[0],
    end_time: '14:00',
    reason: ''
  });

  const [conflictingOrders, setConflictingOrders] = useState<any[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    loadBreaks();
  }, []);

  const loadBreaks = async () => {
    try {
      const data = await adminSettingsApi.getBreaks();
      setBreaks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent, forceSave = false) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setError('');

    const payload = {
      start_at: `${newBreak.start_date} ${newBreak.start_time}:00`,
      end_at: `${newBreak.end_date} ${newBreak.end_time}:00`,
      reason: newBreak.reason
    };

    try {
      // Send the request
      const response = await adminSettingsApi.saveBreak(payload);
      
      // If the backend returns has_conflicts and we haven't forced save, show the warning
      if (response.has_conflicts && !forceSave) {
        setConflictingOrders(response.conflicting_orders);
        setShowConflicts(true);
        // We will stop here, and wait for the user to confirm via "forceSave"
        setIsSaving(false);
        return;
      }
      
      await loadBreaks();
      setIsModalOpen(false);
      setShowConflicts(false);
      setNewBreak({
        start_date: new Date().toISOString().split('T')[0],
        start_time: '12:00',
        end_date: new Date().toISOString().split('T')[0],
        end_time: '14:00',
        reason: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الإجازة؟')) return;
    try {
      await adminSettingsApi.deleteBreak(id);
      await loadBreaks();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('ar-SA')} - ${d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إجازات وأوقات توقف المشرف</h1>
          <p className="text-gray-500 mt-1">تحديد أوقات للتوقف المؤقت لعدم استقبال طلبات مجدولة خلالها.</p>
        </div>
        <button
          onClick={() => {
            setShowConflicts(false);
            setConflictingOrders([]);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة إجازة</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : breaks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد إجازات حالياً</h3>
          <p className="text-gray-500">قم بإضافة إجازة لمنع استقبال طلبات مجدولة في وقت معين.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {breaks.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-gray-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-4">{b.reason || 'إجازة بدون سبب'}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <span className="font-bold text-gray-700">من:</span> {formatDateTime(b.start_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <div>
                      <span className="font-bold text-gray-700">إلى:</span> {formatDateTime(b.end_at)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                <span>بواسطة المشرف</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Break Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !showConflicts && setIsModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">إضافة إجازة جديدة</h3>
                {!showConflicts && (
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {showConflicts ? (
                <div className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-amber-800 mb-1">يوجد طلبات متضاربة!</h4>
                        <p className="text-sm text-amber-700">لقد تم حفظ الإجازة، ولكن يوجد {conflictingOrders.length} طلب(طلبات) مجدولة خلال هذه الفترة.</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 mb-6">
                    {conflictingOrders.map(order => (
                      <div key={order.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm">
                        <span className="font-bold">طلب #{order.order_number}</span>
                        <span className="text-gray-500">{new Date(order.scheduled_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setShowConflicts(false);
                        loadBreaks();
                      }}
                      className="flex-1 bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 font-bold"
                    >
                      موافق ومتابعة
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm">{error}</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
                      <input
                        type="date"
                        required
                        value={newBreak.start_date}
                        onChange={e => setNewBreak({ ...newBreak, start_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وقت البداية</label>
                      <input
                        type="time"
                        required
                        value={newBreak.start_time}
                        onChange={e => setNewBreak({ ...newBreak, start_time: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية</label>
                      <input
                        type="date"
                        required
                        value={newBreak.end_date}
                        onChange={e => setNewBreak({ ...newBreak, end_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وقت النهاية</label>
                      <input
                        type="time"
                        required
                        value={newBreak.end_time}
                        onChange={e => setNewBreak({ ...newBreak, end_time: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سبب الإجازة (اختياري)</label>
                    <input
                      type="text"
                      value={newBreak.reason}
                      onChange={e => setNewBreak({ ...newBreak, reason: e.target.value })}
                      placeholder="مثال: راحة، صيانة، إغلاق استثنائي"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-[2] bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors font-bold disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>حفظ الإجازة</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
