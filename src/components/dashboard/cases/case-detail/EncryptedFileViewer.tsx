'use client';

import { useState } from 'react';
import { importAESKey, decryptFile } from '@/lib/crypto/fileCrypto';

interface EncryptedFileViewerProps {
  fileUrl: string;
  fileKey: string; // Format: aesKeyHex:ivHex
  fileName: string;
}

export function EncryptedFileViewer({ fileUrl, fileKey, fileName }: EncryptedFileViewerProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDecrypting(true);
    setError(null);
    try {
      // 1. Fetch the encrypted file from UploadThing
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file from server');
      const encryptedBuffer = await response.arrayBuffer();

      // 2. Parse the key payload
      const parts = fileKey.split(':');
      if (parts.length !== 2) throw new Error('Invalid encryption key format');
      const [aesKeyHex, ivHex] = parts;

      // 3. Decrypt
      const aesKey = await importAESKey(aesKeyHex);
      const decryptedBlob = await decryptFile(encryptedBuffer, aesKey, ivHex);

      // 4. Trigger download
      const objectUrl = URL.createObjectURL(decryptedBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'decrypted_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err: any) {
      console.error(err);
      setError('Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={fileName}>
        {fileName || 'Encrypted File'}
      </span>
      {error ? (
        <span className="text-[10px] font-semibold text-red-500">{error}</span>
      ) : (
        <button
          onClick={handleDownload}
          disabled={isDecrypting}
          className="text-[10px] font-semibold text-navy-core hover:text-navy-deep text-left disabled:opacity-50 transition-colors"
        >
          {isDecrypting ? 'Decrypting...' : 'Download (E2EE)'}
        </button>
      )}
    </div>
  );
}
