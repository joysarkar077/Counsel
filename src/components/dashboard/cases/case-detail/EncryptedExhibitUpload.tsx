'use client';

import { useState, useRef } from 'react';
import { generateAESKey, exportAESKey, encryptFile } from '@/lib/crypto/fileCrypto';
import { useUploadThing } from '@/utils/uploadthing';

interface EncryptedExhibitUploadProps {
  onUploadSuccess: (url: string, keyPayload: string, fileName: string) => void;
}

export default function EncryptedExhibitUpload({ onUploadSuccess }: EncryptedExhibitUploadProps) {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We temporarily store the key payload in a ref so we can use it in onClientUploadComplete
  const currentKeyPayload = useRef<string>('');
  const currentFileName = useRef<string>('');

  const { startUpload, isUploading } = useUploadThing("exhibitFile", {
    onUploadProgress: (p) => {
      setProgress(50 + Math.floor(p / 2));
    },
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        onUploadSuccess(res[0].url, currentKeyPayload.current, currentFileName.current);
      }
      setIsEncrypting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error);
      alert("Failed to upload exhibit.");
      setIsEncrypting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEncrypting(true);
    setProgress(10);
    currentFileName.current = file.name;

    try {
      // 1. Generate AES Key & Encrypt
      const aesKey = await generateAESKey();
      const aesKeyHex = await exportAESKey(aesKey);
      const { encryptedBlob, ivHex } = await encryptFile(file, aesKey);

      setProgress(30);

      // 2. Prepare for Uploadthing
      // Preserve the original file type so UploadThing accepts it according to its router config
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') || 'encrypted_exhibit.bin';
      const encryptedFile = new File([encryptedBlob], safeName, { type: file.type || 'application/pdf' });
      currentKeyPayload.current = `${aesKeyHex}:${ivHex}`;

      setProgress(50);

      // 3. Upload via hook
      await startUpload([encryptedFile]);
    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Failed to encrypt exhibit.");
      setIsEncrypting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isWorking = isEncrypting || isUploading;

  return (
    <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden">
      {isWorking ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <svg className="animate-spin h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-[10px] font-semibold text-slate-700">Encrypting & Uploading...</div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-navy-core hover:text-navy-deep transition-colors flex items-center gap-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Attach Encrypted File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
