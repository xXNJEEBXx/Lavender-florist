import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { adminComponentsApi } from '../../services/api';

interface ComponentItem {
  id: number;
  name: string;
  name_en: string | null;
  type: string;
  cost_price: number;
  stock_quantity: number;
  is_active: boolean;
}

export default function ComponentsList() {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComponentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    type: 'flower',
    cost_price: '',
    stock_quantity: '',
    is_active: true
  });

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      const data = await adminComponentsApi.getAll();
      setComponents(data);
    } catch (error) {
      console.error('Failed to fetch components', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', name_en: '', type: 'flower', cost_price: '', stock_quantity: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ComponentItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      name_en: item.name_en || '',
      type: item.type,
      cost_price: item.cost_price.toString(),
      stock_quantity: item.stock_quantity.toString(),
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المكون؟ لا يمكنك حذفه إذا كان مرتبطاً بمنتجات.')) {
      try {
        await adminComponentsApi.delete(id);
        setComponents(components.filter(c => c.id !== id));
      } catch (error) {
        alert('حدث خطأ. قد يكون المكون مرتبطاً بمنتج.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      if (editingItem) {
        await adminComponentsApi.update(editingItem.id, payload);
      } else {
        await adminComponentsApi.create(payload);
      }
      setIsModalOpen(false);
      fetchComponents();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const translateType = (type: string) => {
    const types: Record<string, string> = { flower: 'ورد', wrapper: 'تغليف', vase: 'فازة', accessory: 'إكسسوار' };
    return types[type] || type;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-900 font-serif">المواد الخام (المكونات)</h1>
          <p className="text-primary-600 mt-1">أضف الورود والتغليفات لإدارة مخزون الباقات تلقائياً.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> مكون جديد
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 text-primary-800 border-b border-primary-100">
                <th className="py-4 px-6 font-semibold">المكون</th>
                <th className="py-4 px-6 font-semibold">النوع</th>
                <th className="py-4 px-6 font-semibold">سعر التكلفة</th>
                <th className="py-4 px-6 font-semibold">المخزون المتوفر</th>
                <th className="py-4 px-6 font-semibold">الحالة</th>
                <th className="py-4 px-6 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-primary-500">جاري التحميل...</td></tr>
              ) : components.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-primary-500">لا يوجد مكونات بعد.</td></tr>
              ) : (
                components.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-50/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary-900">{item.name}</p>
                          {item.name_en && <p className="text-xs text-primary-500">{item.name_en}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm">{translateType(item.type)}</span></td>
                    <td className="py-4 px-6 font-medium">{item.cost_price} ر.س</td>
                    <td className="py-4 px-6 font-bold text-primary-900">{item.stock_quantity} حبة</td>
                    <td className="py-4 px-6">
                      {item.is_active ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs">مفعل</span> : <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs">موقوف</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-6">{editingItem ? 'تعديل مكون' : 'إضافة مكون'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم (عربي) *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الاسم (إنجليزي)</label>
                <input value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full border rounded-lg px-3 py-2" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                    <option value="flower">ورد</option>
                    <option value="wrapper">تغليف</option>
                    <option value="vase">فازة</option>
                    <option value="accessory">إكسسوار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المخزون (حبة) *</label>
                  <input required type="number" min="0" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">سعر التكلفة للحبة (ريال) *</label>
                <input required type="number" min="0" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700">حفظ</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
