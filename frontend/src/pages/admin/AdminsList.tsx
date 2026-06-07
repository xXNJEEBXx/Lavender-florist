import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Shield, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { adminsApi } from '../../services/api';
import toast from 'react-hot-toast';
import AdminModal from '../../components/admin/AdminModal';

interface Admin {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminsList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await adminsApi.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error(error);
      toast.error('فشل في تحميل بيانات المشرفين');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = () => {
    setSelectedAdmin(null);
    setIsModalOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleDeleteAdmin = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) {
      try {
        await adminsApi.deleteAdmin(id);
        toast.success('تم حذف المشرف بنجاح');
        loadAdmins();
      } catch (error: any) {
        console.error(error);
        if (error.response?.status === 403) {
            toast.error('لا يمكنك حذف حسابك الخاص');
        } else {
            toast.error('فشل في حذف المشرف');
        }
      }
    }
  };

  const handleSaveAdmin = async (adminData: any) => {
    try {
      if (selectedAdmin) {
        await adminsApi.updateAdmin(selectedAdmin.id, adminData);
        toast.success('تم تحديث بيانات المشرف بنجاح');
      } else {
        await adminsApi.addAdmin(adminData);
        toast.success('تم إضافة المشرف بنجاح');
      }
      setIsModalOpen(false);
      loadAdmins();
    } catch (error: any) {
        console.error(error);
        if (error.response?.data?.message) {
            toast.error(error.response.data.message);
        } else {
            toast.error('حدث خطأ أثناء حفظ البيانات');
        }
        throw error;
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.phone && admin.phone.includes(searchTerm)) ||
    (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">إدارة المشرفين</h1>
          <p className="text-primary-500 text-sm mt-1">إضافة وإدارة حسابات مشرفي النظام</p>
        </div>
        <button
          onClick={handleAddAdmin}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          إضافة مشرف جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-primary-100 bg-primary-50/30">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الجوال، أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-600" />
              <p>جاري تحميل البيانات...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary-400">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">لم يتم العثور على أي مشرفين</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-primary-50/50 border-b border-primary-100">
                  <th className="px-6 py-4 text-sm font-bold text-primary-900">المشرف</th>
                  <th className="px-6 py-4 text-sm font-bold text-primary-900">معلومات الاتصال</th>
                  <th className="px-6 py-4 text-sm font-bold text-primary-900">الحالة</th>
                  <th className="px-6 py-4 text-sm font-bold text-primary-900 w-32">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                <AnimatePresence>
                  {filteredAdmins.map((admin) => (
                    <motion.tr
                      key={admin.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-primary-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-primary-900">{admin.name}</div>
                            <div className="text-xs text-primary-500">ID: #{admin.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {admin.phone && (
                            <div className="flex items-center gap-2 text-sm text-primary-600">
                              <Phone className="w-4 h-4" />
                              <span dir="ltr">{admin.phone}</span>
                            </div>
                          )}
                          {admin.email && (
                            <div className="flex items-center gap-2 text-sm text-primary-600">
                              <Mail className="w-4 h-4" />
                              <span dir="ltr">{admin.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          admin.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {admin.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="p-2 text-primary-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-2 text-primary-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AdminModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveAdmin}
            admin={selectedAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
