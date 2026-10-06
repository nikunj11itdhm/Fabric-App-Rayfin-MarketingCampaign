import type {
  CampaignStatus,
  CampaignStatusOverrideRecord,
} from '@rayfin-app/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRayfinClient } from '@/lib/rayfin-client';

const fields = [
  'id',
  'campaignId',
  'status',
  'updatedAt',
  'owner_id',
] as const;

async function loadAllOverrides() {
  const client = await getRayfinClient();
  const records: CampaignStatusOverrideRecord[] = [];
  let cursor: string | undefined;

  do {
    let query = client.data.CampaignStatusOverride.select(fields)
      .orderBy({ updatedAt: 'desc' })
      .first(100);

    if (cursor) query = query.after(cursor);

    const page = await query.executePaginated();
    records.push(...page.items);
    cursor = page.hasNextPage ? page.endCursor : undefined;
  } while (cursor);

  return records;
}

export function useCampaignStatusOverrides() {
  const [records, setRecords] = useState<CampaignStatusOverrideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCampaigns, setPendingCampaigns] = useState<Set<string>>(
    () => new Set()
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setRecords(await loadAllOverrides());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Campaign status changes could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void loadAllOverrides()
      .then((loaded) => {
        if (active) setRecords(loaded);
      })
      .catch((cause) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'Campaign status changes could not be loaded.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recordsByCampaign = useMemo(
    () =>
      new Map(records.map((record) => [record.campaignId, record] as const)),
    [records]
  );

  const overrides = useMemo(
    () =>
      Object.fromEntries(
        records.map((record) => [record.campaignId, record.status])
      ) as Record<string, CampaignStatus>,
    [records]
  );

  const moveCampaign = useCallback(
    async (campaignId: string, status: CampaignStatus) => {
      const previous = recordsByCampaign.get(campaignId);
      if (previous?.status === status || pendingCampaigns.has(campaignId)) return;

      const optimistic: CampaignStatusOverrideRecord = previous
        ? { ...previous, status, updatedAt: new Date() }
        : {
            id: `pending-${campaignId}`,
            campaignId,
            status,
            updatedAt: new Date(),
            owner_id: '',
          };

      setError(null);
      setPendingCampaigns((current) => new Set(current).add(campaignId));
      setRecords((current) => [
        optimistic,
        ...current.filter((record) => record.campaignId !== campaignId),
      ]);

      try {
        const client = await getRayfinClient();
        const session = client.auth.getSession();
        if (!session.isAuthenticated || !session.user) {
          throw new Error('Sign in again to move campaign cards.');
        }

        const saved = previous
          ? await client.data.CampaignStatusOverride.update(
              { id: previous.id },
              { status, updatedAt: new Date() }
            )
          : await client.data.CampaignStatusOverride.create({
              campaignId,
              status,
              updatedAt: new Date(),
              owner_id: session.user.id,
            });

        setRecords((current) => [
          saved,
          ...current.filter((record) => record.campaignId !== campaignId),
        ]);
      } catch (cause) {
        setRecords((current) => [
          ...(previous ? [previous] : []),
          ...current.filter((record) => record.campaignId !== campaignId),
        ]);
        setError(
          cause instanceof Error
            ? cause.message
            : 'The campaign move could not be saved.'
        );
      } finally {
        setPendingCampaigns((current) => {
          const next = new Set(current);
          next.delete(campaignId);
          return next;
        });
      }
    },
    [pendingCampaigns, recordsByCampaign]
  );

  return {
    overrides,
    loading,
    error,
    pendingCampaigns,
    moveCampaign,
    refresh,
  };
}
