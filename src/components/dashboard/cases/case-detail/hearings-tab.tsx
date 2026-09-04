'use client';

import { SecureFieldEditor } from './SecureFieldEditor';

interface HearingsTabProps {
  caseId: string;
  encryptedCaseKey: string;
  initialData: string;
}

export function HearingsTab({ caseId, encryptedCaseKey, initialData }: HearingsTabProps) {
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
        title="Scheduled Hearings"
        caseId={caseId}
        encryptedCaseKey={encryptedCaseKey}
        field="hearingDates_enc"
        initialData={parsed}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? (
            <p className="text-slate-500 italic text-sm">No hearings scheduled yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.map((h, i) => (
                <li key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800">{new Date(h.date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{h.title}</p>
                    {h.notes && <p className="text-xs text-slate-500 mt-1">{h.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-4">
            {data.map((h, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg relative">
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
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={h.date} 
                      onChange={e => {
                        const copy = [...data];
                        copy[i].date = e.target.value;
                        setData(copy);
                      }}
                      className="w-full text-sm p-1.5 border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Title/Type</label>
                    <input 
                      type="text" 
                      value={h.title} 
                      onChange={e => {
                        const copy = [...data];
                        copy[i].title = e.target.value;
                        setData(copy);
                      }}
                      className="w-full text-sm p-1.5 border border-slate-200 rounded"
                      placeholder="e.g. Preliminary Hearing"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Notes</label>
                  <textarea 
                    value={h.notes || ''}
                    onChange={e => {
                      const copy = [...data];
                      copy[i].notes = e.target.value;
                      setData(copy);
                    }}
                    className="w-full text-sm p-1.5 border border-slate-200 rounded"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={() => setData([...data, { date: '', title: '', notes: '' }])}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm font-semibold text-slate-500 hover:text-navy-core hover:border-navy-core/30 transition-colors"
            >
              + Add Hearing
            </button>
          </div>
        )}
      />
    </div>
  );
}
