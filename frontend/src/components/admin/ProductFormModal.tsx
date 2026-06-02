import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Trash2, Languages, Percent } from 'lucide-react';
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
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bouquets');
  const [isActive, setIsActive] = useState(true);
  
  // Pricing & Discount logic
  const [originalPrice, setOriginalPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  
  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setNameEn(product.name_en || '');
      setDescription(product.description || '');
      setCategory(product.category);
      setIsActive(product.is_active);
      
      // Load pricing
      if (product.compare_at_price && Number(product.compare_at_price) > Number(product.price)) {
        setHasDiscount(true);
        setOriginalPrice(product.compare_at_price.toString());
        setFinalPrice(product.price.toString());
        const discount = Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100);
        setDiscountPercentage(discount.toString());
      } else {
        setHasDiscount(false);
        setOriginalPrice(product.price.toString());
        setFinalPrice(product.price.toString());
        setDiscountPercentage('');
      }

      // Load existing images as previews
      if (product.images && product.images.length > 0) {
        setImagePreviews(product.images.map(img => `http://localhost:8000${img.image_url}`));
      } else if (product.primary_image) {
        setImagePreviews([`http://localhost:8000${product.primary_image.image_url}`]);
      } else {
        setImagePreviews([]);
      }
      setImageFiles([]); // We don't have the File objects for existing images
    } else {
      // Reset form
      setName('');
      setNameEn('');
      setDescription('');
      setCategory('bouquets');
      setIsActive(true);
      setOriginalPrice('');
      setHasDiscount(false);
      setDiscountPercentage('');
      setFinalPrice('');
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [product, isOpen]);

  // Recalculate final price when original price or discount changes
  useEffect(() => {
    const orig = parseFloat(originalPrice);
    if (isNaN(orig) || orig <= 0) {
      setFinalPrice('');
      return;
    }
    
    if (hasDiscount) {
      const disc = parseFloat(discountPercentage);
      if (!isNaN(disc) && disc > 0 && disc <= 100) {
        const calculated = orig - (orig * disc / 100);
        setFinalPrice(calculated.toFixed(2));
      } else {
        setFinalPrice(orig.toFixed(2));
      }
    } else {
      setFinalPrice(orig.toFixed(2));
    }
  }, [originalPrice, discountPercentage, hasDiscount]);

  // Auto Translate Arabic Name
  const handleNameBlur = async () => {
    if (!name || nameEn || product) return; // Don't overwrite if already set or editing
    setIsTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(name)}&langpair=ar|en`);
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setNameEn(data.responseData.translatedText);
      }
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Max 5 images allowed
    if (imageFiles.length + files.length > 5) {
      setError('يمكنك رفع 5 صور كحد أقصى للمنتج.');
      return;
    }
    
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    
    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      
      formData.append('price', finalPrice);
      if (hasDiscount) {
        formData.append('compare_at_price', originalPrice);
      }
      
      formData.append('category', category);
      formData.append('is_active', isActive ? 'true' : 'false');
      
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images[]', file);
        });
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 max-h-[90vh] overflow-y-auto"
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
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100">
                {error}
              </div>
            )}

            {/* Images Upload Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-primary-900">صور المنتج (الحد الأقصى 5 صور)</label>
                <span className="text-xs text-primary-500">{imagePreviews.length} / 5</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Upload Button */}
                {imagePreviews.length < 5 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-primary-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                  >
                    <Upload className="w-6 h-6 text-primary-400 mb-2" />
                    <span className="text-xs text-primary-600 font-medium">أضف صورة</span>
                  </div>
                )}
                
                {/* Previews */}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="aspect-square rounded-2xl border border-primary-100 overflow-hidden relative group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {index === 0 && (
                      <div className="absolute top-2 right-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        الرئيسية
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-primary-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="w-6 h-6 text-white hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple
                onChange={handleImageChange} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Names */}
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">اسم المنتج (عربي) *</label>
                <input 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="مثال: باقة الحب الأبدي"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-primary-900 mb-2">
                  <span>اسم المنتج (إنجليزي)</span>
                  {isTranslating && <span className="text-xs text-primary-500 animate-pulse flex items-center gap-1"><Languages className="w-3 h-3"/> جاري الترجمة...</span>}
                </label>
                <input 
                  value={nameEn} 
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-left"
                  placeholder="e.g., Eternal Love Bouquet"
                  dir="ltr"
                />
              </div>

              {/* Pricing Section */}
              <div className="col-span-1 md:col-span-2 bg-primary-50/50 rounded-2xl p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-primary-900">إعدادات السعر</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-medium text-primary-700">تطبيق خصم؟</span>
                    <input 
                      type="checkbox"
                      checked={hasDiscount}
                      onChange={e => setHasDiscount(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-primary-300"
                    />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">السعر الأساسي (ريال) *</label>
                    <input 
                      required 
                      type="number"
                      min="0"
                      step="0.01"
                      value={originalPrice} 
                      onChange={e => setOriginalPrice(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  {hasDiscount && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <label className="block text-sm font-medium text-primary-900 mb-2">نسبة الخصم (%)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          min="1"
                          max="100"
                          value={discountPercentage} 
                          onChange={e => setDiscountPercentage(e.target.value)}
                          className="w-full px-4 py-3 pl-10 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-left"
                          dir="ltr"
                        />
                        <Percent className="w-4 h-4 text-primary-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </motion.div>
                  )}

                  <div className={!hasDiscount ? "md:col-start-3" : ""}>
                    <label className="block text-sm font-medium text-primary-900 mb-2">السعر النهائي</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold flex items-center justify-between">
                      <span>{finalPrice || '0.00'}</span>
                      <span className="text-sm">ر.س</span>
                    </div>
                  </div>
                </div>
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
                <label className="flex items-center gap-3 cursor-pointer mt-6 bg-white p-3 border border-primary-100 rounded-xl w-full hover:bg-primary-50 transition-colors">
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
