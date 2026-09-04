'use client';

import { SecureFieldEditor } from './SecureFieldEditor';
import EncryptedExhibitUpload from './EncryptedExhibitUpload';

interface ExhibitsTabProps {
  caseId: string;
  encryptedCaseKey: string;
  initialData: string;
}

export function ExhibitsTab({ caseId, encryptedCaseKey, initialData }: ExhibitsTabProps) {
  let parsed = [];
  try {
    parsed = JSON.parse(initialData);
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }

  return (
    <div className="space-y-4">
      <SecureFieldEditor
        title="Case Exhibits & Evidence Log"
        caseId={caseId}
        encryptedCaseKey={encryptedCaseKey}
        field="exhibits_enc"
        initialData={parsed}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No exhibits logged</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Exhibit logs are encrypted at rest using AES-256 GCM.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3">Exhibit #</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Date Admitted</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((ex, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-navy-core">{ex.number || `EX-${i+1}`}</td>
                      <td className="px-4 py-3 text-slate-900 whitespace-normal min-w-[200px]">{ex.description}</td>
                      <td className="px-4 py-3">
                        {ex.fileUrl ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={ex.fileName}>{ex.fileName || 'Encrypted File'}</span>
                            <span className="text-[10px] font-semibold text-emerald-600">Attached (E2EE)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No file</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{ex.date ? new Date(ex.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ex.status === 'Admitted' ? 'bg-emerald-100 text-emerald-700' :
                          ex.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {ex.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-4">
            {data.map((ex, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg relative bg-white">
                <button 
                  onClick={() => setData(data.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Exhibit #</label>
                    <input type="text" value={ex.number || ''} onChange={e => { const c = [...data]; c[i].number = e.target.value; setData(c); }} className="w-full text-sm p-1.5 border border-slate-200 rounded" placeholder="e.g. A" />
                  </div>
                  <div className="col-span-6">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                    <input type="date" value={ex.date || ''} onChange={e => { const c = [...data]; c[i].date = e.target.value; setData(c); }} className="w-full text-sm p-1.5 border border-slate-200 rounded" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                    <select value={ex.status || 'Pending'} onChange={e => { const c = [...data]; c[i].status = e.target.value; setData(c); }} className="w-full text-sm p-1.5 border border-slate-200 rounded bg-white">
                      <option>Pending</option>
                      <option>Admitted</option>
                      <option>Rejected</option>
                      <option>Withdrawn</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
                  <textarea value={ex.description || ''} onChange={e => { const c = [...data]; c[i].description = e.target.value; setData(c); }} className="w-full text-sm p-1.5 border border-slate-200 rounded" rows={2} placeholder="Describe the exhibit..." />
                </div>
                <div>
                  {ex.fileUrl ? (
                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{ex.fileName || 'Attached File'}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">File uploaded & encrypted</span>
                      </div>
                      <button 
                        onClick={() => { const c = [...data]; c[i].fileUrl = ''; c[i].fileKey = ''; c[i].fileName = ''; setData(c); }}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <EncryptedExhibitUpload 
                      onUploadSuccess={(url, key, name) => {
                        const c = [...data];
                        c[i].fileUrl = url;
                        c[i].fileKey = key;
                        c[i].fileName = name;
                        setData(c);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setData([...data, { number: '', date: '', status: 'Pending', description: '', fileUrl: '', fileKey: '', fileName: '' }])}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:text-navy-core hover:border-navy-core/30 transition-colors"
            >
              + Log New Exhibit
            </button>
          </div>
        )}
      />
    </div>
  );
}
