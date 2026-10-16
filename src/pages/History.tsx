import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { Search, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function History() {
  const { scans, deleteScan, clearHistory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'INVALID' | 'WARNING'>('ALL');

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.giroNumber.includes(searchTerm);
    
    const matchesFilter = filter === 'ALL' || scan.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-md mx-auto space-y-6"
    >
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Riwayat</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Data scan giro sebelumnya.</p>
        </div>
        {scans.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Hapus semua riwayat?')) {
                clearHistory();
              }
            }}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
          >
            <Trash2 size={14} /> Hapus Semua
          </button>
        )}
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama, bank, no giro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['ALL', 'VERIFIED', 'INVALID', 'WARNING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f === 'ALL' ? 'Semua' : f === 'VERIFIED' ? 'Valid' : f === 'INVALID' ? 'Tidak Valid' : 'Peringatan'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredScans.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
            Tidak ada data ditemukan.
          </div>
        ) : (
          filteredScans.map((scan) => (
            <motion.div
              layout
              key={scan.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {scan.status === 'VERIFIED' && <CheckCircle2 className="text-green-500" size={18} />}
                  {scan.status === 'INVALID' && <XCircle className="text-red-500" size={18} />}
                  {scan.status === 'WARNING' && <AlertTriangle className="text-amber-500" size={18} />}
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {scan.bankName || 'Unknown Bank'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {format(new Date(scan.date), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Penerbit</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 truncate">{scan.accountName}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Penerima</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 truncate">{scan.recipientName || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">No. Giro</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 font-mono">{scan.giroNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Tgl Giro</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{scan.giroDate}</p>
                </div>
              </div>

              <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Nominal</span>
                <span className="font-bold text-slate-900 dark:text-white">{scan.amount || '-'}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  scan.status === 'VERIFIED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                  scan.status === 'INVALID' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {scan.status}
                </span>
                <button
                  onClick={() => deleteScan(scan.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
