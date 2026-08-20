import { apiClient } from '../lib/api';

export interface CaregiverRelationship {
  id: string;
  patientId: string;
  caregiverId: string;
  permissions: string[];
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  createdAt: string;
  patient?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName?: string;
      avatarUrl?: string;
    };
  };
  caregiver?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName?: string;
      avatarUrl?: string;
    };
  };
}

export interface Invitation {
  id: string;
  inviteeEmail: string;
  permissions: string[];
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
}

export const caregiversService = {
  /** Get caregivers the current user has granted access to their data */
  async getMyCaregivers(): Promise<CaregiverRelationship[]> {
    const res = await apiClient.get<{ data: CaregiverRelationship[] }>('/caregivers/my-caregivers');
    return res.data.data;
  },

  /** Get patients whose data this user can view as a caregiver */
  async getMyPatients(): Promise<CaregiverRelationship[]> {
    const res = await apiClient.get<{ data: CaregiverRelationship[] }>('/caregivers/my-patients');
    return res.data.data;
  },

  /** Get pending invitations sent by the current user */
  async getPendingInvitations(): Promise<Invitation[]> {
    const res = await apiClient.get<{ data: Invitation[] }>('/caregivers/invitations');
    return res.data.data;
  },

  /** Invite a caregiver by email with specific permissions */
  async invite(data: {
    email: string;
    permissions: string[];
  }): Promise<{ invitationId: string; expiresAt: string }> {
    const res = await apiClient.post<{ data: { invitationId: string; expiresAt: string } }>(
      '/caregivers/invite',
      data,
    );
    return res.data.data;
  },

  /** Accept an invitation using its token */
  async acceptInvitation(token: string): Promise<CaregiverRelationship> {
    const res = await apiClient.post<{ data: CaregiverRelationship }>(
      `/caregivers/invitations/${token}/accept`,
    );
    return res.data.data;
  },

  /** Revoke a caregiver's access */
  async revokeCaregiver(relationshipId: string): Promise<void> {
    await apiClient.delete(`/caregivers/${relationshipId}`);
  },

  /** Update permissions for an existing caregiver relationship */
  async updatePermissions(
    relationshipId: string,
    permissions: string[],
  ): Promise<CaregiverRelationship> {
    const res = await apiClient.patch<{ data: CaregiverRelationship }>(
      `/caregivers/${relationshipId}`,
      { permissions },
    );
    return res.data.data;
  },

  /** View a patient's medications (as caregiver) */
  async getPatientMedications(patientId: string) {
    const res = await apiClient.get<{ data: unknown[] }>(`/caregivers/patients/${patientId}/medications`);
    return res.data.data;
  },

  /** View a patient's adherence (as caregiver) */
  async getPatientAdherence(patientId: string, period?: '7d' | '30d') {
    const res = await apiClient.get<{ data: unknown }>(`/caregivers/patients/${patientId}/adherence`, {
      params: { period },
    });
    return res.data.data;
  },
};
