import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../store/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-lavender-50/50 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-lavender-50 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-text-light" />
              </button>

              <div className="hidden md:flex items-center gap-2 bg-lavender-50 rounded-xl px-4 py-2.5 w-80">
                <Search className="w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="بحث..."
                  className="bg-transparent text-sm outline-none w-full placeholder:text-text-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl hover:bg-lavender-50 transition-colors cursor-pointer">
                <Bell className="w-5 h-5 text-text-light" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
              </button>

              {/* Admin Profile */}
              <div className="flex items-center gap-3 pr-3 border-r border-border">
                <div className="text-left">
                  <p className="text-sm font-semibold text-text">{user?.name || 'المدير'}</p>
                  <p className="text-xs text-text-muted">مدير النظام</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-lavender-500/25">
                  {user?.name?.charAt(0) || 'م'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
