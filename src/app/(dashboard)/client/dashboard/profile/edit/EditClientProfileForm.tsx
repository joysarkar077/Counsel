'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EncryptedImageUpload from '@/components/ui/EncryptedImageUpload';
import EncryptedImage from '@/components/ui/EncryptedImage';

export interface InitialProfileData {
  name: string;
  email: string;
  contact: string;
  address: string;
  bloodGroup: string;
  avatarUrl: string;
  avatarKey?: string;
}

export function EditClientProfileForm({ initialData }: { initialData: InitialProfileData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(initialData.name || '');
  const [contact, setContact] = useState(initialData.contact || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [bloodGroup, setBloodGroup] = useState(initialData.bloodGroup || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || '');
  const [avatarKey, setAvatarKey] = useState(initialData.avatarKey || '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          address,
          bloodGroup,
          avatarUrl,
          avatarKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.message)) {
        throw new Error(data.error || 'Failed to update profile information');
      }

      setSuccess('Profile updated and encrypted successfully!');
      setTimeout(() => {
        router.push('/client/dashboard/profile');
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Profile Image Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-5 bg-slate-50 rounded-xl border border-slate-200/70">
        <div className="sm:col-span-1 flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center relative">
            {avatarUrl && avatarKey ? (
              <EncryptedImage
                url={avatarUrl}
                avatarKeyHex={avatarKey}
                className="w-full h-full"
              />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 text-white font-bold text-2xl flex items-center justify-center">
                {name ? name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Avatar Preview</span>
        </div>

        <div className="sm:col-span-2">
          <EncryptedImageUpload
            onUploadSuccess={(url, key) => {
              setAvatarUrl(url);
              setAvatarKey(key);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-slate-800 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5">
          <label htmlFor="contact" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Contact Number
          </label>
          <input
            type="text"
            id="contact"
            placeholder="+1 555-019-2834"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-slate-800 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Physical Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="address" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Physical Address
          </label>
          <input
            type="text"
            id="address"
            placeholder="123 Legal Way, Suite 400, New York, NY 10001"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-slate-800 outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* Blood Group */}
        <div className="space-y-1.5">
          <label htmlFor="bloodGroup" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Blood Group
          </label>
          <select
            id="bloodGroup"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:border-slate-800 outline-none transition-all disabled:opacity-50"
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        {/* Email Address (Readonly) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Email Address (Immutable)
          </label>
          <input
            type="text"
            value={initialData.email}
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Link
          href="/client/dashboard/profile"
          className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Encrypting & Saving...' : 'Save Profile Changes'}
        </button>
      </div>
    </form>
  );
}
