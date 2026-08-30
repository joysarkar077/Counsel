'use client';

const DUMMY_LOGS = [
  {
    id: 'log_004',
    timestamp: '2026-08-28T14:32:00Z',
    userBlindIndex: 'a7b8c9d0...e1f2',
    action: 'MESSAGE_SENT',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0xabc123...',
  },
  {
    id: 'log_003',
    timestamp: '2026-08-28T10:15:22Z',
    userBlindIndex: 'b2c3d4e5...f6a7',
    action: 'USER_LOGIN',
    ip: '10.0.0.42',
    integrity: 'valid',
    hash: '0xdef456...',
  },
  {
    id: 'log_002',
    timestamp: '2026-08-27T09:00:11Z',
    userBlindIndex: 'c3d4e5f6...a7b8',
    action: 'PROFILE_UPDATED',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0x789ghi...',
  },
  {
    id: 'log_001',
    timestamp: '2026-08-27T08:55:00Z',
    userBlindIndex: 'a7b8c9d0...e1f2',
    action: 'CASE_REQUEST_SUBMITTED',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0x000000...',
  },
];

export default function AuditLogPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">Audit Log</h1>
          <p className="text-[0.95rem] text-text-muted">Immutable, hash-chained record of all critical system actions.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 py-2 px-4 rounded-full text-[0.85rem] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_rgba(16,185,129,0.4)] animate-[pulse_2s_infinite]"></span>
          Chain Integrity: Verified
        </div>
      </div>

      <div className="bg-bg-card border border-border shadow-sm rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-navy-core/5 text-text-muted text-[0.8rem] font-bold uppercase tracking-wider border-b border-border">Timestamp</th>
                <th className="py-4 px-6 bg-navy-core/5 text-text-muted text-[0.8rem] font-bold uppercase tracking-wider border-b border-border">Actor (Blind Index)</th>
                <th className="py-4 px-6 bg-navy-core/5 text-text-muted text-[0.8rem] font-bold uppercase tracking-wider border-b border-border">Action</th>
                <th className="py-4 px-6 bg-navy-core/5 text-text-muted text-[0.8rem] font-bold uppercase tracking-wider border-b border-border">IP Address</th>
                <th className="py-4 px-6 bg-navy-core/5 text-text-muted text-[0.8rem] font-bold uppercase tracking-wider border-b border-border">Integrity</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_LOGS.map((log) => (
                <tr key={log.id} className="last:border-b-0 border-b border-border">
                  <td className="py-4 px-6 text-[0.85rem] text-text-secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-[0.85rem] text-navy-core font-mono bg-navy-core/5 py-1 px-2 rounded w-fit my-3 ml-6 block">
                    {log.userBlindIndex}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-bg-page border border-border py-1 px-2.5 rounded-full text-[0.75rem] font-bold text-navy-deepest">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[0.85rem] text-navy-core font-mono bg-navy-core/5 py-1 px-2 rounded w-fit my-3 ml-6 block">
                    {log.ip}
                  </td>
                  <td className="py-4 px-6">
                    {log.integrity === 'valid' ? (
                      <span className="flex items-center gap-1.5 text-emerald-500 font-semibold text-[0.85rem]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Valid
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold text-[0.85rem]">Broken</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="py-4 px-6 bg-bg-page border-t border-border text-[0.85rem] text-text-muted text-center">
          <p>Displaying latest 4 records. Hash chain verification is performed on the server.</p>
        </div>
      </div>
    </div>
  );
}
