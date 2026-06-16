import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminActivityLogsApi, dashboardApi } from '../../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Package,
  Activity,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      adminActivityLogsApi.getAll()
    ])
    .then(([statsData, logsData]) => {
      setDashboardData(statsData);
      setActivityLogs(logsData);
    })
    .catch(err => console.error("Failed to load dashboard data", err))
    .finally(() => setIsLoading(false));
  }, []);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'created': return <PlusCircle size={16} className="text-emerald-500" />;
      case 'updated': return <Edit size={16} className="text-blue-500" />;
      case 'deleted': return <Trash2 size={16} className="text-red-500" />;
      default: return <Activity size={16} className="text-primary-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-emerald-50 border-emerald-100';
      case 'updated': return 'bg-blue-50 border-blue-100';
      case 'deleted': return 'bg-red-50 border-red-100';
      default: return 'bg-primary-50 border-primary-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    { title: 'إجمالي المبيعات', value: dashboardData?.stats?.sales?.value || '0', icon: <DollarSign size={24} />, trend: dashboardData?.stats?.sales?.trend || '0%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'صافي الربح', value: dashboardData?.stats?.netProfit?.value || '0', icon: <DollarSign size={24} />, trend: dashboardData?.stats?.netProfit?.trend || '0%', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'الطلبات الجديدة', value: dashboardData?.stats?.orders?.value || '0', icon: <ShoppingBag size={24} />, trend: dashboardData?.stats?.orders?.trend || '0%', color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'العملاء', value: dashboardData?.stats?.customers?.value || '0', icon: <Users size={24} />, trend: dashboardData?.stats?.customers?.trend || '0%', color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'عدد المنتجات', value: dashboardData?.stats?.products?.value || '0', icon: <Package size={24} />, trend: dashboardData?.stats?.products?.trend || '0%', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const salesData = dashboardData?.salesData || [];
  const componentsStock = dashboardData?.componentsStock || [];
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-primary-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-primary-950">{stat.value}</h3>
              <p className={`text-sm font-medium mt-2 flex items-center gap-1 ${stat.trend?.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                <TrendingUp size={14} className={stat.trend?.includes('-') ? 'rotate-180' : ''} />
                {stat.trend} مقارنة بالأسبوع الماضي
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-primary-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-primary-900 mb-6 font-serif">مبيعات الأسبوع</h3>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} ر.س`, 'المبيعات']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Components Stock (Low Inventory Alert) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-primary-900 font-serif">حالة المخزون (تنبيهات)</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            {componentsStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-primary-400 gap-2">
                <Package size={32} className="opacity-50" />
                <p>جميع المكونات بمستوى جيد</p>
              </div>
            ) : (
              componentsStock.map((comp: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      comp.status === 'critical' ? 'bg-red-50 text-red-500' :
                      comp.status === 'low' ? 'bg-amber-50 text-amber-500' :
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-primary-900 text-sm truncate max-w-[120px]" title={comp.name}>{comp.name}</p>
                      <p className="text-xs text-primary-500">الحد: {comp.min}</p>
                    </div>
                  </div>
                  <div className="text-left whitespace-nowrap">
                    <p className={`font-bold text-lg ${
                      comp.status === 'critical' ? 'text-red-600' :
                      comp.status === 'low' ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {comp.stock} <span className="text-xs font-normal text-primary-500">{comp.unit}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-primary-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-primary-900 font-serif">أحدث الطلبات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 text-primary-500 text-sm">
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">المجموع</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-primary-400">لا توجد طلبات حديثة</td>
                </tr>
              ) : (
                recentOrders.map((order: any, i: number) => (
                  <tr key={i} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary-900" dir="ltr">{order.id}</td>
                    <td className="px-6 py-4 text-primary-700">{order.customer}</td>
                    <td className="px-6 py-4 text-primary-500 text-sm">{order.date}</td>
                    <td className="px-6 py-4 font-bold text-accent-700">{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' :
                        (order.status === 'ملغي' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700')
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Activity Logs Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-primary-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-primary-900 font-serif flex items-center gap-2">
            <Activity className="text-primary-500" size={20} />
            سجل نشاطات النظام
          </h3>
        </div>
        <div className="p-6">
          {activityLogs.length === 0 ? (
            <div className="text-center text-primary-400 py-8">لا توجد نشاطات مسجلة بعد</div>
          ) : (
            <div className="space-y-4">
              {activityLogs.slice(0, 15).map((log, i) => (
                <div key={log.id} className={`flex items-start gap-4 p-4 rounded-xl border ${getLogColor(log.event_type)}`}>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    {getLogIcon(log.event_type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-primary-900 font-medium text-sm">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-primary-500">
                      <span className="flex items-center gap-1 font-semibold">
                        <Users size={12} /> {log.actor?.name || 'النظام'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(log.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

