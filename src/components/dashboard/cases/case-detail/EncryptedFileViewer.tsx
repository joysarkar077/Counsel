'use client';

import { useState } from 'react';
import { decryptFileECIES, type ECIESFileBundle } from '@/lib/crypto/fileCrypto';

interface EncryptedFileViewerProps {
  fileUrl: string;
  /**
   * JSON string: { filePrivateKey: string }
   * The per-file ECC private key scalar used to decrypt the ECIES bundle.
   * The bundle (ephemeralPublicKey, ciphertext, mac) is embedded in the uploaded file.
   */
  fileKey: string;
  fileName: string;
}

export function EncryptedFileViewer({ fileUrl, fileKey, fileName }: EncryptedFileViewerProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDecrypting(true);
    setError(null);
    try {
      // 1. Fetch the encrypted file bundle from UploadThing
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file from server');
      const rawText = await response.text();

      // 2. Parse the ECIES bundle (the entire uploaded content is the JSON bundle)
      const bundle: ECIESFileBundle = JSON.parse(rawText);

      // 3. Parse the key payload to get the file private key scalar
      const keyPayload = JSON.parse(fileKey);
      const { filePrivateKey } = keyPayload;
      if (!filePrivateKey) throw new Error('File key payload missing filePrivateKey');

      // 4. Decrypt — MAC is verified internally; returns error on tamper
      const result = decryptFileECIES(bundle, filePrivateKey);
      if (!result.ok) {
        throw new Error(
          result.error === 'MAC_MISMATCH'
            ? 'File integrity check failed — the file may have been tampered with.'
            : `Decryption failed: ${result.error}`,
        );
      }

      // 5. Trigger browser download with the decrypted bytes
      const blob = new Blob([result.data as any]);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'decrypted_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Decryption failed');
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
        <span className="text-[10px] font-semibold text-red-500" title={error}>
          {error.length > 40 ? 'Integrity error — tampered?' : error}
        </span>
      ) : (
        <button
          onClick={handleDownload}
          disabled={isDecrypting}
          className="text-[10px] font-semibold text-navy-core hover:text-navy-deep text-left disabled:opacity-50 transition-colors"
        >
          {isDecrypting ? 'Decrypting…' : 'Download (ECIES)'}
        </button>
      )}
    </div>
  );
}
