import { GoogleGenAI, Type } from '@google/genai';
import { lookupBIBank, verifyAccountWithBI, BIVerificationResult } from './biService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GiroExtractionResult {
  accountNumber: string;
  accountName: string;
  bankName: string;
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankName: string;
  giroNumber: string;
  giroDate: string;
  amount: string;
  amountText: string;
  isAmountMatch: boolean;
  isUnreadable: boolean;
  biValidation?: BIVerificationResult;
  recipientBiValidation?: BIVerificationResult;
  fraudAnalysis: {
    isSuspicious: boolean;
    reason: string;
  };
}

export const analyzeGiroImage = async (base64Image: string): Promise<GiroExtractionResult> => {
  try {
    // Remove the data:image/jpeg;base64, prefix
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Anda adalah AI ahli perbankan Indonesia yang bertugas mengekstrak data dari gambar Giro atau Cek sesuai standar Bank Indonesia (BI).
Tugas Anda:
1. Ekstrak informasi Penerbit/Pengirim: Nomor Rekening, Nama Pemilik Rekening, Nama Bank.
2. Ekstrak informasi Penerima: Nama Penerima, Nomor Rekening Penerima, Nama Bank Penerima.
3. Ekstrak informasi Giro: Nomor Giro, dan Tanggal.
4. Ekstrak Nominal Uang (angka) dan Terbilang (huruf). Format nominal angka menjadi format Rupiah (contoh: Rp 10.000.000). Bandingkan nilai angka dan terbilang, jika nilainya sama persis set isAmountMatch = true, jika berbeda set false.
5. Lakukan analisis kecurangan (fraud detection): periksa apakah teks tidak jelas, ada kemungkinan editan foto, font tidak cocok, atau layout tidak standar.

Jika gambar bukan giro/cek atau sangat tidak jelas, set isUnreadable = true.
Jika ada indikasi palsu/editan, set isSuspicious = true dan berikan alasannya di reason.
Jika data tidak ditemukan pada gambar, isi dengan string kosong "".

Kembalikan hasil dalam format JSON yang valid sesuai schema.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accountNumber: { type: Type.STRING, description: "Nomor rekening tujuan/asal" },
            accountName: { type: Type.STRING, description: "Nama pemilik rekening" },
            bankName: { type: Type.STRING, description: "Nama bank penerbit (misal: BCA, Mandiri, BRI)" },
            recipientName: { type: Type.STRING, description: "Nama penerima giro/cek" },
            recipientAccountNumber: { type: Type.STRING, description: "Nomor rekening penerima" },
            recipientBankName: { type: Type.STRING, description: "Nama bank penerima" },
            giroNumber: { type: Type.STRING, description: "Nomor seri giro/cek" },
            giroDate: { type: Type.STRING, description: "Tanggal yang tertera pada giro" },
            amount: { type: Type.STRING, description: "Nominal uang dalam bentuk angka (format: Rp X.XXX.XXX)" },
            amountText: { type: Type.STRING, description: "Nominal uang dalam bentuk huruf (terbilang)" },
            isAmountMatch: { type: Type.BOOLEAN, description: "True jika nominal angka dan terbilang memiliki nilai yang sama" },
            isUnreadable: { type: Type.BOOLEAN, description: "True jika gambar tidak bisa dibaca atau bukan giro" },
            fraudAnalysis: {
              type: Type.OBJECT,
              properties: {
                isSuspicious: { type: Type.BOOLEAN, description: "True jika ada indikasi editan/palsu" },
                reason: { type: Type.STRING, description: "Alasan kecurigaan jika ada" }
              },
              required: ["isSuspicious", "reason"]
            }
          },
          required: ["accountNumber", "accountName", "bankName", "recipientName", "recipientAccountNumber", "recipientBankName", "giroNumber", "giroDate", "amount", "amountText", "isAmountMatch", "isUnreadable", "fraudAnalysis"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');
    
    const extraction = JSON.parse(text) as GiroExtractionResult;

    // Perform official Bank Indonesia (BI) verification & clearing checks
    if (!extraction.isUnreadable) {
      extraction.biValidation = await verifyAccountWithBI(
        extraction.bankName,
        extraction.accountNumber,
        extraction.accountName
      );

      if (extraction.recipientBankName && extraction.recipientAccountNumber) {
        extraction.recipientBiValidation = await verifyAccountWithBI(
          extraction.recipientBankName,
          extraction.recipientAccountNumber,
          extraction.recipientName
        );
      }
    }

    return extraction;
  } catch (error) {
    console.error('Error analyzing image with BI verification:', error);
    throw error;
  }
};

export const validateBank = (bankName: string): boolean => {
  return lookupBIBank(bankName) !== null;
};
