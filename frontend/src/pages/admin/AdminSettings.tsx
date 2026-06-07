import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, MessageCircle, Bell, BellOff, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { adminSettingsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface TelegramSettings {
  telegram_username: string;
  telegram_chat_id: string | null;
  is_connected: boolean;
  telegram_notify_new_orders: boolean;
  telegram_notify_driver: boolean;
  telegram_notify_website: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminSettingsApi.getTelegram();
      setSettings(data);
      setUsername(data.telegram_username || '');
    } catch (err) {
      console.error('Failed to load settings', err);
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = await adminSettingsApi.updateTelegram({
        telegram_username: username,
        telegram_notify_new_orders: settings?.telegram_notify_new_orders ?? true,
        telegram_notify_driver: settings?.telegram_notify_driver ?? false,
        telegram_notify_website: settings?.telegram_notify_website ?? true,
      });
      setSettings(data);
      setUsername(data.telegram_username || '');
      toast.success('تم حفظ الإعدادات بنجاح! ✅');
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary-950">الإعدادات</h1>
          <p className="text-primary-500 mt-1">إعدادات حساب المشرف وربط التيلجرام</p>
        </div>

        {/* Telegram Settings Card */}
        <div className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-primary-100 bg-gradient-to-l from-sky-50 to-blue-50 flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-950">ربط التيلجرام</h2>
              <p className="text-primary-500 text-sm">استقبل إشعارات الطلبات وأدر المتجر من التيلجرام مباشرة</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Connection Status */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${settings?.is_connected ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              {settings?.is_connected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-800">متصل بالتيلجرام ✅</p>
                    <p className="text-emerald-600 text-sm">حسابك مربوط وسيتم إرسال الإشعارات إليك</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800">غير متصل</p>
                    <p className="text-amber-600 text-sm">أدخل معرف التيلجرام واحفظ، ثم افتح البوت وأرسل /start</p>
                  </div>
                </>
              )}
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-bold text-primary-900 mb-2">معرف التيلجرام (Username)</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace('@', ''))}
                    className="w-full bg-white border border-primary-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="username"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-xs text-primary-400 mt-2">أدخل معرف التيلجرام الخاص بك بدون علامة @</p>
            </div>

            {/* Instructions */}
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-5">
              <h3 className="font-bold text-primary-900 mb-3 text-sm">خطوات الربط:</h3>
              <ol className="space-y-2 text-sm text-primary-600 list-decimal mr-5">
                <li>أدخل معرف التيلجرام أعلاه واضغط <strong>حفظ</strong></li>
                <li>
                  افتح بوت لافندر في التيلجرام: {' '}
                  <a 
                    href="https://t.me/lavender_florist_bot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sky-600 font-bold hover:underline"
                  >
                    @lavender_florist_bot
                  </a>
                </li>
                <li>أرسل <code className="bg-primary-100 px-2 py-0.5 rounded text-primary-800">/start</code> للبوت</li>
                <li>ستصلك رسالة تأكيد الربط 🎉</li>
              </ol>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="font-bold text-primary-900 flex items-center gap-2">
                <Bell className="w-4 h-4" /> تفضيلات الإشعارات
              </h3>
              
              <label className="flex items-center justify-between p-4 bg-white border border-primary-100 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <Bell className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-900 text-sm">إشعارات الطلبات الجديدة</p>
                    <p className="text-xs text-primary-400">استلم إشعار فوري عند كل طلب جديد مع أزرار التحكم</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.telegram_notify_new_orders ?? true}
                  onChange={e => setSettings(s => s ? {...s, telegram_notify_new_orders: e.target.checked} : s)}
                  className="w-5 h-5 text-primary-600 rounded-md border-primary-300 focus:ring-primary-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white border border-primary-100 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-900 text-sm">تحديثات المندوب</p>
                    <p className="text-xs text-primary-400">استلم إشعار عند قبول / استلام / تسليم الطلب من المندوب</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.telegram_notify_driver ?? false}
                  onChange={e => setSettings(s => s ? {...s, telegram_notify_driver: e.target.checked} : s)}
                  className="w-5 h-5 text-sky-600 rounded-md border-sky-300 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white border border-primary-100 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                    <RefreshCw className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-900 text-sm">إشعارات الموقع</p>
                    <p className="text-xs text-primary-400">تحديثات تغيير حالة الطلبات من لوحة التحكم</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.telegram_notify_website ?? true}
                  onChange={e => setSettings(s => s ? {...s, telegram_notify_website: e.target.checked} : s)}
                  className="w-5 h-5 text-violet-600 rounded-md border-violet-300 focus:ring-violet-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Available Commands */}
            {settings?.is_connected && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                <h3 className="font-bold text-sky-900 mb-3 text-sm">الأوامر المتاحة في التيلجرام:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-sky-700">
                    <code className="bg-sky-100 px-2 py-0.5 rounded font-mono">/orders</code>
                    <span>عرض الطلبات النشطة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-700">
                    <code className="bg-sky-100 px-2 py-0.5 rounded font-mono">/status</code>
                    <span>إحصائيات اليوم</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-700">
                    <code className="bg-sky-100 px-2 py-0.5 rounded font-mono">/help</code>
                    <span>المساعدة</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="p-6 border-t border-primary-100 bg-primary-50/30">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-primary-800 text-white rounded-xl font-bold text-sm hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> حفظ الإعدادات
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
