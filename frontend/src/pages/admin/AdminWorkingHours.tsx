import { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { adminSettingsApi } from '../../services/api';

export default function AdminWorkingHours() {
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const daysOfWeek = [
    { id: 0, name: 'الأحد' },
    { id: 1, name: 'الاثنين' },
    { id: 2, name: 'الثلاثاء' },
    { id: 3, name: 'الأربعاء' },
    { id: 4, name: 'الخميس' },
    { id: 5, name: 'الجمعة' },
    { id: 6, name: 'السبت' },
  ];

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const data = await adminSettingsApi.getWorkingHours();
      const regularHours = data.filter((h: any) => h.type === 'regular');
      
      // Initialize state with fetched data or defaults
      const hoursMap = daysOfWeek.map(day => {
        const existing = regularHours.find((h: any) => h.day_of_week === day.id);
        return {
          day_of_week: day.id,
          day_name: day.name,
          is_active: existing ? existing.is_active : false,
          open_time: existing ? existing.open_time.slice(0, 5) : '09:00',
          close_time: existing ? existing.close_time.slice(0, 5) : '22:00',
        };
      });
      
      setWorkingHours(hoursMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (dayId: number, field: string, value: any) => {
    setWorkingHours(prev => prev.map(h => {
      if (h.day_of_week === dayId) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save each day one by one (could be optimized with a bulk API, but this works)
      for (const h of workingHours) {
        await adminSettingsApi.saveWorkingHours({
          type: 'regular',
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_active: h.is_active
        });
      }
      alert('تم حفظ أوقات العمل بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أوقات العمل</h1>
          <p className="text-gray-500 mt-1">تحديد أوقات عمل المتجر المعتادة لضبط نظام الجدولة.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>حفظ التعديلات</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {workingHours.map((day) => (
              <div key={day.day_of_week} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 transition-colors">
                <div className="w-32">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.is_active}
                      onChange={(e) => handleChange(day.day_of_week, 'is_active', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-bold text-gray-900">{day.day_name}</span>
                  </label>
                </div>

                {day.is_active ? (
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">وقت الفتح</label>
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) => handleChange(day.day_of_week, 'open_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">وقت الإغلاق</label>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) => handleChange(day.day_of_week, 'close_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-gray-400 text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>مغلق في هذا اليوم</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
