import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, MapPin, Calendar, Clock, DollarSign, Send, CheckCircle2, User, AlertTriangle, Link as LinkIcon, Plus, Trash2, Map as MapIcon, RefreshCw, Loader2 } from 'lucide-react';
import { adminProductsApi, adminOrdersApi, storeApi, adminSettingsApi } from '../../services/api';
import { normalizeSaudiPhone } from '../../utils/phone';
import toast from 'react-hot-toast';

import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import Modal from '../../components/ui/Modal';

const STORE_LOCATION = { lat: 25.3857, lng: 49.5898 };

export default function ManualOrder() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [slotsData, setSlotsData] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    language: 'ar'
  });

  // Form State
  const [items, setItems] = useState<any[]>([{ product_id: '', quantity: 1, gift_message: '' }]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  const [deliveryType, setDeliveryType] = useState('local');
  const [deliverySpeed, setDeliverySpeed] = useState('standard');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({ city: 'الأحساء', street_address: '', google_maps_link: '', latitude: null as number|null, longitude: null as number|null });
  
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(STORE_LOCATION);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isExtractingLink, setIsExtractingLink] = useState(false);

  const extractFromLink = async (link: string) => {
    if (!link || !link.includes('http')) return;
    setIsExtractingLink(true);
    try {
      const res = await storeApi.expandUrl(link);
      if (res.latitude && res.longitude) {
        const lat = parseFloat(res.latitude);
        const lng = parseFloat(res.longitude);
        setSelectedLocation({ lat, lng });
        setMapCenter({ lat, lng });
        setNewAddress(prev => ({ ...prev, latitude: lat, longitude: lng }));
        
        // Reverse Geocode to get street name and neighborhood
        if (window.google) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setNewAddress(prev => ({...prev, street_address: results[0].formatted_address}));
            }
          });
        } else {
          setNewAddress(prev => ({...prev, street_address: `إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`}));
        }
      }
    } catch (e) {
      console.error("Failed to extract map URL", e);
    } finally {
      setIsExtractingLink(false);
    }
  };
  
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number|string>(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  const [generatedLink, setGeneratedLink] = useState('');
  const [draftToken, setDraftToken] = useState('');
  const [draftStatus, setDraftStatus] = useState('pending'); // pending, completed

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    adminProductsApi.getAll().then(res => setProducts(res.data || res));
    adminSettingsApi.getWorkingHours().then(res => setWorkingHours(res.data || [])).catch(() => {});
  }, []);

  const cartPrepTime = items.reduce((sum, item) => {
    const p = products.find(prod => prod.id === parseInt(item.product_id));
    return sum + (item.quantity * (p?.preparation_time_minutes || 0));
  }, 0);

  useEffect(() => {
    storeApi.getAvailableSlots(cartPrepTime || 45, deliveryType, deliverySpeed).then(res => setSlotsData(res));
  }, [cartPrepTime, deliveryType, deliverySpeed]);

  // Sync Draft Updates (Debounced)
  useEffect(() => {
    if (draftToken && draftStatus === 'pending') {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      
      updateTimeoutRef.current = setTimeout(() => {
        const syncDraft = async () => {
          setIsSyncing(true);
          try {
            const payload = {
              customer_phone: customerPhone,
              customer_name: customerName,
              delivery_type: deliveryType,
              delivery_speed: deliverySpeed,
              delivery_date: scheduledDate || null,
              scheduled_time: scheduledTime || null,
              delivery_fee: Number(deliveryFee) || 0,
              payment_method: paymentMethod,
              notes: notes,
              items: items.filter(i => i.product_id),
              address_id: selectedAddressId === 'new' ? null : (selectedAddressId || null),
              address: selectedAddressId === 'new' ? newAddress : null
            };
            await adminOrdersApi.updateDraft(draftToken, payload);
          } catch (e) {
            console.error('Failed to sync draft', e);
          } finally {
            setIsSyncing(false);
          }
        };
        syncDraft();
      }, 1000);
    }
    
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [
    items, customerPhone, customerName, deliveryType, deliverySpeed, 
    scheduledDate, scheduledTime, deliveryFee, paymentMethod, notes, 
    selectedAddressId, newAddress, draftToken, draftStatus
  ]);

  // Poll Draft State
  useEffect(() => {
    if (!draftToken || draftStatus === 'completed') return;

    const poll = setInterval(async () => {
      try {
        const res = await adminOrdersApi.getDraft(draftToken);
        if (res.status === 'completed') {
          setDraftStatus('completed');
          toast.success('قام العميل بإكمال الطلب وتم حفظه بنجاح!');
          clearInterval(poll);
        } else {
          // You could optionally update local state from `res` here if the customer changed things, 
          // but we prioritize Admin's input. For now, just detecting completion is fine.
        }
      } catch (err) {
        // If 404, might be completed and is_draft = false
        setDraftStatus('completed');
        toast.success('تم تحويل الطلب إلى طلب نهائي');
        clearInterval(poll);
      }
    }, 5000);

    return () => clearInterval(poll);
  }, [draftToken, draftStatus]);

  const handleSearchCustomer = async () => {
    const normalizedPhone = normalizeSaudiPhone(customerPhone);
    if (!normalizedPhone) return;
    setIsLoading(true);
    try {
      const res = await adminOrdersApi.searchCustomer(normalizedPhone);
      if (res.found) {
        setCustomerName(res.customer.name);
        setSavedAddresses(res.customer.addresses || []);
        setIsCustomerFound(true);
        toast.success('تم العثور على بيانات العميل');
      } else {
        setCustomerName('');
        setSavedAddresses([]);
        setIsCustomerFound(false);
        toast.error('لم يتم العثور على عميل بهذا الرقم، سيتم تسجيله كعميل جديد.');
      }
    } catch (e) {
      toast.error('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryFee = (mins: number) => {
    if (deliveryType === 'pickup') return 0;
    if (mins <= 6) return 15;
    if (mins <= 10) return 20;
    if (mins <= 13) return 25;
    if (mins <= 15) return 30;
    if (mins <= 27) return 35;
    if (mins <= 37) return 40;
    return 40; // Default max
  };

  const handleCalculateFee = () => {
    if (deliveryType === 'pickup') {
      setDeliveryFee(0);
      return;
    }
    
    let destination: any = null;
    if (selectedAddressId && selectedAddressId !== 'new') {
      const addr = savedAddresses.find(a => a.id === parseInt(selectedAddressId) || a.id === selectedAddressId);
      if (addr?.latitude && addr?.longitude) destination = { lat: addr.latitude, lng: addr.longitude };
      else destination = addr?.street_address;
    } else {
      if (newAddress.latitude && newAddress.longitude) destination = { lat: newAddress.latitude, lng: newAddress.longitude };
      else if (newAddress.street_address) destination = `${newAddress.street_address}, ${newAddress.city}, السعودية`;
    }

    if (!destination || !isLoaded || !window.google) {
      toast.error('يرجى تحديد العنوان أو الرابط أولاً ليتم حساب التوصيل، أو أدخل القيمة يدوياً');
      return;
    }

    setIsCalculatingFee(true);
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [STORE_LOCATION],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
      setIsCalculatingFee(false);
      if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
        const mins = Math.ceil(response.rows[0].elements[0].duration.value / 60);
        let fee = getDeliveryFee(mins);
        if (deliverySpeed === 'express') fee += 20;
        setDeliveryFee(fee);
        toast.success(`تم حساب قيمة التوصيل: ${fee} ر.س (المسافة تستغرق ${mins} دقيقة)`);
      } else {
        toast.error('لم نتمكن من حساب التوصيل للموقع المحدد، يرجى الإدخال يدوياً');
      }
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === parseInt(item.product_id));
      return sum + (p ? p.price * item.quantity : 0);
    }, 0);
  };

  const total = calculateSubtotal() + Number(deliveryFee || 0);

  const handleGenerateLink = async (isCheckoutLink = false) => {
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    
    const saudiPhoneRegex = /^(05)[0-9]{8}$/;
    if (!customerPhone || !saudiPhoneRegex.test(customerPhone)) {
      toast.error('يرجى إدخال رقم جوال صحيح للعميل (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        customer_phone: customerPhone,
        customer_name: customerName,
        delivery_type: deliveryType,
        delivery_speed: deliverySpeed,
        delivery_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        items: validItems
      };
      const res = await adminOrdersApi.createDraft(payload);
      const link = isCheckoutLink ? `${res.link}?checkout=true` : res.link;
      setGeneratedLink(link);
      setDraftToken(res.token);
      setDraftStatus('pending');
      toast.success('تم إنشاء المسودة والرابط بنجاح! يتم الآن المزامنة التلقائية مع العميل.');
    } catch (e) {
      toast.error('حدث خطأ أثناء إنشاء الرابط');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectSave = async () => {
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('يجب اختيار منتج واحد على الأقل');
      return;
    }
    
    const saudiPhoneRegex = /^(05)[0-9]{8}$/;
    if (!customerPhone || !saudiPhoneRegex.test(customerPhone)) {
      toast.error('يرجى إدخال رقم جوال صحيح للعميل للحفظ المباشر (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        customer_phone: customerPhone,
        customer_name: customerName,
        delivery_type: deliveryType,
        delivery_speed: deliverySpeed,
        delivery_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        delivery_fee: Number(deliveryFee) || 0,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes: notes,
        items: validItems,
        address_id: selectedAddressId === 'new' ? null : selectedAddressId,
        address: selectedAddressId === 'new' ? newAddress : null
      };

      const res = await adminOrdersApi.checkoutManual(payload);
      toast.success(`تم حفظ الطلب بنجاح. رقم الطلب: ${res.order.order_number}`);
      setDraftStatus('completed');
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('تم نسخ الرابط');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-primary-100">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">إضافة طلب يدوي جديد</h1>
          <p className="text-sm text-primary-500 mt-1">إنشاء طلب مباشر أو إرسال رابط للعميل</p>
        </div>
        
        {draftToken && draftStatus === 'pending' && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-medium border border-emerald-200">
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
            <span className="text-sm">جلسة مشتركة نشطة (تحديث تلقائي)</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Customer Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary-50">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">بيانات العميل</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-primary-900 mb-2">رقم الجوال *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="flex-1 p-3 border border-primary-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-left dir-ltr"
                  />
                  <button onClick={handleSearchCustomer} disabled={isLoading || !customerPhone} className="bg-primary-800 text-white px-4 rounded-xl hover:bg-primary-900 disabled:opacity-50 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-primary-900 mb-2">اسم العميل (اختياري)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary-50">
              <Package className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">المنتجات</h2>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-primary-100 rounded-xl bg-primary-50/30">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-primary-600 mb-1">المنتج</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].product_id = e.target.value;
                        setItems(newItems);
                      }}
                      className="w-full p-2.5 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">اختر منتجاً...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.price} ر.س</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-24">
                    <label className="block text-xs font-bold text-primary-600 mb-1">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = parseInt(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-full p-2.5 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-bold text-primary-600 mb-1">رسالة الإهداء (اختياري)</label>
                    <input
                      type="text"
                      value={item.gift_message}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].gift_message = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="رسالة مع الورد..."
                      className="w-full p-2.5 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    className="mt-6 md:mt-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center self-end"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => setItems([...items, { product_id: '', quantity: 1, gift_message: '' }])}
                className="w-full py-3 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 font-bold hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة منتج آخر
              </button>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary-50">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">التوصيل والعنوان</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setDeliveryType('local')}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-colors ${deliveryType === 'local' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-primary-100 text-primary-500 hover:border-primary-300'}`}
              >
                توصيل للعنوان
              </button>
              <button
                type="button"
                onClick={() => { setDeliveryType('pickup'); setDeliveryFee(0); }}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-colors ${deliveryType === 'pickup' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-primary-100 text-primary-500 hover:border-primary-300'}`}
              >
                استلام من الفرع
              </button>
            </div>

            {deliveryType === 'local' && (
              <>
                <div className="space-y-4 mb-6">
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">العنوان المفضل</label>
                      <select 
                        value={selectedAddressId} 
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">اختر من العناوين المحفوظة...</option>
                        {savedAddresses.map(a => (
                          <option key={a.id} value={a.id}>{a.name} - {a.city} - {a.street_address}</option>
                        ))}
                        <option value="new">+ إدخال عنوان جديد</option>
                      </select>
                    </div>
                  )}

                  {(!savedAddresses.length || selectedAddressId === 'new') && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-900 mb-2">رابط خرائط جوجل (إن وجد)</label>
                        <input 
                          type="url" 
                          value={newAddress.google_maps_link || ''} 
                          onChange={e => setNewAddress({...newAddress, google_maps_link: e.target.value})} 
                          onBlur={e => extractFromLink(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 outline-none text-left dir-ltr" 
                          placeholder="https://maps.google.com/..." 
                        />
                        {isExtractingLink && (
                          <p className="text-sm text-primary-500 mt-2 flex items-center gap-1 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin"/> جاري استخراج العنوان من الرابط...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-primary-100"></div>
                        <span className="text-xs text-primary-400 font-bold">أو</span>
                        <div className="flex-1 h-px bg-primary-100"></div>
                      </div>
                      <div>
                        <button 
                          type="button" 
                          onClick={() => setIsMapModalOpen(true)}
                          className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 p-3 rounded-lg font-bold transition-colors"
                        >
                          <MapIcon className="w-5 h-5" />
                          تحديد الموقع عبر الخريطة
                        </button>
                        {(newAddress.street_address || '').includes('تم تحديد الموقع') && (
                          <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4"/> تم تحديد الموقع بنجاح
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-900 mb-2 mt-4">وصف العنوان</label>
                        <input
                          type="text"
                          placeholder="الشارع، الحي، المعالم..."
                          value={newAddress.street_address}
                          onChange={e => setNewAddress({...newAddress, street_address: e.target.value})}
                          className="w-full p-2.5 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-primary-900 mb-2">قيمة التوصيل (ر.س)</label>
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button 
                      onClick={handleCalculateFee} 
                      disabled={isCalculatingFee}
                      className="bg-primary-100 text-primary-800 px-4 py-3 rounded-xl font-bold hover:bg-primary-200 transition-colors flex items-center gap-2"
                    >
                      {isCalculatingFee ? <Clock className="w-5 h-5 animate-spin" /> : <MapIcon className="w-5 h-5" />}
                      حساب تلقائي
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary-50">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">توقيت الطلب</h2>
            </div>
            
            {slotsData?.available_days && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setScheduledDate(''); setScheduledTime(''); }}
                  className={`px-4 py-2 shrink-0 rounded-xl border-2 font-bold transition-colors ${!scheduledDate ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-primary-100 text-primary-500 hover:border-primary-300'}`}
                >
                  الآن (أقرب وقت)
                </button>
                {slotsData.available_days.map((day: any) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => { setScheduledDate(day.date); setScheduledTime(''); }}
                    className={`px-4 py-2 shrink-0 rounded-xl border-2 font-bold transition-colors ${scheduledDate === day.date ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-primary-100 text-primary-500 hover:border-primary-300'}`}
                  >
                    {day.day_name} {day.date.substring(5)}
                  </button>
                ))}
              </div>
            )}
            
            {scheduledDate && slotsData?.available_days && (
              <div className="flex flex-wrap gap-2">
                {slotsData.available_days.find((d: any) => d.date === scheduledDate)?.slots.map((slot: string) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setScheduledTime(slot)}
                    className={`py-2 px-3 text-sm rounded-lg border font-bold transition-colors ${scheduledTime === slot ? 'bg-primary-500 border-primary-500 text-white shadow-sm' : 'border-primary-200 text-primary-700 hover:border-primary-400 hover:bg-primary-50'}`}
                  >
                    <span dir="ltr">{slot}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary-50">
              <DollarSign className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">الدفع والملاحظات</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-primary-900 mb-2">طريقة الدفع</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500">
                  <option value="cash_on_delivery">الدفع عند الاستلام</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-primary-900 mb-2">حالة الدفع (للمشرف فقط)</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500">
                  <option value="pending">معلق (لم يتم الدفع)</option>
                  <option value="paid">مدفوع ومؤكد</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-primary-900 mb-2">ملاحظات الطلب (للمتجر)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية بخصوص الطلب..."
                className="w-full p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              />
            </div>
          </div>
          
        </div>

        {/* Sidebar Summary & Actions */}
        <div className="lg:w-96 shrink-0">
          <div className="bg-white rounded-2xl border border-primary-100 shadow-lg p-6 sticky top-28">
            <h2 className="text-xl font-bold text-primary-900 mb-6 border-b border-primary-50 pb-4">ملخص الفاتورة</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-primary-700">
                <span>المنتجات ({items.filter(i=>i.product_id).length})</span>
                <span className="font-bold">{calculateSubtotal()} ر.س</span>
              </div>
              <div className="flex justify-between text-primary-700">
                <span>رسوم التوصيل</span>
                <span className="font-bold">{deliveryFee} ر.س</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-4 border-t border-b border-primary-100 mb-8 bg-primary-50/50 -mx-6 px-6">
              <span className="font-bold text-primary-900 text-lg">الإجمالي</span>
              <span className="font-bold text-accent-700 text-2xl">{total} ر.س</span>
            </div>

            {/* Link Generation Result */}
            {generatedLink && draftStatus === 'pending' && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-emerald-900 mb-1">تم إنشاء الجلسة المشتركة!</h3>
                <p className="text-xs text-emerald-700 mb-4">انسخ الرابط وأرسله للعميل. أي تعديل تقوم به الآن سينعكس لديه فوراً.</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={generatedLink} className="flex-1 text-xs p-2 border border-emerald-200 rounded bg-white" dir="ltr" />
                  <button onClick={copyToClipboard} className="bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700">نسخ</button>
                </div>
              </div>
            )}
            
            {draftStatus === 'completed' && (
              <div className="mb-6 p-4 bg-primary-100 rounded-xl text-center font-bold text-primary-800">
                هذا الطلب مكتمل ومسجل في النظام.
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleGenerateLink(false)}
                disabled={isLoading || draftStatus === 'completed'}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary-600 text-primary-700 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-5 h-5" />
                رابط متابعة من الصفحة الرئيسية
              </button>
              
              <button
                onClick={() => handleGenerateLink(true)}
                disabled={isLoading || draftStatus === 'completed' || items.filter(i => i.product_id && i.quantity > 0).length === 0 || !/^(05)[0-9]{8}$/.test(customerPhone)}
                className="w-full flex items-center justify-center gap-2 bg-accent-50 border-2 border-accent-600 text-accent-700 py-3 rounded-xl font-bold hover:bg-accent-100 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-5 h-5" />
                رابط إلى السلة والدفع
              </button>
              
              <button
                onClick={handleDirectSave}
                disabled={isLoading || draftStatus === 'completed'}
                className="w-full flex items-center justify-center gap-2 bg-primary-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-900 shadow-lg shadow-primary-900/10 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                حفظ الطلب مباشرة
              </button>
            </div>
            
            <p className="text-center text-xs text-primary-400 mt-4">
              "إنشاء رابط للعميل" سيحفظ الطلب كـمسودة ويرسل رابط للعميل لإكماله وتأكيده بنفسه.
            </p>
          </div>
        </div>

      </div>

      <Modal
        isOpen={isMapModalOpen && isLoaded}
        onClose={() => setIsMapModalOpen(false)}
        size="2xl"
        title={<span className="font-bold flex items-center gap-2"><MapIcon className="w-5 h-5 text-emerald-600"/> تحديد الموقع</span>}
        headerAction={
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const pos = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    };
                    setMapCenter(pos);
                    setSelectedLocation(pos);
                  },
                  () => {
                    alert("لم نتمكن من تحديد موقعك. تأكد من إعطاء الصلاحية للمتصفح.");
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
              } else {
                alert("المتصفح الخاص بك لا يدعم تحديد الموقع.");
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MapPin className="w-4 h-4" /> موقعي الحالي
          </button>
        }
      >
        <div className="flex flex-col">
              <div className="h-[400px] w-full relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                  onClick={(e) => {
                    if (e.latLng) {
                      setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    }
                  }}
                >
                  {selectedLocation && (
                    <Marker position={selectedLocation} />
                  )}
                </GoogleMap>
              </div>
              
              <div className="p-6 bg-white flex justify-end gap-3 border-t border-gray-100">
                <button 
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  disabled={!selectedLocation}
                  onClick={() => {
                    if (selectedLocation) {
                      // Reverse Geocode
                      const geocoder = new google.maps.Geocoder();
                      geocoder.geocode({ location: selectedLocation }, (results, status) => {
                        if (status === 'OK' && results && results[0]) {
                          setNewAddress({...newAddress, latitude: selectedLocation.lat, longitude: selectedLocation.lng, street_address: results[0].formatted_address});
                        } else {
                          setNewAddress({...newAddress, latitude: selectedLocation.lat, longitude: selectedLocation.lng, street_address: `إحداثيات: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`});
                        }
                        setIsMapModalOpen(false);
                      });
                    }
                  }}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  تأكيد الموقع
                </button>
              </div>
        </div>
      </Modal>

    </div>
  );
}
