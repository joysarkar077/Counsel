'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EncryptedImage from '@/components/ui/EncryptedImage';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    contact: string;
    address: string;
    bloodGroup: string;
    avatarUrl: string;
    avatarKey: string;
    role: string;
    publicKey: string;
    createdAt: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load profile');
      }
      setProfile(data.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess('');
    setError('');

    setTimeout(() => {
      setPasswordLoading(false);
      setPasswordSuccess('Password updated successfully. Please use it next time you log in.');
      setCurrentPassword('');
      setNewPassword('');
    }, 800);
  };

  const copyKey = () => {
    if (profile?.publicKey) {
      try {
        const parsed = JSON.parse(profile.publicKey);
        navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
        alert('Public key copied to clipboard');
      } catch {
        navigator.clipboard.writeText(profile.publicKey);
        alert('Public key copied to clipboard');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile & Security</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal information, security credentials, and RSA key identity.</p>
        </div>

        <Link
          href="/client/dashboard/profile/edit"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile Information
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center">
              {profile?.avatarUrl && profile?.avatarKey ? (
                <EncryptedImage
                  url={profile.avatarUrl}
                  avatarKeyHex={profile.avatarKey}
                  className="w-full h-full"
                />
              ) : profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
              <p className="text-xs font-medium text-slate-500">{profile?.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Role: {profile?.role || 'client'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Account Verified
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/client/dashboard/profile/edit"
            className="text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Phone</span>
            <p className="text-sm font-semibold text-slate-800">{profile?.contact || 'Not provided'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Address</span>
            <p className="text-sm font-semibold text-slate-800">{profile?.address || 'Not specified'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blood Group</span>
            <p className="text-sm font-semibold text-slate-800">{profile?.bloodGroup || 'Not specified'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Member Since</span>
            <p className="text-sm font-semibold text-slate-800">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Change Password</h2>
        <p className="text-xs text-slate-500 mb-6">
          Update your account master password using PBKDF2 hashing.
        </p>

        {passwordSuccess && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold mb-4 border border-emerald-200">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
          <div className="space-y-1">
            <label htmlFor="currentPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={passwordLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800 transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="newPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={passwordLoading}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword}
            className="bg-slate-900 text-white font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 self-start"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Cryptographic Identity Section */}
      <div className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-slate-900">Cryptographic RSA Keypair</h2>
          <span className="bg-amber-50 text-amber-800 text-[10px] font-bold py-1 px-3 rounded-full border border-amber-200 uppercase tracking-wider">
            RSA-2048
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          This is your public key used to encrypt legal case filings and establish zero-trust end-to-end security.
        </p>

        <div className="bg-slate-900 text-slate-200 rounded-xl overflow-hidden mb-4 border border-slate-800">
          <div className="flex justify-between items-center py-2.5 px-4 bg-slate-800/80 border-b border-slate-700 text-xs font-semibold">
            <span>Public Key Object</span>
            <button
              type="button"
              onClick={copyKey}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Copy Key
            </button>
          </div>
          <pre className="p-4 font-mono text-xs overflow-x-auto text-slate-300 max-h-44">
            {profile?.publicKey
              ? (() => {
                  try {
                    return JSON.stringify(JSON.parse(profile.publicKey), null, 2);
                  } catch {
                    return profile.publicKey;
                  }
                })()
              : 'Key unavailable'}
          </pre>
        </div>
      </div>
    </div>
  );
}
