import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import EncryptedImage from '@/components/ui/EncryptedImage';

export default async function AttorneyProfilePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  
  let decryptedName = 'Loading...';
  let decryptedEmail = 'Loading...';
  let decryptedContact = 'Loading...';
  let decryptedAddress = '';
  let decryptedBloodGroup = 'O+';
  let decryptedAvatarKey = '';
  let avatarUrl = '';
  let userData: any = null;

  if (userId) {
    await dbConnect();
    const user = await User.findById(userId).lean();
    if (user) {
      try {
        const publicKey = JSON.parse(user.publicKey);
        const privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
        
        decryptedName = decrypt(user.username_enc, privateKey);
        decryptedEmail = decrypt(user.email_enc, privateKey);
        decryptedContact = user.contact_enc ? decrypt(user.contact_enc, privateKey) : 'No contact provided';
        decryptedAddress = user.address_enc ? decrypt(user.address_enc, privateKey) : '';
        decryptedBloodGroup = user.bloodGroup_enc ? decrypt(user.bloodGroup_enc, privateKey) : 'O+';
        if (user.avatarKey_enc) decryptedAvatarKey = decrypt(user.avatarKey_enc, privateKey);
        avatarUrl = user.avatarUrl || '';
        userData = user;
      } catch (err) {
        console.error('Error decrypting user profile data:', err);
        decryptedName = 'Decryption Error';
      }
    }
  }

  console.log(`[Profile Page] Rendered for user: ${decryptedName}`);
  console.log(`[Profile Page] Avatar URL present: ${!!avatarUrl}`);
  console.log(`[Profile Page] Avatar Key present: ${!!decryptedAvatarKey}`);

  // Hardcoded mockup data for the UI
  // Note: Since this is an end-to-end encrypted platform, actual implementation
  // would require decrypting these values on the client side using the user's private key.
  const profile = {
    name: decryptedName,
    position: userData?.position || 'Lawyer',
    employeeId: userData?.employeeId || 'LWY-PENDING',
    email: decryptedEmail,
    contact: decryptedContact,
    address: decryptedAddress || 'No address provided',
    bloodGroup: decryptedBloodGroup,
    joinDate: userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'Pending',
    department: userData?.department || 'Legal Department',
    casesHandled: userData?.casesHandled || 0,
    activeCases: userData?.activeCases || 0,
    successRate: userData?.successRate || 'N/A',
    avatarUrl,
    avatarKey: decryptedAvatarKey,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attorney Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your professional information and credentials.</p>
        </div>
        <Link href="/lawyer/dashboard/profile/edit" className="bg-navy-core hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      {/* Top Banner & Avatar Profile Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-subtle border border-slate-200/60 relative">
        {/* Abstract Gradient Cover */}
        <div className="h-32 w-full bg-gradient-to-r from-navy-core via-blue-800 to-indigo-900 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          {/* Glassmorphism Badge */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Verified Attorney
          </div>
        </div>
        
        <div className="px-8 pb-8 pt-0 relative flex flex-col sm:flex-row gap-6 sm:items-end -mt-12">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center overflow-hidden z-10 relative">
              {profile.avatarUrl && profile.avatarKey ? (
                <EncryptedImage 
                  url={profile.avatarUrl} 
                  avatarKeyHex={profile.avatarKey} 
                  className="w-full h-full"
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 text-slate-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          </div>
          
          <div className="flex-1 pb-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 mt-1">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-600">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {profile.department}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-slate-600">{profile.position}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal & Employment Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-200/60 transition-all hover:border-slate-300/80">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-indigo-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Employee & Personal Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee ID</p>
                <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-md border border-slate-100 inline-block">
                  {profile.employeeId}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date of Joining</p>
                <p className="text-sm font-medium text-slate-900 py-2">{profile.joinDate}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
                <div className="flex items-center gap-2 py-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 font-bold text-xs border border-rose-100 shadow-sm">
                    {profile.bloodGroup}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Language</p>
                <p className="text-sm font-medium text-slate-900 py-2">English, Spanish</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-200/60 transition-all hover:border-slate-300/80">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-blue-600">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium text-slate-900 py-2">{profile.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-medium text-slate-900 py-2">{profile.contact}</p>
              </div>
              
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Residential Address</p>
                <p className="text-sm font-medium text-slate-900 py-2 whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {profile.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Security */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="bg-gradient-to-b from-slate-900 to-navy-core rounded-2xl p-6 shadow-lg border border-slate-800 text-white relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-blue-500/10 blur-xl"></div>
            
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700/50 pb-3 mb-5 relative z-10 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-blue-400">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              Case Performance
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Cases Handled</p>
                  <p className="text-3xl font-bold tracking-tight mt-1">{profile.casesHandled}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Cases</p>
                  <p className="text-xl font-bold mt-1 text-blue-200">{profile.activeCases}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Success Rate</p>
                  <p className="text-xl font-bold mt-1 text-emerald-400">{profile.successRate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-subtle border border-slate-200/60">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Platform Security
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="font-medium text-emerald-900 text-xs">End-to-End Encryption</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your personal and contact information is encrypted securely. Only you and authorized admins can view this data in plaintext.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
