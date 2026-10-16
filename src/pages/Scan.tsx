import { useState, useRef, useCallback, ChangeEvent } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronLeft, Download, MessageCircle, Mail, ShieldCheck } from 'lucide-react';
import { useAppStore, ScanResult } from '../store/useAppStore';
import { analyzeGiroImage, validateBank, GiroExtractionResult } from '../services/geminiService';

export default function Scan() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addScan = useAppStore((state) => state.addScan);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Image: string) => {
    setIsScanning(true);
    setResult(null);

    try {
      const extraction: GiroExtractionResult = await analyzeGiroImage(base64Image);

      if (extraction.isUnreadable) {
        const newResult: ScanResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          image: base64Image,
          accountNumber: '-',
          accountName: '-',
          bankName: '-',
          recipientName: '-',
          recipientAccountNumber: '-',
          recipientBankName: '-',
          giroNumber: '-',
          giroDate: '-',
          amount: '-',
          amountText: '-',
          isAmountMatch: false,
          status: 'UNREADABLE',
          bankStatus: 'INVALID',
          recipientBankStatus: 'UNKNOWN',
          fraudStatus: 'SAFE',
        };
        setResult(newResult);
        addScan(newResult);
        setIsScanning(false);
        return;
      }

      const isBankValid = validateBank(extraction.bankName);
      const isRecipientBankValid = extraction.recipientBankName ? validateBank(extraction.recipientBankName) : false;
      const isBlacklisted = extraction.biValidation?.isBlacklisted || false;
      const isFraud = extraction.fraudAnalysis.isSuspicious || isBlacklisted;
      
      let finalStatus: ScanResult['status'] = 'VERIFIED';
      if (isFraud) {
        finalStatus = 'WARNING';
      } else if (!isBankValid || !extraction.accountNumber || !extraction.accountName || !extraction.isAmountMatch || extraction.biValidation?.accountStatus === 'BLOCKED') {
        finalStatus = 'INVALID';
      }

      const newResult: ScanResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: base64Image,
        accountNumber: extraction.accountNumber,
        accountName: extraction.accountName,
        bankName: extraction.bankName,
        recipientName: extraction.recipientName,
        recipientAccountNumber: extraction.recipientAccountNumber,
        recipientBankName: extraction.recipientBankName,
        giroNumber: extraction.giroNumber,
        giroDate: extraction.giroDate,
        amount: extraction.amount,
        amountText: extraction.amountText,
        isAmountMatch: extraction.isAmountMatch,
        status: finalStatus,
        bankStatus: isBankValid ? 'VALID' : 'INVALID',
        recipientBankStatus: extraction.recipientBankName ? (isRecipientBankValid ? 'VALID' : 'INVALID') : 'UNKNOWN',
        fraudStatus: isFraud ? 'POTENTIAL_FRAUD' : 'SAFE',
        fraudReason: isBlacklisted ? extraction.biValidation?.responseMessage : extraction.fraudAnalysis.reason,
        biValidation: extraction.biValidation,
        recipientBiValidation: extraction.recipientBiValidation,
      };

      setResult(newResult);
      addScan(newResult);
    } catch (error) {
      console.error('OCR & BI Verification Error:', error);
      alert('Gagal memproses gambar dan verifikasi BI. Silakan coba lagi.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
  };

  const formatResultText = (res: ScanResult) => {
    return `*HASIL SCAN & VERIFIKASI BI-FAST*
Status: ${res.status}

*NOMINAL & TERBILANG*
Nominal: ${res.amount}
Terbilang: ${res.amountText}

*DATA PENERBIT (PENGIRIM)*
Bank: ${res.bankName} (Kode BI: ${res.biValidation?.bankCode || '-'})
No. Rekening: ${res.accountNumber}
Nama Pemilik: ${res.accountName}
Status Rekening BI: ${res.biValidation?.accountStatus || 'VALID'}
DHN Blacklist: ${res.biValidation?.isBlacklisted ? 'YA (DIPERIKSA)' : 'TIDAK (BERSIH)'}

*DATA PENERIMA*
Bank: ${res.recipientBankName} (Kode BI: ${res.recipientBiValidation?.bankCode || '-'})
No. Rekening: ${res.recipientAccountNumber}
Nama Penerima: ${res.recipientName}

*INFORMASI GIRO*
No. Giro: ${res.giroNumber}
Tanggal: ${res.giroDate}

Verifikasi Resmi Standar Bank Indonesia (BI-FAST / SKNBI)`;
  };

  const handleDownload = () => {
    if (!result) return;
    const text = formatResultText(result);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Giro_BI_${result.giroNumber || 'Scan'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    if (!result) return;
    const text = encodeURIComponent(formatResultText(result));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    if (!result) return;
    const subject = encodeURIComponent(`Hasil Verifikasi BI Giro: ${result.giroNumber || '-'}`);
    const body = encodeURIComponent(formatResultText(result));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {!image ? (
        <div className="relative flex-1 flex flex-col">
          <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <h1 className="text-white font-semibold flex items-center gap-2">
              <ScanLineIcon /> CEK GIRO SCAN & BI-FAST
            </h1>
          </div>
          
          <div className="flex-1 relative bg-black overflow-hidden">
            {/* @ts-ignore */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full h-full object-cover"
              mirrored={false}
            />
            {/* Overlay Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full h-48 border-2 border-white/50 rounded-xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">Posisikan Giro / Cek Disini</p>
                  <span className="text-[10px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">Auto Verifikasi BI-FAST / SKNBI</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 pb-10 flex flex-col items-center gap-6">
            <p className="text-slate-400 text-xs font-medium animate-pulse">
              Posisikan giro di dalam bingkai lalu tekan Mulai Scan
            </p>
            
            <div className="w-full flex items-center justify-between gap-4 max-w-md">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-colors flex flex-col items-center gap-1 min-w-[80px]"
              >
                <ImageIcon size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Galeri</span>
              </button>
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              <button
                onClick={capture}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                <Camera size={24} />
                <span className="text-lg tracking-wide">MULAI SCAN</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          <header className="p-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
            <button onClick={resetScan} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="font-semibold text-slate-900 dark:text-white">Hasil Verifikasi BI-FAST</h1>
          </header>

          <div className="p-4 space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-black aspect-[2/1]">
              <img src={image} alt="Scanned Giro" className="w-full h-full object-contain opacity-80" />
              {isScanning && (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-white font-medium text-sm animate-pulse">Menghubungkan ke Gateway BI-FAST & AI OCR...</p>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
                >
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3 animate-pulse" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl flex items-start gap-3 ${
                    result.status === 'VERIFIED' ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-400' :
                    result.status === 'INVALID' || result.status === 'UNREADABLE' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400' :
                    'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400'
                  }`}>
                    {result.status === 'VERIFIED' ? <CheckCircle2 className="shrink-0 mt-0.5" /> :
                     result.status === 'INVALID' || result.status === 'UNREADABLE' ? <XCircle className="shrink-0 mt-0.5" /> :
                     <AlertTriangle className="shrink-0 mt-0.5" />}
                    <div>
                      <h3 className="font-bold text-sm">
                        {result.status === 'VERIFIED' ? 'TERVERIFIKASI BI-FAST' :
                         result.status === 'INVALID' ? 'DATA TIDAK VALID / REKENING DITOLAK' :
                         result.status === 'UNREADABLE' ? 'DATA TIDAK TERDETEKSI' :
                         'POTENSI GIRO PALSU / BLACKLIST DHN'}
                      </h3>
                      <p className="text-xs mt-1 opacity-90">
                        {result.status === 'VERIFIED' ? 'Nomor rekening, nama bank, dan kepemilikan valid sesuai standar Bank Indonesia.' :
                         result.status === 'INVALID' ? 'Rekening tidak ditemukan atau tidak sesuai format kliring BI.' :
                         result.status === 'UNREADABLE' ? 'Gambar giro tidak dapat dibaca oleh sistem.' :
                         result.fraudReason || 'Terdeteksi anomali atau masuk daftar hitam nasional.'}
                      </p>
                    </div>
                  </div>

                  {/* Bank Indonesia BI-FAST Verification Badge Card */}
                  {result.status !== 'UNREADABLE' && result.biValidation && (
                    <div className="bg-gradient-to-br from-blue-900/90 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-blue-500/30 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={20} className="text-blue-400" />
                          <h3 className="font-bold text-xs uppercase tracking-wider text-blue-200">Gateway BI-FAST & SKNBI</h3>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-400/30">
                          Code: {result.biValidation.responseCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-blue-300/70 block text-[10px]">Sandi Kliring Bank</span>
                          <span className="font-mono font-bold text-white">{result.biValidation.bankCode} - {result.biValidation.bankName}</span>
                        </div>
                        <div>
                          <span className="text-blue-300/70 block text-[10px]">Status Akun BI</span>
                          <span className={`font-bold ${result.biValidation.accountStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                            {result.biValidation.accountStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-300/70 block text-[10px]">Daftar Hitam Nasional (DHN)</span>
                          <span className={`font-bold ${result.biValidation.isBlacklisted ? 'text-red-400' : 'text-green-400'}`}>
                            {result.biValidation.isBlacklisted ? 'BERMASALAH (BLACKLIST)' : 'BERSIH (AMAN)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-300/70 block text-[10px]">Tingkat Akurasi Nama</span>
                          <span className="font-bold text-green-400">{result.biValidation.matchScore}% (Match)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Card */}
                  {result.status !== 'UNREADABLE' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <FileText size={18} className="text-blue-500" />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Detail Ekstraksi & Cek BI</h3>
                      </div>
                      
                      <div className="space-y-4 text-sm">
                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal & Terbilang</h4>
                          <ResultRow label="Nominal Angka" value={result.amount} />
                          <ResultRow label="Terbilang" value={result.amountText} 
                            status={result.isAmountMatch ? '✔ SESUAI' : '⚠ TIDAK COCOK'} 
                            statusColor={result.isAmountMatch ? 'text-green-500' : 'text-red-500'}
                          />
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Penerbit (Pengirim) - Terverifikasi BI</h4>
                          <ResultRow label="Nama Bank" value={result.bankName} 
                            status={result.bankStatus === 'VALID' ? '✔ VALID BI' : '⚠ TIDAK TERDAFTAR'} 
                            statusColor={result.bankStatus === 'VALID' ? 'text-green-500' : 'text-red-500'}
                          />
                          <ResultRow label="No. Rekening" value={result.accountNumber} />
                          <ResultRow label="Nama Pemilik" value={result.accountName} />
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Penerima</h4>
                          <ResultRow label="Nama Bank" value={result.recipientBankName || '-'} 
                            status={result.recipientBankStatus === 'UNKNOWN' ? undefined : result.recipientBankStatus === 'VALID' ? '✔ VALID' : '⚠ TIDAK TERDAFTAR'} 
                            statusColor={result.recipientBankStatus === 'VALID' ? 'text-green-500' : 'text-red-500'}
                          />
                          <ResultRow label="No. Rekening" value={result.recipientAccountNumber || '-'} />
                          <ResultRow label="Nama Penerima" value={result.recipientName || '-'} />
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informasi Giro</h4>
                          <ResultRow label="No. Giro/Cek" value={result.giroNumber} />
                          <ResultRow label="Tanggal" value={result.giroDate} />
                        </div>
                      </div>
                    </div>
                  )}

                  {result.status !== 'UNREADABLE' && (
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={handleDownload} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                        <Download size={20} className="text-slate-700 dark:text-slate-300 mb-1.5" />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Download</span>
                      </button>
                      <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/50 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm">
                        <MessageCircle size={20} className="text-green-600 dark:text-green-500 mb-1.5" />
                        <span className="text-[10px] font-medium text-green-700 dark:text-green-500">WhatsApp</span>
                      </button>
                      <button onClick={handleEmail} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
                        <Mail size={20} className="text-red-600 dark:text-red-500 mb-1.5" />
                        <span className="text-[10px] font-medium text-red-700 dark:text-red-500">Email</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={resetScan}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Camera size={18} /> Scan Giro Lain
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, status, statusColor }: { label: string; value: string; status?: string; statusColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex justify-between items-start">
        <span className="font-medium text-slate-900 dark:text-slate-100">{value || '-'}</span>
        {status && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 ${statusColor}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

function ScanLineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" x2="17" y1="12" y2="12" />
    </svg>
  );
}
