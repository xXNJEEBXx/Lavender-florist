import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Admin {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adminData: any) => Promise<void>;
  admin: Admin | null;
}

export default function AdminModal({ isOpen, onClose, onSave, admin }: AdminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        password: '',
        is_active: admin.is_active !== undefined ? admin.is_active : true
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        is_active: true
      });
    }
  }, [admin, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email && !formData.phone) {
      toast.error('يجب إدخال البريد الإلكتروني أو رقم الجوال');
      return;
    }

    if (!admin && !formData.password) {
        toast.error('يجب إدخال كلمة المرور للمشرف الجديد');
        return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-primary-100 bg-primary-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-primary-950">
              {admin ? 'تعديل بيانات المشرف' : 'إضافة مشرف جديد'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">اسم المشرف *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="الاسم الكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="admin@lavender.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">رقم الجوال</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="05XXXXXXXX"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-primary-900 mb-2">كلمة المرور {admin ? '(اتركه فارغاً لعدم التغيير)' : '*'}</label>
            <input
              type="password"
              required={!admin}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder={admin ? "••••••••" : "كلمة المرور القوية"}
              dir="ltr"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-primary-50/50 rounded-xl border border-primary-100 cursor-pointer hover:bg-primary-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-primary-600 rounded border-primary-300 focus:ring-primary-500"
            />
            <span className="font-bold text-primary-900 text-sm">حساب نشط</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-primary-200 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-70"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
