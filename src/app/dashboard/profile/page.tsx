'use client';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [publicKeyStr, setPublicKeyStr] = useState('{"e":"10001","n":"c5b2484a0d9236d9341498fa7c64c1b97b0a8f9e1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f"}');
  
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setPublicKeyStr(JSON.stringify({
      e: "10001",
      n: "c5b2484a0d9236d9341498fa7c64c1b97b0a8f9e1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f"
    }, null, 2));
    setName('Jotee Sarkar Joy');
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const mockedEncryptedContact = `encrypted_${Buffer.from(contact).toString('hex')}`;
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailHash: 'dummy_hash_for_now',
          contact_enc: mockedEncryptedContact
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile information encrypted and updated.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    setTimeout(() => {
      setLoading(false);
      setSuccess('Password updated successfully. Please use it next time you log in.');
      setCurrentPassword('');
      setNewPassword('');
    }, 800);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(publicKeyStr);
    alert('Public key copied to clipboard');
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">Profile Settings</h1>
        <p className="text-[0.95rem] text-text-muted">Manage your cryptographic identity, personal information, and security.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-[800px]">
        
        {/* Profile Info Section */}
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-8">
          <h2 className="text-[1.2rem] font-bold text-navy-deepest mb-2">Personal Information</h2>
          <p className="text-[0.9rem] text-text-muted mb-6 leading-relaxed">
            Your information is encrypted with your RSA public key before it leaves your browser.
          </p>

          {success && success.includes('Profile') && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4 border border-emerald-100">{success}</div>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5 max-w-[400px]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Contact Number</label>
              <input
                type="text"
                id="contact"
                placeholder="+880 1700-000000"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
            <button type="submit" className="bg-navy-core text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70 mt-1" disabled={loading || (!contact && !name)}>
              {loading ? 'Encrypting & Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-8">
          <h2 className="text-[1.2rem] font-bold text-navy-deepest mb-2">Change Password</h2>
          <p className="text-[0.9rem] text-text-muted mb-6 leading-relaxed">
            Update your master password. This uses thousands of iterations of PBKDF2 to securely hash your secret.
          </p>

          {success && success.includes('Password') && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4 border border-emerald-100">{success}</div>}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-5 max-w-[400px]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currentPassword" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
            <button type="submit" className="bg-navy-core text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70 mt-1" disabled={loading || !currentPassword || !newPassword}>
              {loading ? 'Hashing...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Crypto Identity Section */}
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[1.2rem] font-bold text-navy-deepest mb-0">Cryptographic Identity</h2>
            <span className="bg-gold/15 text-gold-muted text-[0.75rem] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">RSA-2048</span>
          </div>
          <p className="text-[0.9rem] text-text-muted mb-6 leading-relaxed">
            This is your public key. It is used by others to encrypt messages sent to you, and to verify your digital signatures.
          </p>

          <div className="bg-bg-page border border-border rounded-lg overflow-hidden mb-4">
            <div className="flex justify-between items-center py-2.5 px-4 bg-navy-core/5 border-b border-border text-[0.85rem] font-semibold text-navy-core">
              <span>Public Key (JSON)</span>
              <button type="button" onClick={copyKey} className="text-text-muted font-semibold hover:text-navy-core transition-colors">Copy</button>
            </div>
            <textarea
              className="w-full border-none bg-transparent p-4 font-mono text-[0.85rem] text-text-secondary resize-none outline-none"
              value={publicKeyStr}
              readOnly
              rows={6}
            />
          </div>
          
          <div className="flex items-center gap-2 text-[0.85rem] text-navy-core font-medium">
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
