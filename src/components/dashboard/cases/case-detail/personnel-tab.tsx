'use client';

import { SecureFieldEditor } from './SecureFieldEditor';

interface PersonnelTabProps {
  caseId: string;
  casePrivateKeyHex: string;
  casePublicKey: string;
  initialDA: string;
  initialJudge: string;
  initialOfficers: string;
  initialWitnesses: string;
  initialJurors: string;
}

export function PersonnelTab({ 
  caseId, casePrivateKeyHex, casePublicKey, initialDA, initialJudge, initialOfficers, initialWitnesses, initialJurors 
}: PersonnelTabProps) {
  
  const parseJSON = (str: string, fallback: any) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const daData = parseJSON(initialDA, {});
  const judgeData = parseJSON(initialJudge, {});
  const officersData = parseJSON(initialOfficers, []);
  const witnessesData = parseJSON(initialWitnesses, []);
  const jurorsData = parseJSON(initialJurors, []);

  return (
    <div className="space-y-8">
      {/* JUDGE & DA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SecureFieldEditor
          title="Judge"
          caseId={caseId}
          casePrivateKeyHex={casePrivateKeyHex}
          casePublicKey={casePublicKey}
          field="judge_enc"
          initialData={judgeData}
          renderDisplay={(data) => (
            !data.name ? <p className="text-slate-500 italic text-sm">No Judge assigned.</p> :
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{data.name}</p>
              {data.department && <p className="text-sm text-slate-600">Dept/Chamber: {data.department}</p>}
              {data.notes && <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded border border-slate-100">{data.notes}</p>}
            </div>
          )}
          renderForm={(data, setData) => (
            <div className="space-y-3">
              <input type="text" placeholder="Judge Name" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} className="w-full text-sm p-1.5 border rounded" />
              <input type="text" placeholder="Department / Chamber" value={data.department || ''} onChange={e => setData({...data, department: e.target.value})} className="w-full text-sm p-1.5 border rounded" />
              <textarea placeholder="Notes (e.g. strict on deadlines)" value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} className="w-full text-sm p-1.5 border rounded" rows={2} />
            </div>
          )}
        />

        <SecureFieldEditor
          title="District Attorney / Opposing Counsel"
          caseId={caseId}
          casePrivateKeyHex={casePrivateKeyHex}
          casePublicKey={casePublicKey}
          field="da_enc"
          initialData={daData}
          renderDisplay={(data) => (
            !data.name ? <p className="text-slate-500 italic text-sm">No DA/Counsel information.</p> :
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{data.name}</p>
              {data.contact && <p className="text-sm text-slate-600">Contact: {data.contact}</p>}
              {data.agency && <p className="text-sm text-slate-600">Agency: {data.agency}</p>}
            </div>
          )}
          renderForm={(data, setData) => (
            <div className="space-y-3">
              <input type="text" placeholder="Attorney Name" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} className="w-full text-sm p-1.5 border rounded" />
              <input type="text" placeholder="Agency / Firm" value={data.agency || ''} onChange={e => setData({...data, agency: e.target.value})} className="w-full text-sm p-1.5 border rounded" />
              <input type="text" placeholder="Contact Email/Phone" value={data.contact || ''} onChange={e => setData({...data, contact: e.target.value})} className="w-full text-sm p-1.5 border rounded" />
            </div>
          )}
        />
      </div>

      {/* INVESTIGATING OFFICERS */}
      <SecureFieldEditor
        title="Investigating Officers"
        caseId={caseId}
        casePrivateKeyHex={casePrivateKeyHex}
          casePublicKey={casePublicKey}
        field="officers_enc"
        initialData={officersData}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? <p className="text-slate-500 italic text-sm">No officers listed.</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.map((o, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-800">{o.name}</p>
                <p className="text-xs text-slate-500">{o.badge} â€¢ {o.agency}</p>
              </div>
            ))}
          </div>
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-3">
            {data.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="Name" value={o.name || ''} onChange={e => { const c=[...data]; c[i].name=e.target.value; setData(c); }} className="flex-1 text-sm p-1.5 border rounded" />
                <input type="text" placeholder="Badge #" value={o.badge || ''} onChange={e => { const c=[...data]; c[i].badge=e.target.value; setData(c); }} className="w-24 text-sm p-1.5 border rounded" />
                <input type="text" placeholder="Agency" value={o.agency || ''} onChange={e => { const c=[...data]; c[i].agency=e.target.value; setData(c); }} className="flex-1 text-sm p-1.5 border rounded" />
                <button onClick={() => setData(data.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700">X</button>
              </div>
            ))}
            <button onClick={() => setData([...data, {}])} className="text-sm font-semibold text-navy-core hover:underline">+ Add Officer</button>
          </div>
        )}
      />

      {/* WITNESSES */}
      <SecureFieldEditor
        title="Witnesses"
        caseId={caseId}
        casePrivateKeyHex={casePrivateKeyHex}
          casePublicKey={casePublicKey}
        field="witnesses_enc"
        initialData={witnessesData}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? <p className="text-slate-500 italic text-sm">No witnesses recorded.</p> :
          <div className="space-y-2">
            {data.map((w, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{w.name} <span className="text-xs font-normal bg-slate-200 px-1.5 py-0.5 rounded ml-2">{w.type || 'General'}</span></p>
                  <p className="text-sm text-slate-500">{w.contact}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-3">
            {data.map((w, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={w.type || 'General'} onChange={e => { const c=[...data]; c[i].type=e.target.value; setData(c); }} className="w-32 text-sm p-1.5 border rounded">
                  <option>General</option>
                  <option>Expert</option>
                  <option>Character</option>
                  <option>Hostile</option>
                </select>
                <input type="text" placeholder="Witness Name" value={w.name || ''} onChange={e => { const c=[...data]; c[i].name=e.target.value; setData(c); }} className="flex-1 text-sm p-1.5 border rounded" />
                <input type="text" placeholder="Contact Info" value={w.contact || ''} onChange={e => { const c=[...data]; c[i].contact=e.target.value; setData(c); }} className="flex-1 text-sm p-1.5 border rounded" />
                <button onClick={() => setData(data.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700">X</button>
              </div>
            ))}
            <button onClick={() => setData([...data, {}])} className="text-sm font-semibold text-navy-core hover:underline">+ Add Witness</button>
          </div>
        )}
      />

      {/* JURORS */}
      <SecureFieldEditor
        title="Juror List"
        caseId={caseId}
        casePrivateKeyHex={casePrivateKeyHex}
          casePublicKey={casePublicKey}
        field="jurors_enc"
        initialData={jurorsData}
        renderDisplay={(data: any[]) => (
          data.length === 0 ? <p className="text-slate-500 italic text-sm">No jurors selected.</p> :
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.map((j, i) => (
              <div key={i} className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-xs font-bold text-slate-400 block mb-1">Juror {j.number}</span>
                <p className="text-sm font-medium text-slate-800 truncate" title={j.name}>{j.name}</p>
                <p className="text-[10px] text-slate-500 mt-1 truncate" title={j.notes}>{j.notes}</p>
              </div>
            ))}
          </div>
        )}
        renderForm={(data: any[], setData) => (
          <div className="space-y-3">
            {data.map((j, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="#" value={j.number || ''} onChange={e => { const c=[...data]; c[i].number=e.target.value; setData(c); }} className="w-16 text-sm p-1.5 border rounded" />
                <input type="text" placeholder="Name / ID" value={j.name || ''} onChange={e => { const c=[...data]; c[i].name=e.target.value; setData(c); }} className="flex-1 text-sm p-1.5 border rounded" />
                <input type="text" placeholder="Notes (bias, background)" value={j.notes || ''} onChange={e => { const c=[...data]; c[i].notes=e.target.value; setData(c); }} className="flex-2 text-sm p-1.5 border rounded" />
                <button onClick={() => setData(data.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700">X</button>
              </div>
            ))}
            <button onClick={() => setData([...data, {}])} className="text-sm font-semibold text-navy-core hover:underline">+ Add Juror</button>
          </div>
        )}
      />

    </div>
  );
}

