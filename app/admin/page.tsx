'use client';
import { useEffect, useState } from 'react';
import { adminGetStats } from '@/lib/supabase/queries';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetStats();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">総注文数</h3>
          <p className="text-2xl font-bold mt-2">{stats?.orderCount}件</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">総商品数</h3>
          <p className="text-2xl font-bold mt-2">{stats?.productCount}点</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">累計GMV</h3>
          <p className="text-2xl font-bold mt-2">¥{stats?.gmv.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">回収済み金額</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">¥{stats?.paidTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent 30 Days Chart (Simple Visual) */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-6 text-gray-800">最近30日間の売上推移</h3>
        <div className="h-64 flex items-end gap-2 overflow-x-auto pb-2">
          {Object.entries(stats?.dailyStats || {}).map(([date, val]: any) => (
            <div key={date} className="flex flex-col items-center gap-1 group min-w-[30px] flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t opacity-80 group-hover:opacity-100 transition-opacity relative"
                style={{ height: `${Math.max(5, (val.gmv / (stats.gmv || 1)) * 1000)}%` }}
              >
                 <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                    {date}<br/>¥{val.gmv.toLocaleString()} ({val.count}件)
                 </div>
              </div>
              <span className="text-[10px] text-gray-400 rotate-0 md:-rotate-45 truncate w-full text-center mt-2">{date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}