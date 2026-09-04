import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { Case } from '@/models/Case';
import { decrypt } from '@/lib/crypto/rsa';
import { importAESKey, decryptText } from '@/lib/crypto/textCrypto';

export async function GET() {
  await dbConnect();
  const caseDoc = await Case.findOne({ caseId: 'CASE-7145' });
  const adminId = '6a91f0ec53d70889246688b7';
  const adminDoc = await User.findById(adminId);
  const adminAccess = caseDoc?.accessKeys.find((ak: any) => ak.userId.toString() === adminId);
  
  if (!adminAccess || !adminDoc) {
    return NextResponse.json({ error: 'Missing data' });
  }
  
  const publicKey = JSON.parse(adminDoc.publicKey);
  const privateKey = { d: adminDoc.encryptedPrivateKey, n: publicKey.n };
  
  try {
    const aesKeyHex = decrypt(adminAccess.encryptedCaseKey, privateKey);
    const aesKey = await importAESKey(aesKeyHex);
    const payload = JSON.parse(caseDoc.title_enc);
    const text = await decryptText(payload.ciphertextHex, payload.ivHex, aesKey);
    return NextResponse.json({ success: true, text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
