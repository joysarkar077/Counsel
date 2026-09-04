'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminCreateCaseModal } from './AdminCreateCaseModal';

export function AdminCreateCaseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
        Create Case
      </Button>
      <AdminCreateCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
