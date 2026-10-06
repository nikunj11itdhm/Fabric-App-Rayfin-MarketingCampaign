import {
  date,
  entity,
  role,
  set,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.owner_id),
})
export class CampaignStatusOverride {
  @uuid() id!: string;
  @text({ min: 1, max: 20 }) campaignId!: string;
  @set('Planned', 'Active', 'Paused', 'Completed')
  status!: 'Planned' | 'Active' | 'Paused' | 'Completed';
  @date() updatedAt!: Date;
  @text({ max: 200 }) owner_id!: string;
}
