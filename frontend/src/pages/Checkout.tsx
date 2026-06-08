import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { adminSettingsApi, customerApi, publicProductsApi, storeApi, sharedOrderApi } from "../services/api";
import { normalizeSaudiPhone } from "../utils/phone";
import { CheckCircle2, ChevronRight, MapPin, CreditCard, ShoppingBag, Truck, Plus, X, Map as MapIcon, Zap, Clock, Info, Loader2 } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

const STORE_LOCATION = { lat: 25.4535688, lng: 49.5847893 }; // Actual Store Location
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function Checkout() {
  const { items, subtotal, clearCart, isSharedSession, sharedToken, exitSharedSession, isLoading: isCartLoading } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading, setUser, user } = useAuth();
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'ar'
  });

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  // Map State
  const [mapCenter, setMapCenter] = useState(STORE_LOCATION);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Delivery State
  const [deliveryType, setDeliveryType] = useState<'local' | 'pickup'>('local');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [deliveryMinutes, setDeliveryMinutes] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Queue State
  const [queueTimeMinutes, setQueueTimeMinutes] = useState<number>(0);
  const [isAsapAvailable, setIsAsapAvailable] = useState<boolean>(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);

  // Order State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  // New Address Form State
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: 'المنزل',
    recipient_name: '',
    recipient_phone: '',
    city: 'الأحساء',
    street_address: '',
    is_default: true,
    door_image: null as File | null,
    delivery_notes: '',
    google_maps_link: '',
  });

  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
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

  const cartPrepTime = items.reduce((sum, item) => sum + (item.quantity * (item.product.preparation_time_minutes || 0)), 0);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isAuthenticated) {
      loadAddresses();
    } else {
      setIsAddressesLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    loadQueueStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartPrepTime, deliveryType, deliverySpeed]);

  const loadQueueStatus = async () => {
    try {
      setIsQueueLoading(true);
      const data = await storeApi.getQueueStatus(cartPrepTime, deliveryType, deliverySpeed);
      setQueueTimeMinutes(data.queue_time_minutes || 0);
      setIsAsapAvailable(data.is_asap_available !== false);
      if (data.is_asap_available === false && !isScheduled) {
        setIsScheduled(true);
      }
    } catch (err) {
      console.error("Failed to load queue status", err);
    } finally {
      setIsQueueLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setIsAddressesLoading(true);
      const data = await customerApi.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddress = data.find((a: any) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    // Phone Validation (Saudi format: 05XXXXXXXX)
    const normalizedPhone = normalizeSaudiPhone(newAddress.recipient_phone);
    const phoneRegex = /^(05)[0-9]{8}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      setAddressError('رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.');
      return;
    }
    
    if (!newAddress.street_address || newAddress.street_address.trim() === '') {
      setAddressError('الرجاء تحديد الموقع من الخريطة أو كتابة تفاصيل العنوان.');
      return;
    }

    setIsSavingAddress(true);
    try {
      let finalLat = selectedLocation?.lat;
      let finalLng = selectedLocation?.lng;
      let finalStreetAddress = newAddress.street_address;

      if (!finalLat && newAddress.google_maps_link) {
        try {
          const res = await storeApi.expandUrl(newAddress.google_maps_link);
          if (res.latitude && res.longitude) {
            finalLat = parseFloat(res.latitude);
            finalLng = parseFloat(res.longitude);
            if (!finalStreetAddress || finalStreetAddress.trim() === '') {
              finalStreetAddress = `إحداثيات: ${finalLat.toFixed(4)}, ${finalLng.toFixed(4)}`;
            }
          }
        } catch (e) {
          console.error("Failed to expand map URL", e);
        }
      }

      const formData = new FormData();
      formData.append('name', newAddress.name);
      formData.append('recipient_name', newAddress.recipient_name);
      formData.append('recipient_phone', normalizedPhone);
      formData.append('city', newAddress.city);
      formData.append('street_address', finalStreetAddress);
      formData.append('is_default', newAddress.is_default ? '1' : '0');
      
      if (finalLat && finalLng) {
        formData.append('latitude', finalLat.toString());
        formData.append('longitude', finalLng.toString());
      }
      if (newAddress.google_maps_link) {
        formData.append('google_maps_link', newAddress.google_maps_link);
      }
      if (newAddress.delivery_notes) {
        formData.append('delivery_notes', newAddress.delivery_notes);
      }
      if (newAddress.door_image) {
        formData.append('door_image', newAddress.door_image);
      }

      if (!isAuthenticated) {
        const mockAddress = {
          id: Date.now(), // fake id for UI
          name: newAddress.name,
          recipient_name: newAddress.recipient_name,
          recipient_phone: normalizedPhone,
          city: newAddress.city,
          street_address: finalStreetAddress,
          latitude: finalLat,
          longitude: finalLng,
          google_maps_link: newAddress.google_maps_link,
          delivery_notes: newAddress.delivery_notes,
          is_mock: true
        };
        setAddresses([...addresses, mockAddress]);
        setSelectedAddressId(mockAddress.id);
      } else {
        if (editingAddressId) {
          const data = await customerApi.updateAddress(editingAddressId, formData);
          setAddresses(addresses.map(a => a.id === editingAddressId ? data : a));
          setSelectedAddressId(data.id);
        } else {
          const data = await customerApi.addAddress(formData);
          setAddresses([...addresses, data]);
          setSelectedAddressId(data.id);
        }
      }
      setIsAddressModalOpen(false);
      setEditingAddressId(null);
      setNewAddress({
        name: 'المنزل',
        recipient_name: '',
        recipient_phone: '',
        city: 'الأحساء',
        street_address: '',
        is_default: true,
        door_image: null,
        delivery_notes: '',
        google_maps_link: '',
      });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setAddressError('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مجدداً.');
      } else {
        setAddressError('حدث خطأ أثناء حفظ العنوان. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const selectedAddressForHash = addresses.find(a => a.id === selectedAddressId);
  const selectedAddressHash = selectedAddressForHash ? `${selectedAddressForHash.id}-${selectedAddressForHash.street_address}` : null;

  const getDeliveryFee = (mins: number) => {
    if (deliveryType === 'pickup') return 0;
    if (mins <= 6) return 15;
    if (mins <= 10) return 20;
    if (mins <= 13) return 25;
    if (mins <= 15) return 30;
    if (mins <= 27) return 35;
    if (mins <= 37) return 40;
    return 0;
  };

  const deliveryFeeBase = deliveryMinutes !== null && !isRejecting ? getDeliveryFee(deliveryMinutes) : 0;
  const hasDoorImageDiscount = selectedAddressForHash && selectedAddressForHash.door_image_path ? 2 : 0;
  const deliveryFeeSpeed = deliveryType === 'local' && deliverySpeed === 'express' ? deliveryFeeBase + 20 : deliveryFeeBase;
  const deliveryFee = Math.max(0, deliveryFeeSpeed - hasDoorImageDiscount);
  const total = subtotal + deliveryFee;

  const deliveryTimeAdded = deliveryType === 'pickup' ? 0 : (deliverySpeed === 'express' ? 60 : 240);
  const totalWaitTimeMinutes = queueTimeMinutes + cartPrepTime + deliveryTimeAdded;

  const loadSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const data = await storeApi.getAvailableSlots(cartPrepTime, deliveryType, deliverySpeed);
      setAvailableDays(data.available_days || []);
      
      if (data.available_days?.length > 0) {
        // If current selected date is not in the list, auto-select the first one
        const dateExists = data.available_days.some((d: any) => d.date === scheduledDate);
        if (!dateExists) {
          setScheduledDate(data.available_days[0].date);
          setScheduledTime('');
        }
      } else {
        setScheduledDate('');
        setScheduledTime('');
      }
    } catch (err) {
      console.error("Failed to load slots", err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (isScheduled && deliverySpeed === 'express') {
      setDeliverySpeed('standard');
    }
  }, [isScheduled, deliverySpeed]);

  useEffect(() => {
    if (isScheduled) {
      loadSlots();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScheduled, deliveryType, deliverySpeed, cartPrepTime]);

  const formatWaitTime = (mins: number) => {
    const roundedMins = Math.round(mins);
    if (roundedMins < 60) return `${roundedMins} دقيقة`;
    const hrs = Math.floor(roundedMins / 60);
    const m = roundedMins % 60;
    return m > 0 ? `${hrs} ساعة و ${m} دقيقة` : `${hrs} ساعة`;
  };

  const handleCalculateDelivery = () => {
    if (deliveryType === 'pickup') return;
    if (!selectedAddressId) return;
    
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    setIsCalculating(true);
    setIsRejecting(false);
    
    if (isLoaded && window.google) {
      const service = new google.maps.DistanceMatrixService();
      
      let destination: string | google.maps.LatLngLiteral = '';
      
      if (selectedAddress.latitude && selectedAddress.longitude) {
        destination = { lat: Number(selectedAddress.latitude), lng: Number(selectedAddress.longitude) };
      } else {
        destination = selectedAddress.street_address || '';
        
        if (!destination || (typeof destination === 'string' && destination.trim() === '')) {
          setIsCalculating(false);
          setDeliveryMinutes(15); // Fallback
          return;
        }
        
        // If the address was saved as coordinates
        if (typeof destination === 'string' && destination.startsWith('إحداثيات:')) {
          const coords = destination.replace('إحداثيات:', '').split(',');
          if (coords.length === 2) {
            destination = { lat: parseFloat(coords[0].trim()), lng: parseFloat(coords[1].trim()) };
          }
        } else if (typeof destination === 'string' && !destination.includes('السعودية') && !destination.includes('Saudi Arabia')) {
          destination = `${destination}, الأحساء, السعودية`;
        }
      }

      try {
        service.getDistanceMatrix({
          origins: [STORE_LOCATION],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
          setIsCalculating(false);
          if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
            const durationSeconds = response.rows[0].elements[0].duration.value;
            const minutes = Math.ceil(durationSeconds / 60);
            setDeliveryMinutes(minutes);
            if (minutes > 37) {
              setIsRejecting(true);
            }
          } else {
            // Fallback if API fails to find it exactly, use mock to not block the user entirely
            const fallbackMins = 15;
            setDeliveryMinutes(fallbackMins);
          }
        });
      } catch (err) {
        console.error('Distance Matrix Error:', err);
        setIsCalculating(false);
        setDeliveryMinutes(15); // Fallback
      }
    } else {
      setIsCalculating(false);
      setDeliveryMinutes(15); // Fallback
    }
  };

  useEffect(() => {
    if (deliveryType === 'pickup') {
      setDeliveryMinutes(0);
      setIsCalculating(false);
      setIsRejecting(false);
    } else if (selectedAddressId && isLoaded && addresses.length > 0) {
      handleCalculateDelivery();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, isLoaded, selectedAddressHash, deliveryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (deliveryType === 'local' && !selectedAddressId) {
      setError('الرجاء اختيار عنوان التوصيل');
      return;
    }
    if (deliveryType === 'local' && (deliveryMinutes === null || isRejecting)) {
      setError('الرجاء حساب رسوم التوصيل أولاً والتأكد من إمكانية التوصيل لموقعك.');
      return;
    }
    
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        setError('الرجاء اختيار تاريخ ووقت الجدولة');
        return;
      }
    }
    
    const saudiPhoneRegex = /^(05)[0-9]{8}$/;
    if (!ownerPhone || !saudiPhoneRegex.test(ownerPhone)) {
      setError('يرجى إدخال رقم جوال صاحب الطلب بشكل صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      const isMockAddress = selectedAddress?.is_mock;

      const payload = {
        address_id: (deliveryType === 'pickup' || isMockAddress) ? null : selectedAddressId,
        address: isMockAddress ? selectedAddress : null,
        payment_method: paymentMethod,
        delivery_date: isScheduled ? scheduledDate : null,
        scheduled_date: isScheduled ? scheduledDate : null,
        scheduled_time: isScheduled ? scheduledTime : null,
        delivery_type: deliveryType,
        delivery_speed: deliveryType === 'pickup' ? 'standard' : deliverySpeed,
        delivery_fee: deliveryFee,
        delivery_minutes: deliveryType === 'local' ? deliveryMinutes : 0,
        notes: notes || '',
        owner_name: ownerName || null,
        owner_phone: ownerPhone,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          gift_message: item.gift_message
        }))
      };
      
      let response;
      if (isSharedSession && sharedToken) {
        response = await sharedOrderApi.checkout(sharedToken, payload);
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          if (response.user) setUser(response.user);
        }
        exitSharedSession();
      } else {
        response = await publicProductsApi.checkout(payload);
      }
      
      clearCart();
      navigate(`/orders/${response.order.order_number}`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCartLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-screen bg-primary-50/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
        <p className="text-primary-800 font-medium">جاري تجهيز صفحة الدفع...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">سلة المشتريات فارغة</h2>
        <button onClick={() => navigate('/products')} className="text-primary-600 underline">تصفح المنتجات</button>
      </div>
    );
  }

  return (
    <div className="bg-primary-50/30 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="p-2 hover:bg-white rounded-xl transition-colors text-primary-600">
            <ChevronRight className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-primary-950">إتمام الطلب</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Details */}
          <div className="flex-1 space-y-6 w-full min-w-0">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Delivery Type Selection */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">طريقة الاستلام</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('local')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'local' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                >
                  <Truck className={`w-8 h-8 ${deliveryType === 'local' ? 'text-primary-600' : 'text-primary-400'}`} />
                  <span className="font-bold text-primary-900">توصيل للعنوان</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'pickup' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                >
                  <MapPin className={`w-8 h-8 ${deliveryType === 'pickup' ? 'text-primary-600' : 'text-primary-400'}`} />
                  <span className="font-bold text-primary-900">استلام من الفرع</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-primary-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-primary-900">وقت التجهيز</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAsapAvailable) setIsScheduled(false);
                      }}
                      disabled={!isAsapAvailable}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${!isScheduled ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'} ${!isAsapAvailable ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 hover:border-gray-200' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-primary-900">في أقرب وقت</span>
                        {!isScheduled && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                      </div>
                      <p className="text-sm text-primary-600">
                        {isAsapAvailable 
                          ? 'سيتم تجهيز طلبك فوراً حسب الطابور الحالي' 
                          : 'غير متاح حالياً (خارج أوقات العمل أو إجازة)'}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduled(true)}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${isScheduled ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-primary-900">مجدول لوقت لاحق 📅</span>
                        {isScheduled && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                      </div>
                      <p className="text-sm text-primary-600">اختر وقت محدد لاستلام/توصيل الطلب</p>
                    </button>
                  </div>
                  
                  {isScheduled && (
                    <div className="bg-white p-4 rounded-xl border border-primary-100 shadow-sm mt-4">
                      {isLoadingSlots ? (
                        <div className="text-center py-8 text-primary-500 font-bold">جاري تحميل الأوقات المتاحة...</div>
                      ) : availableDays.length === 0 ? (
                        <div className="text-center py-8 text-rose-500 font-bold">عذراً، لا توجد أوقات متاحة للجدولة حالياً بسبب امتلاء الطلبات أو عدم وجود أوقات عمل.</div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <label className="block text-sm font-bold text-primary-900 mb-3">تاريخ {deliveryType === 'local' ? 'التوصيل' : 'الاستلام'}</label>
                            <div className="flex flex-wrap gap-2">
                              {availableDays.map((day: any) => (
                                <button
                                  key={day.date}
                                  type="button"
                                  onClick={() => { setScheduledDate(day.date); setScheduledTime(''); }}
                                  className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border-2 transition-all whitespace-nowrap ${scheduledDate === day.date ? 'border-primary-600 bg-primary-600 text-white shadow-md' : 'border-primary-100 bg-primary-50 text-primary-700 hover:border-primary-300'}`}
                                >
                                  <span className="text-xs font-bold mb-1 opacity-90">{day.day_name}</span>
                                  <span className="text-lg font-bold">
                                    {new Date(day.date).getDate()}
                                  </span>
                                  <span className="text-xs font-medium opacity-90">
                                    {new Date(day.date).toLocaleDateString('ar-SA', { month: 'short' })}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {scheduledDate && (
                            <div>
                              <label className="block text-sm font-bold text-primary-900 mb-3">وقت {deliveryType === 'local' ? 'التوصيل' : 'الاستلام'}</label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {availableDays.find((d: any) => d.date === scheduledDate)?.slots.map((slot: string) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setScheduledTime(slot)}
                                    className={`py-2 px-1 rounded-xl text-sm font-bold border-2 transition-all ${scheduledTime === slot ? 'border-primary-600 bg-primary-50 text-primary-800 shadow-sm' : 'border-primary-100 text-primary-600 hover:border-primary-300 hover:bg-primary-50'}`}
                                  >
                                    <span dir="ltr">{slot}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>

              {deliveryType === 'local' && !isScheduled && (
                <div className="mt-6 pt-6 border-t border-primary-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-primary-900">سرعة التوصيل</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('standard')}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${deliverySpeed === 'standard' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-primary-900">توصيل عادي</span>
                        {deliverySpeed === 'standard' && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                      </div>
                      <p className="text-sm text-primary-600">خلال 4 ساعات كحد أقصى (تضاف رسوم التوصيل الأساسية)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('express')}
                      className={`p-4 rounded-xl border-2 text-right transition-all ${deliverySpeed === 'express' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-primary-900">توصيل سريع 🚀</span>
                        {deliverySpeed === 'express' && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                      </div>
                      <p className="text-sm text-primary-600">خلال ساعة واحدة (+20 ريال رسوم إضافية)</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Address Selection */}
            {deliveryType === 'local' && (
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-primary-900">التوصيل إلى</h2>
                </div>
                <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-sm font-semibold text-primary-700 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> عنوان جديد
                </button>
              </div>

              {isAddressesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-2xl border-2 border-primary-100 bg-primary-50/50 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-5 bg-primary-200 rounded-md w-1/3"></div>
                      </div>
                      <div className="h-4 bg-primary-100 rounded-md w-1/2 mb-2"></div>
                      <div className="h-4 bg-primary-100 rounded-md w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-primary-200 rounded-2xl">
                  <p className="text-primary-500 mb-4">ليس لديك عناوين محفوظة</p>
                  <button type="button" onClick={() => setIsAddressModalOpen(true)} className="px-6 py-2 bg-primary-800 text-white rounded-xl hover:bg-primary-900 transition-colors">
                    إضافة عنوان
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setDeliveryMinutes(null);
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedAddressId === address.id ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-primary-900">{address.name}</span>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddressId(address.id);
                              setNewAddress({
                                name: address.name || '',
                                recipient_name: address.recipient_name || '',
                                recipient_phone: address.recipient_phone || '',
                                city: address.city || 'الأحساء',
                                street_address: address.street_address || '',
                                is_default: address.is_default || false,
                                door_image: null,
                                delivery_notes: address.delivery_notes || ''
                              });
                              setIsAddressModalOpen(true);
                            }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                          >
                            تعديل
                          </button>
                          {selectedAddressId === address.id && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                        </div>
                      </div>
                      <p className="text-sm text-primary-700 font-medium mb-1">{address.recipient_name} - {address.recipient_phone}</p>
                      <p className="text-sm text-primary-500">{address.city} - {address.street_address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Owner Details */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">إسم صاحب الطلب (اختياري)</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="الاسم الذي سيظهر على الطلب..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary-900 mb-2">رقم جوال صاحب الطلب (إجباري)</label>
                  <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none text-left" dir="ltr" placeholder="05XXXXXXXX" required />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <label className="block text-sm font-bold text-primary-900 mb-2">ملاحظات أخرى للطلب (اختياري)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none resize-none" placeholder="مثال: ملاحظات عامة للطلب..." />
            </div>



            {/* Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">طريقة الدفع</h2>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}>
                  <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-900">تحويل بنكي</h3>
                    <p className="text-sm text-primary-500 mt-1">سيتم تزويدك بحساباتنا بعد إتمام الطلب</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-primary-400" />
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-[400px] w-full shrink-0">
            <div className="bg-white rounded-3xl border border-primary-100 shadow-sm p-6 sticky top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">ملخص الطلب</h2>
              </div>
              
              <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-50 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.primary_image ? (
                          <img src={`http://127.0.0.1:8000${item.product.primary_image.image_url}`} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-300"><ShoppingBag className="w-4 h-4"/></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-primary-500 mt-1">الكمية: {item.quantity}</p>
                        {item.gift_message && (
                          <div className="mt-2 bg-primary-50 border border-primary-100 rounded-lg p-2 text-xs">
                            <span className="font-bold text-primary-800 block mb-0.5">رسالة الإهداء:</span>
                            <p className="text-primary-600 line-clamp-2">"{item.gift_message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-sm text-primary-900 whitespace-nowrap">{item.product.price * item.quantity} ر.س</span>
                  </div>
                ))}
              </div>
              
              <hr className="border-primary-100 mb-6" />
              
              <div className="space-y-4 text-sm text-primary-700 mb-6">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{subtotal} ر.س</span>
                </div>
                {deliveryType === 'local' && (
                  <div className="flex justify-between">
                    <span>رسوم التوصيل</span>
                    <span className="font-medium">
                      {isCalculating ? (
                        <span className="animate-pulse text-primary-500">جاري الحساب...</span>
                      ) : (
                        `${deliveryFee} ر.س`
                      )}
                    </span>
                  </div>
                )}
                {hasDoorImageDiscount > 0 && deliveryType === 'local' && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>خصم صورة الباب 🎁</span>
                    <span>- {hasDoorImageDiscount} ر.س</span>
                  </div>
                )}
                {deliveryType === 'local' && !isCalculating && !isRejecting && deliveryMinutes !== null && (
                  <p className="text-xs text-primary-500 italic bg-primary-50 p-2 rounded-lg">* السعر والوقت للقيادة قد يختلف قليلاً مع الزحمة المرورية.</p>
                )}
              </div>

              {/* Time Breakdown Section */}
              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 mb-6 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="font-bold text-primary-900">تفاصيل الوقت المتوقع</span>
                </div>
                
                {queueTimeMinutes > 0 && !isScheduled && (
                  <div className="flex justify-between text-sm text-primary-700">
                    <div className="flex items-center gap-1">
                      <span>طابور الطلبات السابقة</span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-primary-400 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          بسبب وجود طلبات سابقة قيد التجهيز في المحل حالياً
                        </div>
                      </div>
                    </div>
                    <span className="font-medium text-amber-600">{formatWaitTime(queueTimeMinutes)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-primary-700">
                  <span>تجهيز منتجاتك</span>
                  <span className="font-medium text-primary-600">{formatWaitTime(cartPrepTime)}</span>
                </div>

                {deliveryType === 'local' && (
                  <div className="flex justify-between text-sm text-primary-700">
                    <span>التوصيل المتوقع</span>
                    <span className="font-medium text-primary-600">{formatWaitTime(deliveryTimeAdded)}</span>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-primary-200 flex justify-between items-center">
                  <span className="font-bold text-primary-900">الوقت الإجمالي المتوقع</span>
                  <span className="font-bold text-accent-700">{formatWaitTime(totalWaitTimeMinutes)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border-2 border-primary-500 shadow-sm">
                <span className="font-bold text-primary-900">الإجمالي النهائي</span>
                <span className="font-bold text-accent-700 text-2xl">{isCalculating ? '---' : total} ر.س</span>
              </div>
              
              {isRejecting && deliveryType === 'local' && (
                <div className="mb-6 bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-600">
                  <p className="font-bold mb-1">نعتذر منك!</p>
                  <p>المسافة لعنوانك ({deliveryMinutes} دقيقة) تتجاوز النطاق المسموح به للتوصيل.</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading || isCalculating || (deliveryType === 'local' && isRejecting) || (deliveryType === 'local' && !selectedAddressId)}
                className="w-full bg-primary-800 text-white rounded-xl py-4 font-bold text-lg hover:bg-primary-900 active:bg-primary-950 transition-all shadow-lg shadow-primary-900/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-pulse">جاري تأكيد الطلب...</span>
                ) : (
                  <>
                    تأكيد الطلب 
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {isCalculating && (
                <p className="text-center text-sm text-primary-500 mt-4 font-medium animate-pulse">جاري حساب التوصيل، يرجى الانتظار...</p>
              )}
              
              <p className="text-center text-xs text-primary-400 mt-4">بضغطك على "تأكيد الطلب" أنت توافق على شروط وأحكام المتجر.</p>
            </div>
          </div>
        </form>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50 shrink-0">
                <h3 className="text-xl font-bold text-primary-900">{editingAddressId ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</h3>
                <button onClick={() => setIsAddressModalOpen(false)} className="p-2 hover:bg-white rounded-full text-primary-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto">
                {addressError && (
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 border border-rose-100">
                    {addressError}
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Google Maps Link or Button */}
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">رابط قوقل ماب (اختياري)</label>
                      <input 
                        type="url" 
                        value={newAddress.google_maps_link || ''} 
                        onChange={e => setNewAddress({...newAddress, google_maps_link: e.target.value})} 
                        onBlur={e => extractFromLink(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" 
                        placeholder="https://maps.google.com/..." 
                        dir="ltr"
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
                        className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 p-4 rounded-xl font-bold transition-colors"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم للعنوان (مثال: المنزل، العمل)</label>
                      <input required value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم المستلم (اختياري)</label>
                      <input value={newAddress.recipient_name} onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">رقم جوال المستلم</label>
                      <input required type="tel" value={newAddress.recipient_phone} onChange={e => setNewAddress({...newAddress, recipient_phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">المدينة</label>
                      <select required disabled value={newAddress.city} className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 outline-none text-primary-600">
                        <option value="الأحساء">الأحساء (متاح حالياً فقط)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم الحي والشارع</label>
                      <input required value={newAddress.street_address} onChange={e => setNewAddress({...newAddress, street_address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" placeholder="الرجاء استخدام زر الخريطة أو كتابة العنوان" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">صورة لباب المنزل (احصل على خصم 2 ريال! 🎁)</label>
                      <input type="file" accept="image/*" onChange={e => setNewAddress({...newAddress, door_image: e.target.files ? e.target.files[0] : null})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none bg-emerald-50 text-emerald-800" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">ملاحظات إضافية للتوصيل (اختياري)</label>
                      <textarea value={newAddress.delivery_notes} onChange={e => setNewAddress({...newAddress, delivery_notes: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none resize-none" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button type="submit" disabled={isSavingAddress} className="flex-1 py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70">
                    {isSavingAddress ? 'جاري الحفظ...' : 'حفظ العنوان'}
                  </button>
                  {editingAddressId && (
                    <button 
                      type="button" 
                      disabled={isSavingAddress} 
                      onClick={async () => {
                        if (confirm('هل أنت متأكد من حذف هذا العنوان؟')) {
                          setIsSavingAddress(true);
                          try {
                            await customerApi.deleteAddress(editingAddressId);
                            setAddresses(addresses.filter(a => a.id !== editingAddressId));
                            if (selectedAddressId === editingAddressId) setSelectedAddressId(null);
                            setIsAddressModalOpen(false);
                          } catch (e) {
                            alert('فشل الحذف');
                          } finally {
                            setIsSavingAddress(false);
                          }
                        }
                      }}
                      className="px-6 py-4 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors disabled:opacity-70"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Maps Real Modal */}
      <AnimatePresence>
        {isMapModalOpen && isLoaded && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMapModalOpen(false)} />
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold flex items-center gap-2"><MapIcon className="w-5 h-5 text-emerald-600"/> تحديد الموقع</h3>
                <div className="flex items-center gap-2">
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
                  <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
              </div>
              
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
                          setNewAddress({...newAddress, street_address: results[0].formatted_address});
                        } else {
                          setNewAddress({...newAddress, street_address: `إحداثيات: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`});
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
