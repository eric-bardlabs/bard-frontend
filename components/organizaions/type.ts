export interface OrganizationUser {
    id: string;
    name: string;
    identifier: string;
    imageUrl?: string;
    organizationMemberId: string;
    notificationSettings?: {
      dashboard: boolean;
      email: boolean;
    };
  }