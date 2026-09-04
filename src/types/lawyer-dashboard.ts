import type { CaseStatus } from './case';

export interface ILawyerMetrics {
  readonly assignedCasesCount: number;
  readonly activeCasesCount: number;
  readonly unreadNotificationsCount: number;
  readonly recentUpdatesCount: number;
}

export interface ILawyerCaseItem {
  readonly id: string;
  readonly caseId: string;
  readonly clientId: string;
  readonly title: string;
  readonly category: string;
  readonly status: CaseStatus;
  readonly urgency: string;
  readonly jurisdiction: string;
  readonly updatedAt: string;
  readonly createdAt: string;
}

export type NotificationCategory = 'case_update' | 'assignment' | 'message' | 'system';

export interface ILawyerNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly category: NotificationCategory;
  readonly read: boolean;
  readonly actionUrl?: string;
}
