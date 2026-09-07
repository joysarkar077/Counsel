import { generateKeyPair as generateRSAKeyPair, encrypt as rsaEncrypt, decrypt as rsaDecrypt, sign as rsaSign, verify as rsaVerify } from '../lib/crypto/rsa';
import { generateKeyPair as generateECCKeyPair, encrypt as eccEncrypt, decrypt as eccDecrypt } from '../lib/crypto/ecc';
import { generateHMAC } from '../lib/crypto/hmac';
import { hashPassword, verifyPassword } from '../lib/crypto/kdf';

async function main() {
  console.log("=== RSA Implementation Test ===");
  const rsaKeys = generateRSAKeyPair(1024);
  const rsaPlaintext = "John Doe (Client PII)";
  console.log("Plaintext:", rsaPlaintext);
  const rsaCiphertext = rsaEncrypt(rsaPlaintext, rsaKeys.publicKey);
  console.log("Ciphertext (hex):", rsaCiphertext);
  const rsaDecrypted = rsaDecrypt(rsaCiphertext, rsaKeys.privateKey);
  console.log("Decrypted:", rsaDecrypted);
  console.log("RSA Encryption Match:", rsaPlaintext === rsaDecrypted);
  
  const rsaSig = await rsaSign(rsaPlaintext, rsaKeys.privateKey);
  console.log("Signature (hex):", rsaSig);
  const rsaSigValid = await rsaVerify(rsaPlaintext, rsaSig, rsaKeys.publicKey);
  console.log("Signature Valid:", rsaSigValid);

  console.log("\n=== ECC & ECIES Implementation Test ===");
  const eccKeys = generateECCKeyPair();
  const eccPlaintext = "This is a highly confidential case note.";
  console.log("Plaintext:", eccPlaintext);
  const eccCiphertext = eccEncrypt(eccPlaintext, eccKeys.publicKey);
  console.log("Ciphertext Bundle:", JSON.stringify(eccCiphertext, null, 2));
  const eccDecrypted = eccDecrypt(eccCiphertext, eccKeys.privateKey);
  if (eccDecrypted.ok) {
    console.log("Decrypted:", eccDecrypted.plaintext);
    console.log("ECC Encryption Match:", eccDecrypted.plaintext === eccPlaintext);
  } else {
    console.log("Decryption Failed:", eccDecrypted.error);
  }



  console.log("\n=== HMAC Implementation Test ===");
  const hmacKey = "super-secret-key-12345";
  const hmacPlaintext = "Data payload for integrity check";
  const hmacHash = generateHMAC(hmacKey, hmacPlaintext);
  console.log("Key:", hmacKey);
  console.log("Payload:", hmacPlaintext);
  console.log("HMAC-SHA256:", hmacHash);

  console.log("\n=== KDF (PBKDF2) Implementation Test ===");
  const password = "securePassword123!";
  const kdfResult = hashPassword(password);
  console.log("Password:", password);
  console.log("Generated Salt:", kdfResult.salt);
  console.log("Generated Hash (10,000 iterations):", kdfResult.hash);
  const isKdfValid = verifyPassword(password, kdfResult.hash, kdfResult.salt, kdfResult.iterations);
  console.log("Password Verify Valid:", isKdfValid);
}

main().catch(console.error);
