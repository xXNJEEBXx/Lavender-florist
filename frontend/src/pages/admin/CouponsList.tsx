import { useState, useEffect } from 'react';
import { couponApi } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { Trash2 as TrashIcon, Edit2 as PencilIcon, Ticket as TicketIcon, Plus as PlusIcon } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_per_customer: number;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  is_valid?: boolean;
}

export default function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_per_customer: 1,
    starts_at: '',
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await couponApi.getAll();
      setCoupons(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        min_order_amount: coupon.min_order_amount ? coupon.min_order_amount.toString() : '',
        max_discount_amount: coupon.max_discount_amount ? coupon.max_discount_amount.toString() : '',
        usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
        usage_per_customer: coupon.usage_per_customer,
        starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        usage_per_customer: 1,
        starts_at: '',
        expires_at: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, payload);
        toast.success('تم تحديث الكوبون بنجاح');
      } else {
        await couponApi.create(payload);
        toast.success('تم إضافة الكوبون بنجاح');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
      try {
        await couponApi.delete(id);
        toast.success('تم حذف الكوبون بنجاح');
        fetchCoupons();
      } catch (error) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      percentage: 'نسبة مئوية',
      fixed: 'مبلغ ثابت',
      free_delivery: 'توصيل مجاني بالكامل',
      delivery_discount: 'خصم من رسوم التوصيل'
    };
    return types[type] || type;
  };

  if (loading) return <div className="text-center p-8">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الكوبونات</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5" />
          إضافة كوبون جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${coupon.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <TicketIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{coupon.code}</h3>
                  <p className="text-sm text-gray-500">{coupon.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(coupon)} className="text-gray-400 hover:text-primary-600">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(coupon.id)} className="text-gray-400 hover:text-red-600">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">النوع:</span>
                <span className="font-medium">{getTypeLabel(coupon.type)}</span>
              </div>
              
              {coupon.type !== 'free_delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">القيمة:</span>
                  <span className="font-bold text-primary-600">
                    {coupon.value} {coupon.type === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الاستخدام:</span>
                <span>{coupon.times_used} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'مرة'}</span>
              </div>

              {coupon.expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ينتهي في:</span>
                  <span dir="ltr">{format(new Date(coupon.expires_at), 'yyyy/MM/dd', { locale: ar })}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-6">
              {editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كود الخصم (انجليزي/أرقام)</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الكوبون (للعرض الداخلي)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ر.س)</option>
                    <option value="free_delivery">توصيل مجاني بالكامل</option>
                    <option value="delivery_discount">خصم مبلغ من رسوم التوصيل</option>
                  </select>
                </div>

                {formData.type !== 'free_delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'delivery_discount' ? 'قيمة الخصم من التوصيل (ر.س)' : 'القيمة'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للطلب (اختياري)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({...formData, min_order_amount: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للخصم (اختياري)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={e => setFormData({...formData, max_discount_amount: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={e => setFormData({...formData, starts_at: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={e => setFormData({...formData, expires_at: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للاستخدام الكلي (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={e => setFormData({...formData, usage_limit: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاستخدام لكل عميل</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.usage_per_customer}
                    onChange={e => setFormData({...formData, usage_per_customer: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">الكوبون فعال</label>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  حفظ الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

