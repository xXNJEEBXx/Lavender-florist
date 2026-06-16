import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Image as ImageIcon, Loader2, Bot, PlusCircle, CheckCircle2, Box } from 'lucide-react';
import { aiChatApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sessionId, setSessionId] = useState(() => {
    let stored = localStorage.getItem('ai_session_id');
    if (!stored) {
      stored = 'web_admin_' + (localStorage.getItem('admin_id') || '1') + '_' + Date.now();
      localStorage.setItem('ai_session_id', stored);
    }
    return stored;
  });

  const fetchHistory = async () => {
    try {
      const res = await aiChatApi.getHistory(sessionId);
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsHistoryLoaded(true);
    }
  };

  useEffect(() => {
    if (isOpen && !isHistoryLoaded) {
      fetchHistory();
    }
  }, [isOpen, sessionId, isHistoryLoaded]);

  const handleNewChat = () => {
    const newSessionId = 'web_admin_' + (localStorage.getItem('admin_id') || '1') + '_' + Date.now();
    localStorage.setItem('ai_session_id', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setIsHistoryLoaded(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const userMessage = { role: 'user', content: input, image: image ? URL.createObjectURL(image) : null };
    setMessages(prev => [...prev, userMessage]);
    
    const formData = new FormData();
    formData.append('session_id', sessionId);
    if (input.trim()) formData.append('message', input);
    if (image) formData.append('image', image);

    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      const res = await aiChatApi.sendMessage(formData);
      if (res.status === 'success') {
        const aiMessages = res.responses.map((r: any) => ({
          role: r.type === 'system_alert' ? 'system_alert' : 'model',
          content: r.type === 'text' || r.type === 'system_alert' ? r.content : '',
          uiCard: r.type === 'ui_card' ? r.data : null
        }));
        setMessages(prev => [...prev, ...aiMessages]);
      } else {
        toast.error('حدث خطأ في معالجة طلبك');
      }
    } catch (err) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-primary-700 hover:scale-105 transition-all z-40"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-100"
          >
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">مساعد لافندر الذكي</h3>
                  <p className="text-xs text-primary-100">متصل وجاهز للمساعدة</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleNewChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs" title="محادثة جديدة">
                  <PlusCircle className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {!isHistoryLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
                  <p className="text-xs mt-2">يمكنك طلب إضافة منتج، تفقد المخزون، والمزيد.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  msg.role === 'system_alert' ? (
                    <div key={idx} className="flex justify-center my-4">
                      <div className="bg-gray-100 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tl-none' : 'bg-white text-gray-800 rounded-tr-none shadow-sm border border-gray-100'}`}>
                    {msg.image && <img src={msg.image} alt="Attachment" className="w-full h-32 object-cover rounded-lg mb-2" />}
                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    
                    {/* UI Cards rendering */}
                    {msg.uiCard && msg.uiCard.card_type === 'product' && (
                      <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex gap-3">
                          {msg.uiCard.product.image_url ? (
                            <img src={msg.uiCard.product.image_url} alt={msg.uiCard.product.name} className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">{msg.uiCard.product.name}</h4>
                            <p className="text-primary-600 font-bold text-sm">{msg.uiCard.product.price} ر.س</p>
                            <p className="text-xs text-gray-500 mt-1">المخزون: {msg.uiCard.product.stock}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {msg.uiCard && msg.uiCard.card_type === 'component' && (
                      <div className="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-lg flex items-center justify-center">
                            <Box className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">{msg.uiCard.component.name}</h4>
                            <p className="text-indigo-600 text-xs font-bold mt-1">الفئة: {msg.uiCard.component.category}</p>
                            <p className="text-xs text-gray-500 mt-1">المخزون المتوفر: {msg.uiCard.component.stock_quantity}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )
              )))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tr-none p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-xs text-gray-500">جاري التفكير...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {image && (
                <div className="mb-3 relative inline-block">
                  <img src={URL.createObjectURL(image)} alt="Preview" className="h-16 rounded-lg border border-gray-200" />
                  <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => document.getElementById('ai-image-upload')?.click()}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  id="ai-image-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => e.target.files && setImage(e.target.files[0])} 
                />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل المساعد الذكي..."
                  className="flex-1 bg-gray-100 border-none px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !image)}
                  className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
