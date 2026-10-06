import {
  Activity,
  CircleDollarSign,
  MousePointer2,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { VegaVisual, useCssTheme } from '@microsoft/fabric-visuals';
import type {
  DataTable,
  InteractionEvent,
} from '@microsoft/fabric-visuals-core';

import type { CampaignRecord, CampaignStatus } from '@/data/campaigns';
import {
  revenueByCountrySpec,
  revenueByProductSpec,
  statusMixSpec,
} from '@/visuals/campaign-specs';

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-400 shadow-card">
      <div className={`absolute inset-x-0 top-0 h-kpi-accent ${tone}`} />
      <div className="flex items-center justify-between gap-300">
        <p className="text-100 font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-300 font-numeric text-600 font-semibold text-card-foreground">
        {value}
      </p>
      <p className="mt-100-nudge text-200 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function PerformancePage({
  campaigns,
}: {
  campaigns: CampaignRecord[];
}) {
  const theme = useCssTheme();
  const [selectionMessage, setSelectionMessage] = useState(
    'Select a chart mark to cross-examine performance.'
  );

  const summary = useMemo(
    () =>
      campaigns.reduce(
        (totals, campaign) => ({
          budget: totals.budget + campaign.budget,
          spend: totals.spend + campaign.spend,
          revenue: totals.revenue + campaign.revenue,
          pipeline: totals.pipeline + campaign.pipelineValue,
          impressions: totals.impressions + campaign.impressions,
          clicks: totals.clicks + campaign.clicks,
          leads: totals.leads + campaign.leads,
          conversions: totals.conversions + campaign.conversions,
        }),
        {
          budget: 0,
          spend: 0,
          revenue: 0,
          pipeline: 0,
          impressions: 0,
          clicks: 0,
          leads: 0,
          conversions: 0,
        }
      ),
    [campaigns]
  );

  const productRows = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const campaign of campaigns) {
      grouped.set(
        campaign.product,
        (grouped.get(campaign.product) ?? 0) + campaign.revenue
      );
    }
    return Array.from(grouped, ([product, revenue]) => ({ product, revenue }));
  }, [campaigns]);

  const countryRows = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const campaign of campaigns) {
      grouped.set(
        campaign.countrySegment,
        (grouped.get(campaign.countrySegment) ?? 0) + campaign.revenue
      );
    }
    return Array.from(grouped, ([country, revenue]) => ({ country, revenue }));
  }, [campaigns]);

  const statusRows = useMemo(() => {
    const grouped = new Map<
      CampaignStatus,
      { campaigns: number; revenue: number }
    >();
    for (const campaign of campaigns) {
      const current = grouped.get(campaign.status) ?? {
        campaigns: 0,
        revenue: 0,
      };
      current.campaigns += 1;
      current.revenue += campaign.revenue;
      grouped.set(campaign.status, current);
    }
    return Array.from(grouped, ([status, values]) => ({
      status,
      ...values,
    }));
  }, [campaigns]);

  const productData: DataTable = {
    columns: [
      { name: 'product', displayName: 'Product' },
      { name: 'revenue', displayName: 'Revenue', format: '$#,0.00' },
    ],
    rows: productRows.map((row) => [row.product, row.revenue]),
  };

  const countryData: DataTable = {
    columns: [
      { name: 'country', displayName: 'Country' },
      { name: 'revenue', displayName: 'Revenue', format: '$#,0.00' },
    ],
    rows: countryRows.map((row) => [row.country, row.revenue]),
  };

  const statusData: DataTable = {
    columns: [
      { name: 'status', displayName: 'Status' },
      { name: 'campaigns', displayName: 'Campaigns', format: '#,0' },
      { name: 'revenue', displayName: 'Revenue', format: '$#,0.00' },
    ],
    rows: statusRows.map((row) => [
      row.status,
      row.campaigns,
      row.revenue,
    ]),
  };

  const handleInteraction = (source: string, events: InteractionEvent[]) => {
    const selected = events.find((event) => event.action === 'select');
    if (!selected || selected.action !== 'select') {
      setSelectionMessage('Selection cleared. Showing the full portfolio.');
      return;
    }

    const predicates = selected.selections.flatMap(
      (selection) => selection.predicates
    );
    const value = predicates.find(
      (predicate) => predicate.type === 'set'
    );
    setSelectionMessage(
      value?.type === 'set'
        ? `${source}: ${String(value.values[0])}`
        : `${source} mark selected`
    );
  };

  const roas = summary.spend > 0 ? summary.revenue / summary.spend : 0;
  const ctr =
    summary.impressions > 0
      ? (summary.clicks / summary.impressions) * 100
      : 0;
  const leadRate =
    summary.clicks > 0 ? (summary.leads / summary.clicks) * 100 : 0;
  const costPerLead =
    summary.leads > 0 ? summary.spend / summary.leads : 0;

  return (
    <div className="h-full overflow-y-auto bg-board p-400 lg:p-500">
      <div className="mx-auto max-w-dashboard space-y-400">
        <div className="flex flex-col gap-300 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-100 font-semibold uppercase tracking-wide text-primary">
              Portfolio performance
            </p>
            <h2 className="mt-100-nudge font-heading text-hero-700 font-semibold text-foreground">
              Marketing command KPIs
            </h2>
            <p className="mt-200 max-w-copy text-300 text-muted-foreground">
              KPIs and interactive visuals recalculate from the effective board
              statuses and the 1,000 verified worksheet records.
            </p>
          </div>
          <div className="inline-flex items-center gap-200 rounded-full border border-border bg-card px-300 py-200 text-200 text-muted-foreground">
            <MousePointer2 className="icon-size-200 text-primary" />
            {selectionMessage}
          </div>
        </div>

        <section
          aria-label="Performance KPI cards"
          className="grid gap-300 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          <KpiCard
            label="Revenue"
            value={compactCurrency.format(summary.revenue)}
            detail={`${roas.toFixed(1)}x return on ad spend`}
            icon={<CircleDollarSign className="icon-size-300" />}
            tone="bg-primary"
          />
          <KpiCard
            label="Pipeline"
            value={compactCurrency.format(summary.pipeline)}
            detail={`${(summary.pipeline / summary.revenue).toFixed(1)}x revenue coverage`}
            icon={<TrendingUp className="icon-size-300" />}
            tone="bg-status-planned"
          />
          <KpiCard
            label="Conversions"
            value={compactNumber.format(summary.conversions)}
            detail={`${leadRate.toFixed(1)}% click-to-lead rate`}
            icon={<Target className="icon-size-300" />}
            tone="bg-status-completed"
          />
          <KpiCard
            label="CTR"
            value={`${ctr.toFixed(2)}%`}
            detail={`${compactNumber.format(summary.clicks)} clicks`}
            icon={<MousePointer2 className="icon-size-300" />}
            tone="bg-status-active"
          />
          <KpiCard
            label="Cost / lead"
            value={compactCurrency.format(costPerLead)}
            detail={`${compactNumber.format(summary.leads)} total leads`}
            icon={<Users className="icon-size-300" />}
            tone="bg-objective-event"
          />
          <KpiCard
            label="Budget use"
            value={`${((summary.spend / summary.budget) * 100).toFixed(1)}%`}
            detail={`${compactCurrency.format(summary.spend)} spent`}
            icon={<Zap className="icon-size-300" />}
            tone="bg-objective-expand"
          />
        </section>

        <div className="grid gap-400 xl:grid-cols-performance">
          <section className="rounded-xl border border-border bg-card p-400 shadow-column xl:col-span-2">
            <div>
              <h3 className="font-heading text-400 font-semibold text-card-foreground">
                Revenue by product
              </h3>
              <p className="mt-100-nudge text-200 text-muted-foreground">
                Compare contribution across the eight product groups.
              </p>
            </div>
            <div className="mt-300 h-chart-large">
              <VegaVisual
                spec={revenueByProductSpec}
                data={productData}
                theme={theme}
                onInteraction={(events) =>
                  handleInteraction('Product', events)
                }
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-400 shadow-column">
            <div>
              <h3 className="font-heading text-400 font-semibold text-card-foreground">
                Status mix
              </h3>
              <p className="mt-100-nudge text-200 text-muted-foreground">
                Updates when cards move between stages.
              </p>
            </div>
            <div className="mt-300 h-chart-large">
              <VegaVisual
                spec={statusMixSpec}
                data={statusData}
                theme={theme}
                onInteraction={(events) =>
                  handleInteraction('Status', events)
                }
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card p-400 shadow-column">
          <div className="flex items-center justify-between gap-300">
            <div>
              <h3 className="font-heading text-400 font-semibold text-card-foreground">
                Country revenue
              </h3>
              <p className="mt-100-nudge text-200 text-muted-foreground">
                Market contribution across the verified country segments.
              </p>
            </div>
            <Activity className="icon-size-300 text-primary" />
          </div>
          <div className="mt-300 h-chart">
            <VegaVisual
              spec={revenueByCountrySpec}
              data={countryData}
              theme={theme}
              onInteraction={(events) => handleInteraction('Country', events)}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
