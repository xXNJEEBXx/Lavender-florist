import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { Product } from '../../types';
import { adminProductsApi } from '../../services/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null; // If passed, we are editing
}

export default function ProductFormModal({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [category, setCategory] = useState('bouquets');
  const [isActive, setIsActive] = useState(true);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setNameEn(product.name_en || '');
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setCompareAtPrice(product.compare_at_price ? product.compare_at_price.toString() : '');
      setCategory(product.category);
      setIsActive(product.is_active);
      setImagePreview(product.primary_image?.image_url || null);
    } else {
      // Reset form
      setName('');
      setNameEn('');
      setDescription('');
      setPrice('');
      setCompareAtPrice('');
      setCategory('bouquets');
      setIsActive(true);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (nameEn) formData.append('name_en', nameEn);
      if (description) formData.append('description', description);
      formData.append('price', price);
      if (compareAtPrice) formData.append('compare_at_price', compareAtPrice);
      formData.append('category', category);
      formData.append('is_active', isActive ? 'true' : 'false');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (product) {
        await adminProductsApi.update(product.id, formData);
      } else {
        await adminProductsApi.create(formData);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-primary-100 p-6 flex items-center justify-between z-20">
            <h2 className="text-2xl font-bold text-primary-900 font-serif">
              {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-primary-50 rounded-full text-primary-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100">
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-primary-900 mb-2">صورة المنتج</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group overflow-hidden relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-primary-500" />
                    </div>
                    <p className="text-primary-600 font-medium">اضغط لرفع صورة</p>
                    <p className="text-primary-400 text-sm mt-1">PNG, JPG حتى 5MB</p>
                  </>
                )}
                {imagePreview && (
                  <div className="absolute inset-0 bg-primary-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2">
                      <Upload className="w-5 h-5" /> تغيير الصورة
                    </span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Names */}
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">اسم المنتج (عربي) *</label>
                <input 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="مثال: باقة الحب الأبدي"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">اسم المنتج (إنجليزي)</label>
                <input 
                  value={nameEn} 
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-left"
                  placeholder="e.g., Eternal Love Bouquet"
                  dir="ltr"
                />
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">السعر (ريال) *</label>
                <input 
                  required 
                  type="number"
                  min="0"
                  step="0.01"
                  value={price} 
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">السعر قبل التخفيض (اختياري)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={compareAtPrice} 
                  onChange={e => setCompareAtPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category & Status */}
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">التصنيف *</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="bouquets">باقات ورد</option>
                  <option value="gifts">هدايا وتغليف</option>
                  <option value="vases">فازات</option>
                  <option value="plants">نباتات</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer mt-6">
                  <input 
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-primary-300"
                  />
                  <span className="text-primary-900 font-medium">المنتج متاح للبيع للعملاء</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-primary-900 mb-2">وصف المنتج</label>
              <textarea 
                rows={4}
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="اكتب وصفاً جذاباً للمنتج ومكوناته..."
              />
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-primary-100 flex gap-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </button>
              <button 
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-white text-primary-700 font-bold py-3 px-6 rounded-xl hover:bg-primary-50 border border-primary-200 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
