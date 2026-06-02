import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon } from 'lucide-react';
import type { Product } from '../../types';
import { adminProductsApi } from '../../services/api';
import ProductFormModal from '../../components/admin/ProductFormModal';

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await adminProductsApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await adminProductsApi.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error('Failed to delete product', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const translateCategory = (cat: string) => {
    const categories: Record<string, string> = {
      bouquets: 'باقات ورد',
      gifts: 'هدايا وتغليف',
      vases: 'فازات',
      plants: 'نباتات',
    };
    return categories[cat] || cat;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-900 font-serif">إدارة المنتجات</h1>
          <p className="text-primary-600 mt-1">أضف، عدل، واحذف المنتجات الخاصة بمتجرك</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> منتج جديد
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-50 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-primary-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="ابحث عن منتج..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-primary-100 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all bg-primary-50/30"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-100 text-primary-700 hover:bg-primary-50 font-medium transition-colors">
          <Filter className="w-5 h-5" /> تصفية
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 text-primary-800 border-b border-primary-100">
                <th className="py-4 px-6 font-semibold">المنتج</th>
                <th className="py-4 px-6 font-semibold">التصنيف</th>
                <th className="py-4 px-6 font-semibold">السعر</th>
                <th className="py-4 px-6 font-semibold">المخزون (مبني على المكونات)</th>
                <th className="py-4 px-6 font-semibold">الحالة</th>
                <th className="py-4 px-6 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-primary-500">جاري التحميل...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-primary-500">لا توجد منتجات مضافة بعد.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 overflow-hidden flex-shrink-0">
                          {product.primary_image ? (
                            <img src={`http://localhost:8000${product.primary_image.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary-900">{product.name}</p>
                          {product.name_en && <p className="text-sm text-primary-500">{product.name_en}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-primary-700">
                      <span className="bg-primary-50 text-primary-800 px-3 py-1 rounded-lg text-sm font-medium border border-primary-100">
                        {translateCategory(product.category)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-primary-900">
                      {product.price} ر.س
                      {product.compare_at_price && (
                        <span className="block text-sm text-primary-400 line-through font-normal">{product.compare_at_price} ر.س</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-primary-700 font-medium">
                      {product.calculated_stock} حبة
                    </td>
                    <td className="py-4 px-6">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> متاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> مخفي
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
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

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        product={editingProduct}
      />
    </div>
  );
}
