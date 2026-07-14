import type { HodDepartment } from '@/types';

export const HOD_DEPARTMENTS: HodDepartment[] = [
  'onboarding_compliance_marketing',
  'user_verification',
  'operations',
  'deal_desk',
  'technical',
  'accounts',
  'audit',
];

export function departmentLabel(dept: HodDepartment): string {
  switch (dept) {
    case 'onboarding_compliance_marketing':
      return 'Onboarding, Compliance & Marketing';
    case 'user_verification':
      return 'User Verification & Escalation';
    case 'operations':
      return 'Operations';
    case 'deal_desk':
      return 'Call Center / Deal Desk';
    case 'technical':
      return 'Technical';
    case 'accounts':
      return 'Accounts';
    case 'audit':
      return 'Audit';
    default:
      return dept;
  }
}

export function adminTierLabel(tier: string): string {
  switch (tier) {
    case 'super_admin':
      return 'Super Admin';
    case 'general_admin':
      return 'General Admin';
    case 'department_admin':
      return 'Department Admin (HOD)';
    default:
      return tier;
  }
}
