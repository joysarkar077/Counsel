'use client';

import { SecureFieldEditor } from './SecureFieldEditor';

interface NotesTabProps {
  caseId: string;
  encryptedCaseKey: string;
  initialUpdates: string;
}

export function NotesTab({ caseId, encryptedCaseKey, initialUpdates }: NotesTabProps) {
  let parsed = [];
  try {
    parsed = JSON.parse(initialUpdates);
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }

  return (
    <div className="space-y-4">
      <SecureFieldEditor
        title="Case Notes & Updates"
        caseId={caseId}
        encryptedCaseKey={encryptedCaseKey}
        field="caseUpdates_enc"
        initialData={parsed}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? (
            <p className="text-slate-500 italic text-sm">No notes or updates recorded.</p>
          ) : (
            <ul className="space-y-4">
              {data.map((n, i) => (
                <li key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-navy-core bg-navy-core/10 px-2 py-1 rounded">{n.category || 'General'}</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {n.date ? new Date(n.date).toLocaleDateString() : 'Unknown Date'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                </li>
              ))}
            </ul>
          )
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-4">
            {data.map((n, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg relative bg-slate-50">
                <button 
                  onClick={() => setData(data.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                    <input 
                      type="date" 
                      value={n.date || ''} 
                      onChange={e => {
                        const copy = [...data];
                        copy[i].date = e.target.value;
                        setData(copy);
                      }}
                      className="w-full text-sm p-1.5 border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                    <select 
                      value={n.category || 'General'} 
                      onChange={e => {
                        const copy = [...data];
                        copy[i].category = e.target.value;
                        setData(copy);
                      }}
                      className="w-full text-sm p-1.5 border border-slate-200 rounded bg-white"
                    >
                      <option value="General">General</option>
                      <option value="Client Call">Client Call</option>
                      <option value="Court Filing">Court Filing</option>
                      <option value="Discovery">Discovery</option>
                      <option value="Internal Note">Internal Note</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Content</label>
                  <textarea 
                    value={n.content || ''}
                    onChange={e => {
                      const copy = [...data];
                      copy[i].content = e.target.value;
                      setData(copy);
                    }}
                    className="w-full text-sm p-2 border border-slate-200 rounded"
                    rows={4}
                    placeholder="Enter update details..."
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={() => setData([{ date: new Date().toISOString().split('T')[0], category: 'General', content: '' }, ...data])}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:text-navy-core hover:border-navy-core/30 transition-colors"
            >
              + Add New Update
            </button>
          </div>
        )}
      />
    </div>
  );
}
