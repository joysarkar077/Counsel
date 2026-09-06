'use client';

import { useState } from 'react';
import { decryptFileAction } from '@/app/actions/decryptFileAction';

interface EncryptedFileViewerProps {
  fileUrl: string;
  fileKey: string;
  fileName: string;
}

export function EncryptedFileViewer({ fileUrl, fileKey, fileName }: EncryptedFileViewerProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDataUri, setViewDataUri] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState(false);

  const getMimeType = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'application/octet-stream';
  };

  const handleAction = async (action: 'download' | 'view') => {
    setIsDecrypting(true);
    setError(null);
    try {
      const keyPayload = JSON.parse(fileKey);
      const { filePrivateKey } = keyPayload;
      if (!filePrivateKey) throw new Error('File key payload missing filePrivateKey');

      const result = await decryptFileAction(fileUrl, filePrivateKey);
      if (!result.ok) {
        throw new Error(result.error);
      }

      const mimeType = getMimeType(fileName);
      const dataUri = `data:${mimeType};base64,${result.base64}`;

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName || 'decrypted_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === 'view') {
        setViewDataUri(dataUri);
        setIsViewing(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  const mime = getMimeType(fileName);
  const canView = mime.startsWith('image/') || mime === 'application/pdf';

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px] sm:max-w-[300px]" title={fileName}>
          {fileName || 'Encrypted File'}
        </span>
        {error ? (
          <span className="text-xs font-semibold text-red-500" title={error}>
            {error.length > 40 ? 'Integrity error — tampered?' : error}
          </span>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            {canView && (
              <button
                onClick={(e) => { e.preventDefault(); handleAction('view'); }}
                disabled={isDecrypting}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
              >
                {isDecrypting && isViewing ? 'Opening...' : 'View'}
              </button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); handleAction('download'); }}
              disabled={isDecrypting}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
            >
              {isDecrypting && !isViewing ? 'Downloading...' : 'Download'}
            </button>
          </div>
        )}
      </div>

      {isViewing && viewDataUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800 truncate">{fileName}</h3>
              <button
                onClick={() => setIsViewing(false)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50">
              {mime.startsWith('image/') ? (
                <img src={viewDataUri} alt={fileName} className="max-w-full max-h-full object-contain rounded border border-slate-200" />
              ) : mime === 'application/pdf' ? (
                <object data={viewDataUri} type="application/pdf" className="w-full h-[75vh] rounded border border-slate-200">
                  <p className="text-center text-slate-500 mt-10">
                    Your browser doesn't support PDF viewing. <a href={viewDataUri} download={fileName} className="text-indigo-600 underline">Download it here</a>.
                  </p>
                </object>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
