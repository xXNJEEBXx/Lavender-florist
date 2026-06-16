import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AiChatWidget from '../admin/AiChatWidget';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="min-h-screen bg-primary-50/30 flex dir-rtl overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed width */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content - Takes remaining space with padding for sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:mr-64 mr-0' : 'mr-0'}`}>
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-primary-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-900 font-serif hidden sm:block">لوحة التحكم</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=F3E8FF&color=4C1D95" alt="Admin" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-primary-900">مدير النظام</div>
              <div className="text-xs text-primary-500">admin@lavender.com</div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 w-full max-w-full">
          <Outlet />
        </main>
      </div>
      
      {/* AI Assistant available only in Admin Layout */}
      <AiChatWidget />
    </div>
  );
}
