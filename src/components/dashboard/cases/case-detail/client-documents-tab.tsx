'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EncryptedExhibitUpload from './EncryptedExhibitUpload';
import { EncryptedFileViewer } from './EncryptedFileViewer';
import { encryptDataAction } from '@/app/actions/encryptDataAction';

interface ClientDocumentsTabProps {
  caseId: string;
  casePrivateKeyHex: string;
  casePublicKey: string;
  initialData: string;
  readOnly?: boolean;
}

export function ClientDocumentsTab({ caseId, casePrivateKeyHex, casePublicKey, initialData, readOnly = false }: ClientDocumentsTabProps) {
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>(() => {
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
    setDrafts(prev => ({ ...prev, [index]: { ...documents[index] } }));
    setEditingSet(prev => new Set(prev).add(index));
  };

  const handleCancel = (index: number) => {
    if (documents[index]._isNew) {
      const newDocs = [...documents];
      newDocs.splice(index, 1);
      setDocuments(newDocs);
    }
    const newSet = new Set(editingSet);
    newSet.delete(index);
    setEditingSet(newSet);
  };

  const saveToBackend = async (newDocuments: any[]) => {
    const cleanDocuments = newDocuments.map(doc => {
      const { _isNew, ...rest } = doc;
      return rest;
    });

    const encRes = await encryptDataAction(cleanDocuments, casePublicKey);
    if (!encRes.ok) throw new Error(encRes.error);

    // Call the dedicated client documents endpoint
    const res = await fetch(`/api/cases/${caseId}/client-documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientDocuments_enc: encRes.payload })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save documents');
    }
    return cleanDocuments;
  };

  const handleSave = async (index: number) => {
    setIsSaving(true);
    try {
      const updatedDocuments = [...documents];
      updatedDocuments[index] = drafts[index];

      const cleanDocuments = await saveToBackend(updatedDocuments);

      setDocuments(cleanDocuments);
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
    if (!confirm('Are you sure you want to delete this document?')) return;
    setIsSaving(true);
    try {
      const updatedDocuments = documents.filter((_, i) => i !== index);
      const cleanDocuments = await saveToBackend(updatedDocuments);
      setDocuments(cleanDocuments);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    const newDoc = { title: '', date: '', description: '', fileUrl: '', fileKey: '', fileName: '', _isNew: true };
    setDocuments([...documents, newDoc]);
    const newIndex = documents.length;
    setDrafts(prev => ({ ...prev, [newIndex]: newDoc }));
    setEditingSet(prev => new Set(prev).add(newIndex));
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Client Documents & Uploads</h3>
          <p className="text-sm text-slate-500">Securely share documents with your attorney. Encrypted end-to-end.</p>
        </div>
      </div>

      {documents.length === 0 && editingSet.size === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-base font-semibold text-slate-700">No documents uploaded</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">Upload IDs, contracts, photos, or any other files requested by your attorney.</p>
        </div>
      )}

      <div className="space-y-6">
        {documents.map((doc, i) => {
          const isEditing = editingSet.has(i);

          if (isEditing) {
            const draft = drafts[i];
            const updateDraft = (updates: any) => setDrafts(prev => ({ ...prev, [i]: { ...draft, ...updates } }));

            return (
              <div key={i} className="bg-white border-2 border-indigo-500/30 rounded-xl p-5 shadow-md relative ring-4 ring-indigo-500/5 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-4 border-b border-slate-100 gap-4">
                  <h4 className="font-bold text-indigo-700 text-base flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {doc._isNew ? 'Uploading New Document' : 'Editing Document Details'}
                  </h4>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => handleCancel(i)} disabled={isSaving} className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleSave(i)} disabled={isSaving} className="flex-1 sm:flex-none text-xs font-semibold px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Saving...
                        </>
                      ) : 'Save Document'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-5 mb-5">
                  <div className="col-span-12 md:col-span-6">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Document Title</label>
                    <input type="text" value={draft.title || ''} onChange={e => updateDraft({ title: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Driver's License" />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Date Provided</label>
                    <input type="date" value={draft.date || ''} onChange={e => updateDraft({ date: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Description & Notes (Optional)</label>
                  <textarea value={draft.description || ''} onChange={e => updateDraft({ description: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-y" rows={2} placeholder="Add any context for your lawyer..." />
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
                    <div className="mt-0.5 bg-indigo-50 text-indigo-600 p-2.5 rounded-lg shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-lg leading-tight">{doc.title || 'Untitled Document'}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Uploaded {doc.date ? new Date(doc.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'recently'}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(i)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors tooltip-trigger" title="Edit Document">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(i)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors tooltip-trigger" title="Delete Document">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {doc.description && (
                  <div className="ml-14 mt-1 mb-2">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{doc.description}</p>
                  </div>
                )}
              </div>
              {doc.fileUrl && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 sm:ml-14 sm:rounded-tl-lg sm:border-l">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 shrink-0 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <EncryptedFileViewer fileUrl={doc.fileUrl} fileKey={doc.fileKey} fileName={doc.fileName} />
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
            className="group flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3.5 bg-white border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-600 hover:bg-slate-50 transition-all shadow-sm hover:shadow"
          >
            <div className="p-1 rounded-md bg-slate-100 group-hover:bg-indigo-600/10 text-slate-500 group-hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            Upload New Document
          </button>
        </div>
      )}
    </div>
  );
}

