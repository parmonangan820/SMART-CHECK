// Bank Indonesia (BI) Standards, BI-FAST, and SKNBI Clearing Service

export interface BIBankInfo {
  code: string; // Kode Kliring / Sandi Bank BI (e.g. "014")
  swiftCode: string;
  name: string;
  aliases: string[];
  minAccountLength: number;
  maxAccountLength: number;
}

export const BI_BANKS: BIBankInfo[] = [
  { code: '014', swiftCode: 'CENACGSX', name: 'Bank Central Asia (BCA)', aliases: ['BCA', 'BANK BCA', 'CENTRAL ASIA'], minAccountLength: 10, maxAccountLength: 10 },
  { code: '008', swiftCode: 'BMRIIDJA', name: 'Bank Mandiri', aliases: ['MANDIRI', 'BANK MANDIRI', 'BMRI'], minAccountLength: 13, maxAccountLength: 13 },
  { code: '002', swiftCode: 'BRINIDJA', name: 'Bank Rakyat Indonesia (BRI)', aliases: ['BRI', 'BANK BRI', 'RAKYAT INDONESIA'], minAccountLength: 15, maxAccountLength: 15 },
  { code: '009', swiftCode: 'BNINIDJA', name: 'Bank Negara Indonesia (BNI)', aliases: ['BNI', 'BANK BNI', 'NEGARA INDONESIA'], minAccountLength: 10, maxAccountLength: 10 },
  { code: '022', swiftCode: 'CIMBIDJA', name: 'CIMB Niaga', aliases: ['CIMB', 'CIMB NIAGA', 'NIAGA'], minAccountLength: 10, maxAccountLength: 13 },
  { code: '451', swiftCode: 'BSIIIDJA', name: 'Bank Syariah Indonesia (BSI)', aliases: ['BSI', 'SYARIAH INDONESIA', 'BNI SYARIAH', 'MANDIRI SYARIAH', 'BRI SYARIAH'], minAccountLength: 10, maxAccountLength: 15 },
  { code: '011', swiftCode: 'DANAINJA', name: 'Bank Danamon', aliases: ['DANAMON', 'BANK DANAMON'], minAccountLength: 10, maxAccountLength: 12 },
  { code: '013', swiftCode: 'PERMIDJA', name: 'Bank Permata', aliases: ['PERMATA', 'BANK PERMATA'], minAccountLength: 10, maxAccountLength: 10 },
  { code: '200', swiftCode: 'BTNIIIDJ', name: 'Bank Tabungan Negara (BTN)', aliases: ['BTN', 'BANK BTN', 'TABUNGAN NEGARA'], minAccountLength: 16, maxAccountLength: 16 },
  { code: '542', swiftCode: 'JAGOIDJA', name: 'Bank Jago', aliases: ['JAGO', 'BANK JAGO', 'ARTOS'], minAccountLength: 10, maxAccountLength: 12 },
  { code: '535', swiftCode: 'SEABIDJA', name: 'SeaBank Indonesia', aliases: ['SEABANK', 'SEA BANK', 'SEABANK INDONESIA'], minAccountLength: 12, maxAccountLength: 12 },
  { code: '501', swiftCode: 'BBCAIDJA', name: 'BCA Digital (Blu)', aliases: ['BLU', 'BLU BY BCA', 'BCA DIGITAL'], minAccountLength: 10, maxAccountLength: 12 },
  { code: '016', swiftCode: 'MBBIIIDJ', name: 'Maybank Indonesia', aliases: ['MAYBANK', 'BII', 'MAYBANK INDONESIA'], minAccountLength: 10, maxAccountLength: 12 },
  { code: '028', swiftCode: 'OCBCIDJA', name: 'OCBC Indonesia', aliases: ['OCBC', 'OCBC NISP', 'NISP'], minAccountLength: 10, maxAccountLength: 12 },
];

export interface BIVerificationResult {
  responseCode: string; // e.g. "2000000" for success (SNAP BI standard)
  responseMessage: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NOT_FOUND';
  isBlacklisted: boolean; // DHN (Daftar Hitam Nasional Giro Bilyet Kosong) check
  blacklistReason?: string;
  biFastSupported: boolean;
  sknbiSupported: boolean;
  matchScore: number; // 0 - 100% name match
}

export const lookupBIBank = (rawBankName: string): BIBankInfo | null => {
  if (!rawBankName) return null;
  const upper = rawBankName.toUpperCase().trim();
  
  // Exact or alias match
  for (const bank of BI_BANKS) {
    if (bank.code === upper || bank.name.toUpperCase() === upper) {
      return bank;
    }
    for (const alias of bank.aliases) {
      if (upper.includes(alias)) {
        return bank;
      }
    }
  }
  return null;
};

export const verifyAccountWithBI = async (
  bankNameOrCode: string,
  accountNumber: string,
  accountName: string
): Promise<BIVerificationResult> => {
  // Normalize and validate against BI directory
  const bank = lookupBIBank(bankNameOrCode);
  const cleanAccount = accountNumber.replace(/\D/g, '');

  if (!bank) {
    return {
      responseCode: '4040100',
      responseMessage: 'Bank tidak terdaftar dalam Direktori Kliring Bank Indonesia (BI).',
      bankCode: '000',
      bankName: bankNameOrCode || 'Tidak Dikenal',
      accountNumber: cleanAccount,
      accountName: accountName || '-',
      accountStatus: 'NOT_FOUND',
      isBlacklisted: false,
      biFastSupported: false,
      sknbiSupported: false,
      matchScore: 0,
    };
  }

  // Validate account length standard
  const isValidLength = cleanAccount.length >= bank.minAccountLength && cleanAccount.length <= bank.maxAccountLength;
  if (!isValidLength && cleanAccount.length > 0) {
    return {
      responseCode: '4000100',
      responseMessage: `Nomor rekening tidak sesuai format standar BI untuk ${bank.name} (panjang harus antara ${bank.minAccountLength}-${bank.maxAccountLength} digit).`,
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: cleanAccount,
      accountName: accountName,
      accountStatus: 'INACTIVE',
      isBlacklisted: false,
      biFastSupported: true,
      sknbiSupported: true,
      matchScore: 50,
    };
  }

  // Simulate BI-FAST / SKNBI clearing query response
  // Check if account ends with specific test numbers or simulate success
  const isBlacklisted = cleanAccount.endsWith('999') || cleanAccount.startsWith('666');
  if (isBlacklisted) {
    return {
      responseCode: '4030100',
      responseMessage: 'REKENING Masuk dalam Daftar Hitam Nasional (DHN) Bank Indonesia / Giro Bilyet Kosong.',
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: cleanAccount,
      accountName: accountName,
      accountStatus: 'BLOCKED',
      isBlacklisted: true,
      blacklistReason: 'Terdaftar dalam Clearing Daftar Hitam Nasional (DHN) BI karena riwayat bilyet giro kosong.',
      biFastSupported: true,
      sknbiSupported: true,
      matchScore: 100,
    };
  }

  return {
      responseCode: '2000000',
      responseMessage: 'Successful. Validasi BI-FAST & SKNBI Berhasil.',
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: cleanAccount,
      accountName: accountName || 'PT / NAMA TERVERIFIKASI BI',
      accountStatus: 'ACTIVE',
      isBlacklisted: false,
      biFastSupported: true,
      sknbiSupported: true,
      matchScore: 98,
  };
};
