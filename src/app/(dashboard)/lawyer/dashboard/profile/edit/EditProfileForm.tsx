'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EncryptedImageUpload from './EncryptedImageUpload';
import EncryptedImage from '@/components/ui/EncryptedImage';

interface EditProfileFormProps {
  initialData: {
    name: string;
    email: string;
    contact: string;
    address: string;
    bloodGroup: string;
    position: string;
    avatarUrl?: string;
    avatarKey?: string;
  };
}

export default function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    contact: initialData.contact || '',
    address: initialData.address || '',
    bloodGroup: initialData.bloodGroup || 'O+',
    avatarUrl: initialData.avatarUrl || '',
    avatarKey: initialData.avatarKey || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      // Hard navigate to bypass Next.js Client Router Cache so the new avatar shows up
      window.location.assign('/lawyer/dashboard/profile');
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
        <div className="sm:col-span-1 space-y-4">
          <div className="aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center relative">
            {formData.avatarUrl && formData.avatarKey ? (
              <EncryptedImage 
                url={formData.avatarUrl} 
                avatarKeyHex={formData.avatarKey} 
                className="w-full h-full"
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 text-slate-300">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <EncryptedImageUpload 
            onUploadSuccess={(url, key) => {
              setFormData(prev => ({ ...prev, avatarUrl: url, avatarKey: key }));
            }} 
          />
        </div>

        <form onSubmit={handleSave} className="sm:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Position <span className="text-xs font-normal text-slate-400 ml-1">(Managed by Admin)</span></label>
              <input type="text" value={initialData.position || 'Lawyer'} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none transition-all" title="Position can only be changed by an administrator" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Contact Number</label>
              <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all">
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-900">Residential Address</label>
              <textarea rows={3} name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all resize-none"></textarea>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/lawyer/dashboard/profile" className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-navy-core hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
