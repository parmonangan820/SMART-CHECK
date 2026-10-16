import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { Moon, Sun, Camera, Bell, Shield, CreditCard, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

export default function Settings() {
  const { settings, updateSettings } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-md mx-auto space-y-6"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola preferensi aplikasi Anda.</p>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
            Tampilan & Fungsionalitas
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <SettingToggle
              icon={<Moon size={20} className="text-indigo-500" />}
              label="Mode Gelap"
              description="Tema gelap untuk kenyamanan mata"
              checked={settings.darkMode}
              onChange={(v) => updateSettings({ darkMode: v })}
            />
            <div className="h-px bg-slate-100 dark:bg-slate-800 ml-12" />
            <SettingToggle
              icon={<Camera size={20} className="text-blue-500" />}
              label="Auto Scan"
              description="Otomatis memindai saat gambar jelas"
              checked={settings.autoScan}
              onChange={(v) => updateSettings({ autoScan: v })}
            />
            <div className="h-px bg-slate-100 dark:bg-slate-800 ml-12" />
            <SettingToggle
              icon={<Bell size={20} className="text-amber-500" />}
              label="Notifikasi"
              description="Pemberitahuan hasil scan"
              checked={settings.notifications}
              onChange={(v) => updateSettings({ notifications: v })}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
            Akun & Keamanan
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <SettingLink
              icon={<Shield size={20} className="text-green-500" />}
              label="Keamanan Data"
              description="Enkripsi aktif (End-to-End)"
            />
            <div className="h-px bg-slate-100 dark:bg-slate-800 ml-12" />
            <SettingLink
              icon={<CreditCard size={20} className="text-purple-500" />}
              label="Paket Langganan"
              description="FREE (5 scan/hari)"
              badge="UPGRADE"
            />
          </div>
        </section>

        <div className="pt-4 text-center">
          <p className="text-xs text-slate-400">CEK GIRO SCAN v1.0.0</p>
          <p className="text-[10px] text-slate-500 mt-1">Dibuat dengan ❤️ untuk Fintech Indonesia</p>
        </div>
      </div>
    </motion.div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SettingLink({
  icon,
  label,
  description,
  badge,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
            {label}
            {badge && (
              <span className="text-[8px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded-sm">
                {badge}
              </span>
            )}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-400" />
    </button>
  );
}
