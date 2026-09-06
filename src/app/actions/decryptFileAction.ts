'use server';

import { decryptFileECIES, type ECIESFileBundle } from '@/lib/crypto/fileCrypto';

export async function decryptFileAction(url: string, filePrivateKey: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch encrypted file');
    const rawText = await res.text();
    const bundle: ECIESFileBundle = JSON.parse(rawText);

    const result = decryptFileECIES(bundle, filePrivateKey);
    if (!result.ok) throw new Error(result.error);

    const base64 = Buffer.from(result.data).toString('base64');
    return { ok: true, base64 };
  } catch (err: any) {
    console.error('decryptFileAction error:', err);
    return { ok: false, error: err.message };
  }
}

