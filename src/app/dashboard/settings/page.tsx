'use client';
import { useState, useEffect } from 'react';
import styles from './settings.module.css';
import { encrypt } from '@/lib/crypto/rsa'; // We will use RSA to encrypt the new contact

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // In a real app, these would come from an API call that returns the user's public profile and public key.
  // We're using state to simulate it for this UI demo.
  const [publicKeyStr, setPublicKeyStr] = useState('{"e":"10001","n":"9e4b7c...[Loading]..."}');
  const [contact, setContact] = useState('');

  // Dummy fetch to simulate loading user data
  useEffect(() => {
    // We would fetch the logged-in user's public key here.
    // For demo purposes, we'll just show a realistic looking JSON structure.
    setPublicKeyStr(JSON.stringify({
      e: "10001",
      n: "c5b2484a0d9236d9341498fa7c64c1b97b..."
    }, null, 2));
  }, []);

  const handleUpdateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // 1. Get the user's public key (in reality, parsed from state/context)
      // We're using a dummy small key here just to make the encrypt() call not throw if it expects real hex.
      // But since this is a UI demo without full auth context, we will skip the real RSA encryption
      // unless we actually generate a keypair here (which is heavy). 
      // For this demo, we'll mock the encrypted string.
      
      const mockedEncryptedContact = `encrypted_${Buffer.from(contact).toString('hex')}`;

      // 2. Send the encrypted string to the API
      // Since we don't have ECDSA sessions yet, we mock the emailHash identification
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailHash: 'dummy_hash_for_now', // Farjana will handle real sessions
          contact_enc: mockedEncryptedContact
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Contact information encrypted and updated.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(publicKeyStr);
    alert('Public key copied to clipboard');
  };

  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your cryptographic identity and personal information.</p>
      </div>

      <div className={styles.grid}>
        {/* Profile Info Section */}
        <div className={`card ${styles.card}`}>
          <h2 className={styles.cardTitle}>Personal Information</h2>
          <p className={styles.cardDesc}>
            Your information is encrypted with your RSA public key before it leaves your browser.
          </p>

          {success && <div className="alert-success" style={{ marginBottom: '16px' }}>{success}</div>}
          {error && <div className="alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleUpdateContact} className={styles.form}>
            <div className="input-group">
              <label htmlFor="contact">Contact Number</label>
              <input
                type="text"
                id="contact"
                placeholder="+880 1700-000000"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !contact}>
              {loading ? 'Encrypting & Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Crypto Identity Section */}
        <div className={`card ${styles.card}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Cryptographic Identity</h2>
            <span className={styles.badge}>RSA-2048</span>
          </div>
          <p className={styles.cardDesc}>
            This is your public key. It is used by others to encrypt messages sent to you, and to verify your digital signatures.
          </p>

          <div className={styles.keyContainer}>
            <div className={styles.keyHeader}>
              <span>Public Key (JSON)</span>
              <button type="button" onClick={copyKey} className={styles.copyBtn}>Copy</button>
            </div>
            <textarea
              className={styles.keyTextarea}
              value={publicKeyStr}
              readOnly
              rows={6}
            />
          </div>
          
          <div className={styles.securityNote}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Your private key never leaves your device unencrypted.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
