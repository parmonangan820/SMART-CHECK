import { useAppStore } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function Dashboard() {
  const scans = useAppStore((state) => state.scans);

  const totalScans = scans.length;
  const validScans = scans.filter((s) => s.status === 'VERIFIED').length;
  const invalidScans = scans.filter((s) => s.status === 'INVALID').length;
  const suspiciousScans = scans.filter((s) => s.fraudStatus === 'POTENTIAL_FRAUD').length;

  const data = [
    { name: 'Valid', value: validScans, color: '#22C55E' },
    { name: 'Invalid', value: invalidScans, color: '#EF4444' },
    { name: 'Suspicious', value: suspiciousScans, color: '#F59E0B' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-md mx-auto space-y-6"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan aktivitas scan giro Anda.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Total Scan"
          value={totalScans}
          icon={<FileText className="text-blue-500" size={20} />}
          bgColor="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          title="Giro Valid"
          value={validScans}
          icon={<ShieldCheck className="text-green-500" size={20} />}
          bgColor="bg-green-50 dark:bg-green-500/10"
        />
        <StatCard
          title="Tidak Valid"
          value={invalidScans}
          icon={<XCircle className="text-red-500" size={20} />}
          bgColor="bg-red-50 dark:bg-red-500/10"
        />
        <StatCard
          title="Mencurigakan"
          value={suspiciousScans}
          icon={<AlertTriangle className="text-amber-500" size={20} />}
          bgColor="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Statistik Status</h3>
        <div className="h-48 w-full">
          {totalScans > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Belum ada data scan
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string; value: number; icon: ReactNode; bgColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-28">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl ${bgColor}`}>{icon}</div>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    </div>
  );
}
