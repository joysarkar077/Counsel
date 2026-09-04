'use client';

import { useState, useRef } from 'react';
import { generateAESKey, exportAESKey, encryptFile } from '@/lib/crypto/fileCrypto';
import { useUploadThing } from '@/utils/uploadthing';

interface EncryptedImageUploadProps {
  onUploadSuccess: (url: string, keyPayload: string) => void;
}

export default function EncryptedImageUpload({ onUploadSuccess }: EncryptedImageUploadProps) {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We temporarily store the key payload in a ref so we can use it in onClientUploadComplete
  const currentKeyPayload = useRef<string>('');

  const { startUpload, isUploading } = useUploadThing("profileImage", {
    onUploadProgress: (p) => {
      // Scale Uploadthing's progress (0-100) to our 50-100 range
      setProgress(50 + Math.floor(p / 2));
    },
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        onUploadSuccess(res[0].url, currentKeyPayload.current);
      }
      setIsEncrypting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
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

    try {
      // 1. Generate AES Key & Encrypt
      const aesKey = await generateAESKey();
      const aesKeyHex = await exportAESKey(aesKey);
      const { encryptedBlob, ivHex } = await encryptFile(file, aesKey);

      setProgress(30);

      // 2. Prepare for Uploadthing
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const encryptedFile = new File([encryptedBlob], safeName, { type: file.type || 'image/jpeg' });
      currentKeyPayload.current = `${aesKeyHex}:${ivHex}`;

      setProgress(50);

      // 3. Upload via hook
      await startUpload([encryptedFile]);
    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Failed to encrypt image.");
      setIsEncrypting(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isWorking = isEncrypting || isUploading;

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden">
      {isWorking ? (
        <div className="flex flex-col items-center gap-3 w-full">
          <svg className="animate-spin h-8 w-8 text-navy-core" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-sm font-semibold text-slate-700">Encrypting & Uploading...</div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
            <div className="h-full bg-navy-core transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            E2E Encryption Active
          </div>
        </div>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-400 mb-3">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm font-bold text-slate-700 mb-1">Upload Profile Picture</p>
          <p className="text-xs text-slate-500 mb-4 text-center max-w-[250px]">
            Image will be securely encrypted in your browser before upload.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            Select Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
