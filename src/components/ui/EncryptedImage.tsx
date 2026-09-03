'use client';

import { useState, useEffect } from 'react';
import { decryptFile, importAESKey } from '@/lib/crypto/fileCrypto';

interface EncryptedImageProps {
  url: string;
  avatarKeyHex: string; // The plaintext AES key + IV (decrypted by server/parent)
  className?: string;
  alt?: string;
}

export default function EncryptedImage({ url, avatarKeyHex, className = '', alt = 'Encrypted Image' }: EncryptedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadAndDecrypt() {
      if (!url || !avatarKeyHex) return;
      try {
        const [aesKeyHex, ivHex] = avatarKeyHex.split(':');
        
        // 1. Fetch encrypted blob
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch image');
        const encryptedBuffer = await res.arrayBuffer();

        // 2. Import key and decrypt
        const cryptoKey = await importAESKey(aesKeyHex);
        const decryptedBlob = await decryptFile(encryptedBuffer, cryptoKey, ivHex);

        // 3. Create Object URL
        objectUrl = URL.createObjectURL(decryptedBlob);
        setImgSrc(objectUrl);
      } catch (err) {
        console.error("Failed to load encrypted image:", err);
        setError(true);
      }
    }

    loadAndDecrypt();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, avatarKeyHex]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-rose-50 text-rose-300 ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-1/3 h-1/3">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 animate-pulse ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-1/3 h-1/3">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img src={imgSrc} alt={alt} className={`object-cover ${className}`} />
  );
}
