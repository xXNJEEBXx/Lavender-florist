import { Outlet, Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-primary-50/30 flex dir-rtl">
      {/* Sidebar - fixed width */}
      <AdminSidebar />
      
      {/* Main Content - Takes remaining space with padding for sidebar */}
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-primary-100 px-8 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-xl font-bold text-primary-900 font-serif">لوحة التحكم</h1>
          
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
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
