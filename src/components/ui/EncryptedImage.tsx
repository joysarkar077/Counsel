'use client';

import { useState, useEffect } from 'react';
import { decryptFileECIES, type ECIESFileBundle } from '@/lib/crypto/fileCrypto';

interface EncryptedImageProps {
  url: string;
  avatarKeyHex: string; // JSON string containing { filePrivateKey } (decrypted by server/parent)
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
        const keyPayload = JSON.parse(avatarKeyHex);
        const filePrivateKey = keyPayload.filePrivateKey;

        if (!filePrivateKey) {
           throw new Error('Invalid encryption key format for ECIES');
        }

        // 1. Fetch encrypted blob (which is actually an ECIES JSON bundle)
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch image');
        const rawText = await res.text();

        // 2. Parse the ECIES bundle and decrypt
        const bundle: ECIESFileBundle = JSON.parse(rawText);
        const result = decryptFileECIES(bundle, filePrivateKey);
        
        if (!result.ok) {
           throw new Error('Failed to decrypt image: ' + result.error);
        }

        const decryptedBlob = new Blob([result.data as any]);

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
