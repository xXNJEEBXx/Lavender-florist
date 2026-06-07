import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Package, MapPin, DollarSign, Settings, Loader2 } from 'lucide-react';
import { adminProductsApi, storeApi } from '../../services/api';

export default function EditOrderModal({ order, onClose, onSave }: { order: any, onClose: () => void, onSave: (updatedData: any) => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isExtractingLink, setIsExtractingLink] = useState(false);

  const extractFromLink = async (link: string) => {
    if (!link || !link.includes('http')) return;
    setIsExtractingLink(true);
    try {
      const res = await storeApi.expandUrl(link);
      if (res.latitude && res.longitude) {
        const lat = parseFloat(res.latitude);
        const lng = parseFloat(res.longitude);
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            latitude: lat,
            longitude: lng,
            street: prev.address.street || `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          }
        }));
      }
    } catch (e) {
      console.error("Failed to extract map URL", e);
    } finally {
      setIsExtractingLink(false);
    }
  };

  const getLocalDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getLocalTimeString = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const [formData, setFormData] = useState({
    status: order.status || 'pending',
    owner_name: order.owner_name || '',
    delivery_type: order.delivery_type || 'local',
    delivery_fee: parseFloat(order.delivery_fee) || 0,
    delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
    scheduled_date: order.scheduled_at ? getLocalDateString(order.scheduled_at) : (order.delivery_date ? order.delivery_date.split('T')[0] : ''),
    scheduled_time: order.scheduled_at ? getLocalTimeString(order.scheduled_at) : '',
    estimated_preparation_time: parseInt(order.estimated_preparation_time) || 45,
    driver_notes: order.driver_notes || '',
    subtotal: parseFloat(order.subtotal) || 0,
    discount: parseFloat(order.discount) || 0,
    total: parseFloat(order.total) || 0,
    payment_method: order.payment_method || 'cash_on_delivery',
    payment_status: order.payment_status || 'pending',
    notes: order.notes || '',
    address: order.address ? {
      city: order.address.city || '',
      district: order.address.district || '',
      street: order.address.street || '',
      recipient_name: order.address.recipient_name || '',
      recipient_phone: order.address.recipient_phone || '',
      google_maps_link: order.address.google_maps_link || '',
      latitude: order.address.latitude || null,
      longitude: order.address.longitude || null,
    } : {
      city: '', district: '', street: '', recipient_name: '', recipient_phone: '', google_maps_link: '', latitude: null, longitude: null
    },
    items: order.items ? order.items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price) || 0,
      gift_message: item.gift_message?.message || item.gift_message || ''
    })) : []
  });

  useEffect(() => {
    adminProductsApi.getAll().then(res => setProducts(res.data || res));
  }, []);

  // Recalculate totals when items or delivery_fee changes
  useEffect(() => {
    const subtotal = formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const total = subtotal - formData.discount + formData.delivery_fee;
    setFormData(prev => ({ ...prev, subtotal, total }));
  }, [formData.items, formData.delivery_fee, formData.discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      if (prod) {
        newItems[index] = {
          ...newItems[index],
          product_id: prod.id,
          product_name: prod.name,
          unit_price: parseFloat(prod.price) || 0
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    if (products.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { product_id: products[0].id, product_name: products[0].name, quantity: 1, unit_price: parseFloat(products[0].price) || 0, gift_message: '' }]
      }));
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const tabs = [
    { id: 'general', label: 'معلومات عامة', icon: Settings },
    { id: 'items', label: 'المنتجات', icon: Package },
    { id: 'delivery', label: 'التوصيل', icon: MapPin },
    { id: 'pricing', label: 'الأسعار والدفع', icon: DollarSign },
  ];

  return (
    <div className="fixed inset-0 bg-primary-950/50 backdrop-blur-sm z-50 flex justify-end">
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50/50">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">تعديل الطلب</h2>
            <p className="text-primary-500 text-sm">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-primary-400 hover:text-primary-600 shadow-sm border border-transparent hover:border-primary-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-primary-100 bg-white px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.id ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-primary-400 hover:text-primary-600 hover:bg-primary-50/30'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-primary-50/20">
          <form id="edit-order-form" onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">حالة الطلب</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500">
                      <option value="pending">بانتظار الدفع</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="preparing">قيد التجهيز</option>
                      <option value="ready">جاهز</option>
                      <option value="delivering">جاري التوصيل</option>
                      <option value="delivered">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">وقت التجهيز المتوقع (دقائق)</label>
                    <input type="number" min="0" value={formData.estimated_preparation_time} onChange={e => setFormData({...formData, estimated_preparation_time: parseInt(e.target.value) || 0})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">إسم صاحب الطلب</label>
                  <input type="text" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">ملاحظات الطلب</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={4} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-white border border-primary-100 rounded-xl p-4 shadow-sm relative group">
                    <button type="button" onClick={() => removeItem(index)} className="absolute top-4 left-4 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-12 gap-4 mb-4 pr-10">
                      <div className="col-span-12 lg:col-span-6">
                        <label className="block text-xs font-bold text-primary-500 mb-1">المنتج</label>
                        <select value={item.product_id} onChange={e => handleItemChange(index, 'product_id', e.target.value)} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm">
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 lg:col-span-3">
                        <label className="block text-xs font-bold text-primary-500 mb-1">الكمية</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div className="col-span-6 lg:col-span-3">
                        <label className="block text-xs font-bold text-primary-500 mb-1">السعر</label>
                        <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary-500 mb-1">رسالة الإهداء (اختياري)</label>
                      <textarea value={item.gift_message} onChange={e => handleItemChange(index, 'gift_message', e.target.value)} rows={2} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={addItem} className="w-full py-4 border-2 border-dashed border-primary-200 rounded-xl text-primary-600 font-bold hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> إضافة منتج جديد
                </button>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">نوع التوصيل</label>
                    <select value={formData.delivery_type} onChange={e => setFormData({...formData, delivery_type: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500">
                      <option value="local">توصيل محلي</option>
                      <option value="pickup">استلام من الفرع</option>
                      <option value="shipping">شحن</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">رسوم التوصيل</label>
                    <input type="number" min="0" step="0.01" value={formData.delivery_fee} onChange={e => setFormData({...formData, delivery_fee: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">تاريخ التوصيل المجدول</label>
                    <input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">وقت التوصيل</label>
                    <input type="time" value={formData.scheduled_time} onChange={e => setFormData({...formData, scheduled_time: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                {formData.delivery_type !== 'pickup' && (
                  <div className="bg-white border border-primary-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-primary-900 mb-2 border-b border-primary-100 pb-2">معلومات العنوان</h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-primary-500 mb-1">رابط قوقل ماب (اختياري)</label>
                      <input 
                        type="url" 
                        value={formData.address.google_maps_link || ''} 
                        onChange={e => setFormData({...formData, address: {...formData.address, google_maps_link: e.target.value}})} 
                        onBlur={e => extractFromLink(e.target.value)}
                        className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" 
                        placeholder="https://maps.google.com/..." 
                        dir="ltr"
                      />
                      {isExtractingLink && (
                        <p className="text-xs text-primary-500 mt-2 flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin"/> جاري استخراج الإحداثيات من الرابط...
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">اسم المستلم (اختياري)</label>
                        <input type="text" value={formData.address.recipient_name} onChange={e => setFormData({...formData, address: {...formData.address, recipient_name: e.target.value}})} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">رقم المستلم</label>
                        <input type="text" value={formData.address.recipient_phone} onChange={e => setFormData({...formData, address: {...formData.address, recipient_phone: e.target.value}})} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" dir="ltr" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">المدينة</label>
                        <input type="text" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary-500 mb-1">الحي</label>
                        <input type="text" value={formData.address.district} onChange={e => setFormData({...formData, address: {...formData.address, district: e.target.value}})} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary-500 mb-1">الشارع والتفاصيل</label>
                      <input type="text" value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} className="w-full bg-primary-50/50 border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">ملاحظات للمندوب</label>
                  <textarea value={formData.driver_notes} onChange={e => setFormData({...formData, driver_notes: e.target.value})} rows={3} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">طريقة الدفع</label>
                    <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500">
                      <option value="cash_on_delivery">الدفع عند الاستلام</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">حالة الدفع</label>
                    <select value={formData.payment_status} onChange={e => setFormData({...formData, payment_status: e.target.value})} className="w-full bg-white border border-primary-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500">
                      <option value="pending">غير مدفوع</option>
                      <option value="paid">مدفوع</option>
                      <option value="refunded">مسترجع</option>
                    </select>
                  </div>
                </div>

                <div className="bg-primary-900 text-white p-6 rounded-2xl shadow-lg mt-6">
                  <h3 className="font-bold text-primary-100 mb-6 border-b border-primary-800 pb-3 flex items-center gap-2"><DollarSign className="w-5 h-5"/> ملخص الأسعار</h3>
                  
                  <div className="space-y-4 text-sm font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-300">المجموع الفرعي (مُحسَب تلقائياً من المنتجات)</span>
                      <span>{formData.subtotal.toFixed(2)} ر.س</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-primary-300">رسوم التوصيل</span>
                      <input type="number" min="0" step="0.01" value={formData.delivery_fee} onChange={e => setFormData({...formData, delivery_fee: parseFloat(e.target.value) || 0})} className="w-24 bg-primary-800 border border-primary-700 rounded-lg px-2 py-1 text-right text-white focus:ring-1 focus:ring-primary-400" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-primary-300">الخصم</span>
                      <input type="number" min="0" step="0.01" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="w-24 bg-primary-800 border border-primary-700 rounded-lg px-2 py-1 text-right text-white focus:ring-1 focus:ring-primary-400" />
                    </div>
                    
                    <div className="pt-4 border-t border-primary-800 flex justify-between items-center text-lg font-bold">
                      <span className="text-primary-200">الإجمالي النهائي</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.01" value={formData.total} onChange={e => setFormData({...formData, total: parseFloat(e.target.value) || 0})} className="w-28 bg-white text-primary-950 border border-transparent rounded-lg px-2 py-1 text-right font-bold focus:ring-2 focus:ring-primary-400" />
                        <span>ر.س</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </form>
        </div>

        <div className="p-6 border-t border-primary-100 bg-white flex justify-between gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button type="submit" form="edit-order-form" disabled={isLoading} className="flex-1 flex justify-center items-center gap-2 px-6 py-3 font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 rounded-xl transition-all disabled:opacity-50">
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> حفظ جميع التعديلات</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
