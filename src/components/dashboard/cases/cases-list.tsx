import Link from 'next/link';

type CaseStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'CLOSE_REQUESTED' | 'CLOSED';

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CasesListProps {
  readonly cases: readonly Case[];
}

function getStatusBadge(status: CaseStatus) {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap";
  switch (status) {
    case 'ACTIVE':
      return <span className={`${baseClasses} bg-success/10 text-success`}>Active</span>;
    case 'PENDING_REVIEW':
      return <span className={`${baseClasses} bg-warning/10 text-warning`}>Pending Review</span>;
    case 'REJECTED':
      return <span className={`${baseClasses} bg-text-muted/10 text-text-muted`}>Rejected</span>;
    case 'CLOSE_REQUESTED':
      return <span className={`${baseClasses} bg-danger/10 text-danger`}>Close Requested</span>;
    case 'CLOSED':
      return <span className={`${baseClasses} bg-text-muted/10 text-text-muted`}>Closed</span>;
    default:
      return <span className={baseClasses}>{status}</span>;
  }
}

export function CasesList({ cases }: CasesListProps) {
  if (cases.length === 0) {
    return (
      <div className="p-10 text-center text-text-muted">
        <p>No cases found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="p-3 sm:px-4 sm:py-3 text-[0.85rem] font-semibold text-text-secondary uppercase tracking-wider border-b-2 border-border">Title</th>
            <th className="p-3 sm:px-4 sm:py-3 text-[0.85rem] font-semibold text-text-secondary uppercase tracking-wider border-b-2 border-border">Status</th>
            <th className="p-3 sm:px-4 sm:py-3 text-[0.85rem] font-semibold text-text-secondary uppercase tracking-wider border-b-2 border-border">Last Updated</th>
            <th className="p-3 sm:px-4 sm:py-3 text-[0.85rem] font-semibold text-text-secondary uppercase tracking-wider border-b-2 border-border">Created At</th>
            <th className="p-3 sm:px-4 sm:py-3 text-[0.85rem] font-semibold text-text-secondary uppercase tracking-wider border-b-2 border-border text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id} className="group border-b border-border last:border-b-0">
              <td className="p-3 sm:px-4 sm:py-4 align-middle font-semibold">
                <Link href={`/dashboard/cases/${c.id}`} className="text-navy-deepest hover:text-navy-light transition-colors">
                  {c.title}
                </Link>
              </td>
              <td className="p-3 sm:px-4 sm:py-4 align-middle">{getStatusBadge(c.status)}</td>
              <td className="p-3 sm:px-4 sm:py-4 align-middle text-text-muted text-sm">{new Date(c.updatedAt).toLocaleDateString()}</td>
              <td className="p-3 sm:px-4 sm:py-4 align-middle text-text-muted text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="p-3 sm:px-4 sm:py-4 align-middle text-right">
                <Link 
                  href={`/dashboard/cases/${c.id}`} 
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-navy-core border-[1.5px] border-navy-core hover:bg-navy-core hover:text-white font-semibold py-1.5 px-3 rounded-lg transition-colors text-sm"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
