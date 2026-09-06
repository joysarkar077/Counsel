'use server';

import { decryptFileECIES, type ECIESFileBundle } from '@/lib/crypto/fileCrypto';

export async function decryptImageAction(url: string, filePrivateKey: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch encrypted image');
    const rawText = await res.text();
    const bundle: ECIESFileBundle = JSON.parse(rawText);
    
    const result = decryptFileECIES(bundle, filePrivateKey);
    if (!result.ok) throw new Error(result.error);
    
    const base64 = Buffer.from(result.data).toString('base64');
    return { ok: true, data: `data:image/jpeg;base64,${base64}` };
  } catch (err: any) {
    console.error('decryptImageAction error:', err);
    return { ok: false, error: err.message };
  }
}
