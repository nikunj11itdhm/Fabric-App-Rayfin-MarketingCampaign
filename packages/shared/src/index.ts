/**
 * Browser-safe contracts shared by the data registration package and frontend.
 *
 * Keep each record shape aligned with its decorated runtime entity in
 * `@rayfin-app/data`. This package must stay isomorphic, so do not import the
 * decorated classes here.
 */
export type CampaignStatus = 'Planned' | 'Active' | 'Paused' | 'Completed';

export interface CampaignStatusOverrideRecord {
  id: string;
  campaignId: string;
  status: CampaignStatus;
  updatedAt: Date;
  owner_id: string;
}

export type UniversalAppSchema = {
  CampaignStatusOverride: CampaignStatusOverrideRecord;
};
