'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EncryptedExhibitUpload from './EncryptedExhibitUpload';
import { EncryptedFileViewer } from './EncryptedFileViewer';
import { encryptDataAction } from '@/app/actions/encryptDataAction';

interface ExhibitsTabProps {
  caseId: string;
  casePrivateKeyHex: string;
  casePublicKey: string;
  initialData: string;
  readOnly?: boolean;
}

export function ExhibitsTab({ caseId, casePrivateKeyHex, casePublicKey, initialData, readOnly = false }: ExhibitsTabProps) {
  const router = useRouter();

  const [exhibits, setExhibits] = useState<any[]>(() => {
    try {
      const parsed = JSON.parse(initialData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [editingSet, setEditingSet] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (index: number) => {
    setDrafts(prev => ({ ...prev, [index]: { ...exhibits[index] } }));
    setEditingSet(prev => new Set(prev).add(index));
  };

  const handleCancel = (index: number) => {
    if (exhibits[index]._isNew) {
      const newExhs = [...exhibits];
      newExhs.splice(index, 1);
      setExhibits(newExhs);
    }
    const newSet = new Set(editingSet);
    newSet.delete(index);
    setEditingSet(newSet);
  };

  const saveToBackend = async (newExhibits: any[]) => {
    const cleanExhibits = newExhibits.map(ex => {
      const { _isNew, ...rest } = ex;
      return rest;
    });

    const encRes = await encryptDataAction(cleanExhibits, casePublicKey);
    if (!encRes.ok) throw new Error(encRes.error);

    const res = await fetch(`/api/cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exhibits_enc: encRes.payload })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save exhibits');
    }
    return cleanExhibits;
  };

  const handleSave = async (index: number) => {
    setIsSaving(true);
    try {
      const updatedExhibits = [...exhibits];
      updatedExhibits[index] = drafts[index];

      const cleanExhibits = await saveToBackend(updatedExhibits);

      setExhibits(cleanExhibits);
      const newSet = new Set(editingSet);
      newSet.delete(index);
      setEditingSet(newSet);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this exhibit?')) return;
    setIsSaving(true);
    try {
      const updatedExhibits = exhibits.filter((_, i) => i !== index);
      const cleanExhibits = await saveToBackend(updatedExhibits);
      setExhibits(cleanExhibits);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete exhibit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    const newExhibit = { number: '', date: '', status: 'Pending', description: '', fileUrl: '', fileKey: '', fileName: '', _isNew: true };
    setExhibits([...exhibits, newExhibit]);
    const newIndex = exhibits.length;
    setDrafts(prev => ({ ...prev, [newIndex]: newExhibit }));
    setEditingSet(prev => new Set(prev).add(newIndex));
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Case Exhibits & Evidence Log</h3>
          <p className="text-sm text-slate-500">Exhibits are encrypted at rest with ECIES using the case public key.</p>
        </div>
      </div>

      {exhibits.length === 0 && editingSet.size === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-base font-semibold text-slate-700">No exhibits logged</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">Keep track of important case files, evidence, and court exhibits securely here.</p>
        </div>
      )}

      <div className="space-y-6">
        {exhibits.map((ex, i) => {
          const isEditing = editingSet.has(i);

          if (isEditing) {
            const draft = drafts[i];
            const updateDraft = (updates: any) => setDrafts(prev => ({ ...prev, [i]: { ...draft, ...updates } }));

            return (
              <div key={i} className="bg-white border-2 border-navy-core/30 rounded-xl p-5 shadow-md relative ring-4 ring-navy-core/5 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-4 border-b border-slate-100 gap-4">
                  <h4 className="font-bold text-navy-core text-base flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {ex._isNew ? 'Logging New Exhibit' : 'Editing Exhibit'}
                  </h4>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => handleCancel(i)} disabled={isSaving} className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleSave(i)} disabled={isSaving} className="flex-1 sm:flex-none text-xs font-semibold px-5 py-2 bg-navy-core text-white rounded-lg hover:bg-navy-deep transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Saving...
                        </>
                      ) : 'Save Exhibit'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-5 mb-5">
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Exhibit # / Name</label>
                    <input type="text" value={draft.number || ''} onChange={e => updateDraft({ number: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core outline-none transition-all" placeholder="e.g. Exhibit A" />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Date Admitted</label>
                    <input type="date" value={draft.date || ''} onChange={e => updateDraft({ date: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core outline-none transition-all" />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Status</label>
                    <select value={draft.status || 'Pending'} onChange={e => updateDraft({ status: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core outline-none transition-all bg-white">
                      <option>Pending</option>
                      <option>Admitted</option>
                      <option>Rejected</option>
                      <option>Withdrawn</option>
                    </select>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Description & Notes</label>
                  <textarea value={draft.description || ''} onChange={e => updateDraft({ description: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core outline-none transition-all resize-y" rows={3} placeholder="Describe the exhibit, relevance, or notes..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Encrypted File Attachment</label>
                  {draft.fileUrl ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <EncryptedFileViewer fileUrl={draft.fileUrl} fileKey={draft.fileKey} fileName={draft.fileName} />
                      <button onClick={() => updateDraft({ fileUrl: '', fileKey: '', fileName: '' })} className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                      <EncryptedExhibitUpload
                        onUploadSuccess={(url, key, name) => updateDraft({ fileUrl: url, fileKey: key, fileName: name })}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="bg-white border border-slate-200/70 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-indigo-200 transition-all group overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 bg-indigo-50 text-indigo-600 p-2.5 rounded-lg shrink-0 flex items-center justify-center font-bold font-mono min-w-[2.5rem]">
                      {ex.number || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 text-lg leading-tight">{ex.title || `Exhibit ${ex.number || i + 1}`}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ex.status === 'Admitted' ? 'bg-emerald-100 text-emerald-800' :
                          ex.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          ex.status === 'Withdrawn' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ex.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Date: {ex.date ? new Date(ex.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set'}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleEdit(i)} className="p-1.5 text-slate-400 hover:text-navy-core hover:bg-slate-100 rounded-md transition-colors tooltip-trigger" title="Edit Exhibit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(i)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors tooltip-trigger" title="Delete Exhibit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-14 mt-1 mb-2">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ex.description || <span className="text-slate-400 italic">No description provided.</span>}</p>
                </div>
              </div>
              {ex.fileUrl && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 sm:ml-14 sm:rounded-tl-lg sm:border-l">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 shrink-0 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <EncryptedFileViewer fileUrl={ex.fileUrl} fileKey={ex.fileKey} fileName={ex.fileName} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
          <button
            onClick={handleAddNew}
            className="group flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3.5 bg-white border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:text-navy-core hover:border-navy-core hover:bg-slate-50 transition-all shadow-sm hover:shadow"
          >
            <div className="p-1 rounded-md bg-slate-100 group-hover:bg-navy-core/10 text-slate-500 group-hover:text-navy-core transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Log New Exhibit
          </button>
        </div>
      )}
    </div>
  );
}
