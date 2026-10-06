import {
  AlertTriangle,
  ArrowDownUp,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Filter,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  LoaderCircle,
  Map,
  Megaphone,
  Moon,
  PanelRightClose,
  Rows3,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  campaignDataSource,
  campaigns,
  type CampaignRecord,
  type CampaignStatus,
} from '@/data/campaigns';
import { useTheme } from '@/hooks/theme.context';
import { useCampaignStatusOverrides } from '@/hooks/use-campaign-status-overrides';
import { CampaignMapPage } from '@/pages/CampaignMapPage';
import { PerformancePage } from '@/pages/PerformancePage';

const statusOrder: CampaignStatus[] = [
  'Planned',
  'Active',
  'Paused',
  'Completed',
];

type HealthFilter = 'All' | 'Overspent' | 'At risk' | 'High ROI';
type SortMode = 'End date' | 'Revenue' | 'ROI' | 'Budget use';
type AppPage = 'Board' | 'Map' | 'Performance';

const objectiveStyles: Record<string, string> = {
  'Brand Awareness': 'bg-objective-brand/14 text-objective-brand',
  'Customer Expansion': 'bg-objective-expand/14 text-objective-expand',
  'Event Promotion': 'bg-objective-event/14 text-objective-event',
  'Lead Generation': 'bg-objective-lead/14 text-objective-lead',
  'Product Launch': 'bg-objective-launch/14 text-objective-launch',
  'Webinar Registration': 'bg-objective-webinar/14 text-objective-webinar',
};

const statusStyles: Record<
  CampaignStatus,
  { accent: string; rail: string; badge: string; dot: string }
> = {
  Planned: {
    accent: 'border-t-status-planned',
    rail: 'border-l-status-planned',
    badge: 'bg-status-planned/12 text-status-planned',
    dot: 'bg-status-planned',
  },
  Active: {
    accent: 'border-t-status-active',
    rail: 'border-l-status-active',
    badge: 'bg-status-active/12 text-status-active',
    dot: 'bg-status-active',
  },
  Paused: {
    accent: 'border-t-status-paused',
    rail: 'border-l-status-paused',
    badge: 'bg-status-paused/12 text-status-paused',
    dot: 'bg-status-paused',
  },
  Completed: {
    accent: 'border-t-status-completed',
    rail: 'border-l-status-completed',
    badge: 'bg-status-completed/12 text-status-completed',
    dot: 'bg-status-completed',
  },
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

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

const reviewDate = new Date(2026, 9, 5);

function uniqueValues(key: keyof CampaignRecord) {
  return Array.from(new Set(campaigns.map((campaign) => String(campaign[key]))))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function ownerInitials(owner: string) {
  return owner
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  const [day, month, year] = value.split('-');
  return `${day} ${month} ${year}`;
}

function dateValue(value: string) {
  const [day, month, year] = value.split('-');
  const monthIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].indexOf(month);
  return new Date(Number(year), monthIndex, Number(day)).getTime();
}

function isPastDue(campaign: CampaignRecord) {
  if (!['Active', 'Planned'].includes(campaign.status)) return false;
  return dateValue(campaign.endDate) < reviewDate.getTime();
}

function campaignSignal(campaign: CampaignRecord) {
  if (isPastDue(campaign)) {
    return {
      label: 'Past due',
      className: 'bg-destructive/12 text-destructive',
      icon: <AlertTriangle className="icon-size-100" />,
    };
  }
  if (campaign.spend > campaign.budget) {
    return {
      label: 'Overspent',
      className: 'bg-status-paused/14 text-status-paused-foreground',
      icon: <Gauge className="icon-size-100" />,
    };
  }
  if (campaign.roi >= 1000) {
    return {
      label: 'High ROI',
      className: 'bg-status-completed/14 text-status-completed-foreground',
      icon: <TrendingUp className="icon-size-100" />,
    };
  }
  return {
    label: 'On track',
    className: 'bg-status-active/14 text-status-active-foreground',
    icon: <CheckCircle2 className="icon-size-100" />,
  };
}

function CampaignCard({
  campaign,
  onOpen,
  compact,
  pending,
  onDragStart,
  onDragEnd,
}: {
  campaign: CampaignRecord;
  onOpen: (campaign: CampaignRecord) => void;
  compact: boolean;
  pending: boolean;
  onDragStart: (campaign: CampaignRecord) => void;
  onDragEnd: () => void;
}) {
  const spendPercent =
    campaign.budget > 0 ? (campaign.spend / campaign.budget) * 100 : 0;
  const displayedProgress = Math.min(spendPercent, 100);
  const signal = campaignSignal(campaign);

  return (
    <button
      type="button"
      aria-label={`Open campaign ${campaign.campaignId}`}
      onClick={() => onOpen(campaign)}
      draggable={!pending}
      onDragStart={() => onDragStart(campaign)}
      onDragEnd={onDragEnd}
      className={`group w-full rounded-xl border border-l-card border-border bg-card text-left shadow-card transition duration-200 hover:-translate-y-100-nudge hover:border-primary/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusStyles[campaign.status].rail} ${compact ? 'p-300' : 'p-400'} ${pending ? 'cursor-wait opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between gap-300">
        <div className="min-w-0">
          <p
            className={`inline-flex rounded-full px-200 py-100-nudge text-100 font-semibold uppercase tracking-wide ${objectiveStyles[campaign.objective] ?? 'bg-muted text-muted-foreground'}`}
          >
            {campaign.objective}
          </p>
          <h3 className="mt-100-nudge line-clamp-2 font-heading text-400 font-semibold leading-400 text-card-foreground">
            {campaign.campaignName}
          </h3>
        </div>
        <ChevronRight className="icon-size-200 shrink-0 text-muted-foreground transition group-hover:translate-x-100-nudge group-hover:text-primary" />
      </div>

      <div className="mt-300 flex flex-wrap gap-200">
        <span className="rounded-full bg-primary/10 px-200 py-100-nudge text-100 font-semibold text-primary">
          {campaign.product}
        </span>
        <span className="rounded-full bg-muted px-200 py-100-nudge text-100 text-muted-foreground">
          {campaign.channel}
        </span>
        <span
          className={`inline-flex items-center gap-100 rounded-full px-200 py-100-nudge text-100 font-semibold ${signal.className}`}
        >
          {signal.icon}
          {signal.label}
        </span>
      </div>

      <div className={compact ? 'mt-300' : 'mt-400'}>
        <div className="mb-200 flex items-center justify-between gap-200 text-200">
          <span className="text-muted-foreground">Budget used</span>
          <span
            className={
              spendPercent > 100
                ? 'font-semibold text-destructive'
                : 'font-semibold text-card-foreground'
            }
          >
            {spendPercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-progress overflow-hidden rounded-full bg-muted">
          <div
            className={
              spendPercent > 100
                ? 'h-full rounded-full bg-destructive'
                : 'h-full rounded-full bg-primary'
            }
            style={{ width: `${displayedProgress}%` }}
          />
        </div>
      </div>

      <div
        className={`${compact ? 'mt-300 pt-200' : 'mt-400 pt-300'} flex items-end justify-between gap-300 border-t border-border`}
      >
        <div>
          <p className="text-100 text-muted-foreground">Revenue / ROI</p>
          <p className="mt-100-nudge font-numeric text-300 font-semibold text-card-foreground">
            {compactCurrency.format(campaign.revenue)}
            <span className="ml-200 text-100 font-medium text-status-completed">
              {campaign.roi.toLocaleString()}%
            </span>
          </p>
        </div>
        <div className="flex items-center gap-200">
          <div className="text-right">
            <p className="text-100 text-muted-foreground">
              {formatDate(campaign.endDate)}
            </p>
            <p className="mt-100-nudge text-100 font-medium text-card-foreground">
              {campaign.region}
            </p>
          </div>
          <span
            aria-label={`Owner ${campaign.campaignOwner}`}
            title={campaign.campaignOwner}
            className="grid size-avatar place-items-center rounded-full bg-owner text-100 font-bold text-owner-foreground"
          >
            {ownerInitials(campaign.campaignOwner)}
          </span>
        </div>
      </div>
    </button>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-metric flex-1 border-l border-border px-400 first:border-l-0">
      <div className="flex items-center gap-200 text-muted-foreground">
        {icon}
        <span className="text-100 font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-200 font-numeric text-500 font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-300">
      <dt className="text-100 font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-100-nudge break-words font-numeric text-300 font-semibold text-secondary-foreground">
        {value}
      </dd>
    </div>
  );
}

function CampaignDetails({
  campaign,
  onClose,
  onMove,
  pending,
}: {
  campaign: CampaignRecord;
  onClose: () => void;
  onMove: (status: CampaignStatus) => void;
  pending: boolean;
}) {
  const performanceFlow = [
    {
      label: 'Impressions',
      value: campaign.impressions,
      rate: 100,
      bar: 'bg-primary',
    },
    {
      label: 'Clicks',
      value: campaign.clicks,
      rate:
        campaign.impressions > 0
          ? (campaign.clicks / campaign.impressions) * 100
          : 0,
      bar: 'bg-status-active',
    },
    {
      label: 'Leads',
      value: campaign.leads,
      rate: campaign.clicks > 0 ? (campaign.leads / campaign.clicks) * 100 : 0,
      bar: 'bg-status-planned',
    },
    {
      label: 'Conversions',
      value: campaign.conversions,
      rate:
        campaign.leads > 0 ? (campaign.conversions / campaign.leads) * 100 : 0,
      bar: 'bg-status-completed',
    },
  ];

  const details = [
    ['Campaign ID', campaign.campaignId],
    ['Owner', campaign.campaignOwner],
    ['Product', campaign.product],
    ['Objective', campaign.objective],
    ['Channel', campaign.channel],
    ['Region', campaign.region],
    ['Country segment', campaign.countrySegment],
    ['Industry', campaign.industry],
    ['Customer segment', campaign.customerSegment],
    ['Start date', formatDate(campaign.startDate)],
    ['End date', formatDate(campaign.endDate)],
    ['Budget', currency.format(campaign.budget)],
    ['Spend', currency.format(campaign.spend)],
    ['Budget variance', currency.format(campaign.budgetVariance)],
    ['Impressions', campaign.impressions.toLocaleString()],
    ['Clicks', campaign.clicks.toLocaleString()],
    ['Leads', campaign.leads.toLocaleString()],
    ['MQLs', campaign.mqls.toLocaleString()],
    ['SQLs', campaign.sqls.toLocaleString()],
    ['Opportunities', campaign.opportunities.toLocaleString()],
    ['Conversions', campaign.conversions.toLocaleString()],
    ['Pipeline value', currency.format(campaign.pipelineValue)],
    ['Revenue', currency.format(campaign.revenue)],
    ['CTR', `${campaign.ctr}%`],
    ['Lead conversion rate', `${campaign.leadConversionRate}%`],
    ['Win rate', `${campaign.winRate}%`],
    ['Cost per lead', currency.format(campaign.costPerLead)],
    ['Cost per acquisition', currency.format(campaign.costPerAcquisition)],
    ['ROI', `${campaign.roi.toLocaleString()}%`],
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        aria-label={`Details for ${campaign.campaignName}`}
        className="h-full w-full max-w-detail overflow-y-auto border-l border-border bg-background shadow-panel"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 p-400 backdrop-blur">
          <div className="flex items-center gap-300">
            <span
              className={`size-200 rounded-full ${statusStyles[campaign.status].dot}`}
            />
            <span className="text-200 font-semibold text-muted-foreground">
              {campaign.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign details"
            className="grid size-control place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="icon-size-300" />
          </button>
        </div>

        <div className="p-500">
          <p className="text-100 font-semibold uppercase tracking-wide text-primary">
            {campaign.campaignId} · {campaign.objective}
          </p>
          <h2 className="mt-200 font-heading text-hero-700 font-semibold leading-hero-700 text-foreground">
            {campaign.campaignName}
          </h2>
          <p className="mt-300 text-300 leading-400 text-muted-foreground">
            {campaign.product} campaign for the {campaign.customerSegment}{' '}
            segment in {campaign.region}, owned by {campaign.campaignOwner}.
          </p>

          <div className="mt-500 grid grid-cols-2 gap-300">
            <div className="rounded-xl bg-primary p-400 text-primary-foreground">
              <p className="text-100 font-semibold uppercase tracking-wide opacity-80">
                Revenue
              </p>
              <p className="mt-200 font-numeric text-500 font-semibold">
                {compactCurrency.format(campaign.revenue)}
              </p>
            </div>
            <div className="rounded-xl bg-card p-400 text-card-foreground ring-1 ring-border">
              <p className="text-100 font-semibold uppercase tracking-wide text-muted-foreground">
                ROI
              </p>
              <p className="mt-200 font-numeric text-500 font-semibold text-status-completed">
                {campaign.roi.toLocaleString()}%
              </p>
            </div>
          </div>

          <div className="mt-400 rounded-xl border border-border bg-card p-400">
            <div className="flex items-center justify-between gap-300">
              <div>
                <p className="font-heading text-400 font-semibold text-card-foreground">
                  Move campaign
                </p>
                <p className="mt-100-nudge text-200 text-muted-foreground">
                  Saves a private status override to Rayfin.
                </p>
              </div>
              {pending ? (
                <LoaderCircle className="icon-size-300 animate-spin text-primary" />
              ) : null}
            </div>
            <div className="mt-300 grid grid-cols-2 gap-200">
              {statusOrder.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={pending || campaign.status === status}
                  onClick={() => onMove(status)}
                  className={`inline-flex h-control items-center justify-center gap-200 rounded-lg border text-200 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
                    campaign.status === status
                      ? `${statusStyles[status].badge} border-current`
                      : 'border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:bg-accent'
                  } disabled:opacity-60`}
                >
                  <span
                    className={`size-200 rounded-full ${statusStyles[status].dot}`}
                  />
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-600 rounded-xl border border-border bg-card p-400">
            <div className="flex items-center justify-between gap-300">
              <div>
                <p className="font-heading text-400 font-semibold text-card-foreground">
                  Performance flow
                </p>
                <p className="mt-100-nudge text-200 text-muted-foreground">
                  Stage conversion from the Campaign Data worksheet
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-200 py-100-nudge font-numeric text-100 font-semibold text-primary">
                {campaign.ctr}% CTR
              </span>
            </div>
            <div className="mt-400 space-y-300">
              {performanceFlow.map((stage) => (
                <div key={stage.label}>
                  <div className="mb-200 flex items-center justify-between gap-300">
                    <span className="text-200 font-medium text-card-foreground">
                      {stage.label}
                    </span>
                    <span className="font-numeric text-200 text-muted-foreground">
                      {stage.value.toLocaleString()} · {stage.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-flow overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${stage.bar}`}
                      style={{ width: `${Math.max(stage.rate, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-600">
            <h3 className="font-heading text-400 font-semibold text-foreground">
              Campaign record
            </h3>
            <dl className="mt-300 grid grid-cols-2 gap-300">
              {details.map(([label, value]) => (
                <DetailValue key={label} label={label} value={value} />
              ))}
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}

function App() {
  const { isDark, toggleTheme } = useTheme();
  const {
    overrides,
    loading: overridesLoading,
    error: overridesError,
    pendingCampaigns,
    moveCampaign,
    refresh: refreshOverrides,
  } = useCampaignStatusOverrides();
  const [activePage, setActivePage] = useState<AppPage>('Board');
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState('All');
  const [region, setRegion] = useState('All');
  const [channel, setChannel] = useState('All');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('End date');
  const [compactCards, setCompactCards] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [draggedCampaignId, setDraggedCampaignId] = useState<string | null>(
    null
  );
  const [dragOverStatus, setDragOverStatus] =
    useState<CampaignStatus | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<
    Record<CampaignStatus, number>
  >({
    Planned: 12,
    Active: 12,
    Paused: 12,
    Completed: 12,
  });

  const products = useMemo(() => uniqueValues('product'), []);
  const regions = useMemo(() => uniqueValues('region'), []);
  const channels = useMemo(() => uniqueValues('channel'), []);
  const effectiveCampaigns = useMemo(
    () =>
      campaigns.map((campaign) => ({
        ...campaign,
        status: overrides[campaign.campaignId] ?? campaign.status,
      })),
    [overrides]
  );

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return effectiveCampaigns.filter((campaign) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          campaign.campaignId,
          campaign.campaignName,
          campaign.product,
          campaign.objective,
          campaign.channel,
          campaign.region,
          campaign.campaignOwner,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return (
        matchesSearch &&
        (product === 'All' || campaign.product === product) &&
        (region === 'All' || campaign.region === region) &&
        (channel === 'All' || campaign.channel === channel) &&
        (healthFilter === 'All' ||
          (healthFilter === 'Overspent' &&
            campaign.spend > campaign.budget) ||
          (healthFilter === 'At risk' && isPastDue(campaign)) ||
          (healthFilter === 'High ROI' && campaign.roi >= 1000))
      );
    });
  }, [channel, effectiveCampaigns, healthFilter, product, region, search]);

  const summary = useMemo(
    () =>
      filteredCampaigns.reduce(
        (totals, campaign) => ({
          budget: totals.budget + campaign.budget,
          revenue: totals.revenue + campaign.revenue,
          pipeline: totals.pipeline + campaign.pipelineValue,
          leads: totals.leads + campaign.leads,
        }),
        { budget: 0, revenue: 0, pipeline: 0, leads: 0 }
      ),
    [filteredCampaigns]
  );

  const filtersAreActive =
    search.trim() !== '' ||
    product !== 'All' ||
    region !== 'All' ||
    channel !== 'All' ||
    healthFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setProduct('All');
    setRegion('All');
    setChannel('All');
    setHealthFilter('All');
  };

  const selectedCampaign = selectedCampaignId
    ? effectiveCampaigns.find(
        (campaign) => campaign.campaignId === selectedCampaignId
      ) ?? null
    : null;

  const moveToStatus = (campaignId: string, status: CampaignStatus) => {
    if (overridesLoading || overridesError) return;
    void moveCampaign(campaignId, status);
  };

  const pageTitle: Record<AppPage, string> = {
    Board: 'Marketing Campaign',
    Map: 'Country Map',
    Performance: 'Performance',
  };

  function exportCampaignSnapshot(records: CampaignRecord[]) {
    if (!records.length) return;

    const fields = Object.keys(records[0]) as (keyof CampaignRecord)[];
    const toCell = (value: CampaignRecord[keyof CampaignRecord] | string) => {
      let text = String(value);
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const header = fields.map((field) =>
      field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (value) =>
        value.toUpperCase()
      )
    );
    const csv = [
      header.map(toCell).join(','),
      ...records.map((record) =>
        fields.map((field) => toCell(record[field])).join(',')
      ),
    ].join('\r\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketing-campaign-snapshot-2026-10-05.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <nav className="hidden w-sidebar shrink-0 flex-col items-center border-r border-border bg-nav py-400 text-nav-foreground md:flex">
        <div className="grid size-logo place-items-center rounded-full border border-nav-foreground/30 font-heading text-300 font-semibold">
          MC
        </div>
        <div className="mt-600 flex flex-1 flex-col gap-300">
          <button
            type="button"
            onClick={() => setActivePage('Board')}
            title="Campaign board"
            aria-label="Campaign board"
            aria-pressed={activePage === 'Board'}
            className={`grid size-control place-items-center rounded-lg transition ${
              activePage === 'Board'
                ? 'bg-primary text-primary-foreground'
                : 'text-nav-muted hover:bg-nav-hover hover:text-nav-foreground'
            }`}
          >
            <LayoutDashboard className="icon-size-300" />
          </button>
          <button
            type="button"
            onClick={() => setActivePage('Map')}
            title="Country map"
            aria-label="Country map"
            aria-pressed={activePage === 'Map'}
            className={`grid size-control place-items-center rounded-lg transition ${
              activePage === 'Map'
                ? 'bg-primary text-primary-foreground'
                : 'text-nav-muted hover:bg-nav-hover hover:text-nav-foreground'
            }`}
          >
            <Map className="icon-size-300" />
          </button>
          <button
            type="button"
            onClick={() => setActivePage('Performance')}
            title="Performance"
            aria-label="Performance"
            aria-pressed={activePage === 'Performance'}
            className={`grid size-control place-items-center rounded-lg transition ${
              activePage === 'Performance'
                ? 'bg-primary text-primary-foreground'
                : 'text-nav-muted hover:bg-nav-hover hover:text-nav-foreground'
            }`}
          >
            <BarChart3 className="icon-size-300" />
          </button>
        </div>
        <Sparkles className="icon-size-300 text-status-planned" />
      </nav>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-header px-400 py-300 lg:px-600">
          <div className="flex flex-col gap-400 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-400">
              <div>
                <div className="flex items-center gap-200">
                  <Megaphone className="icon-size-300 text-primary" />
                  <p className="text-100 font-semibold uppercase tracking-wide text-primary">
                    Fabric marketing operations
                  </p>
                </div>
                <h1 className="mt-100-nudge font-heading text-600 font-semibold leading-600 text-foreground">
                  {pageTitle[activePage]}
                </h1>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
                className="grid size-control place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
              >
                {isDark ? (
                  <Sun className="icon-size-300" />
                ) : (
                  <Moon className="icon-size-300" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-300">
              {activePage === 'Board' ? (
                <div className="relative min-w-search flex-1 2xl:w-search 2xl:flex-none">
                  <Search className="pointer-events-none absolute left-300 top-1/2 icon-size-200 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search campaign, owner, product…"
                    aria-label="Search campaigns"
                    className="h-control w-full rounded-lg border border-input bg-card pl-700 pr-300 text-300 text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              ) : null}
              <div
                className="hidden items-center rounded-lg border border-border bg-card p-100 lg:flex"
                role="navigation"
                aria-label="Header page navigation"
              >
                {(
                  [
                    ['Board', LayoutDashboard],
                    ['Map', Map],
                    ['Performance', BarChart3],
                  ] as const
                ).map(([page, Icon]) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    aria-pressed={activePage === page}
                    className={`inline-flex h-800 items-center gap-200 rounded-md px-300 text-200 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      activePage === page
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="icon-size-200" />
                    <span className="hidden 2xl:inline">{page}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void refreshOverrides()}
                disabled={overridesLoading}
                className="inline-flex h-control items-center gap-200 rounded-lg border border-border bg-card px-300 text-200 font-semibold text-card-foreground transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw
                  className={`icon-size-200 ${overridesLoading ? 'animate-spin' : ''}`}
                />
                <span className="hidden 2xl:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportCampaignSnapshot(
                    activePage === 'Board'
                      ? filteredCampaigns
                      : effectiveCampaigns
                  )
                }
                className="inline-flex h-control items-center gap-200 rounded-lg bg-primary px-300 text-200 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Download className="icon-size-200" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
                className="hidden size-control place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:grid"
              >
                {isDark ? (
                  <Sun className="icon-size-300" />
                ) : (
                  <Moon className="icon-size-300" />
                )}
              </button>
            </div>
          </div>

          <div
            className="mt-300 flex gap-200 md:hidden"
            role="navigation"
            aria-label="App pages"
          >
            {(
              [
                ['Board', <LayoutDashboard />],
                ['Map', <Map />],
                ['Performance', <BarChart3 />],
              ] as const
            ).map(([page, icon]) => (
              <button
                key={page}
                type="button"
                onClick={() => setActivePage(page)}
                aria-pressed={activePage === page}
                className={`inline-flex h-control flex-1 items-center justify-center gap-200 rounded-lg border text-200 font-semibold transition ${
                  activePage === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <span className="[&>svg]:icon-size-200">{icon}</span>
                {page}
              </button>
            ))}
          </div>

          {overridesLoading ? (
            <div className="mt-300 flex items-center gap-200 rounded-lg border border-primary/20 bg-primary/8 px-300 py-200 text-200 text-primary">
              <LoaderCircle className="icon-size-200 animate-spin" />
              Loading your saved card positions…
            </div>
          ) : null}

          {overridesError ? (
            <div
              role="alert"
              className="mt-300 flex flex-col gap-200 rounded-lg border border-destructive/30 bg-destructive/8 px-300 py-200 text-200 text-destructive sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                Saved card positions are unavailable: {overridesError}
              </span>
              <button
                type="button"
                onClick={() => void refreshOverrides()}
                className="font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : null}

          {activePage === 'Board' ? (
            <>
              <div className="mt-400 flex flex-col gap-300 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-200">
              <div className="flex items-center gap-200 pr-200 text-200 font-semibold text-muted-foreground">
                <Filter className="icon-size-200" />
                Filter
              </div>
              {[
                ['Product', product, products, setProduct],
                ['Region', region, regions, setRegion],
                ['Channel', channel, channels, setChannel],
              ].map(([label, value, options, setter]) => (
                <label key={String(label)} className="relative">
                  <span className="sr-only">{String(label)}</span>
                  <select
                    value={String(value)}
                    onChange={(event) =>
                      (setter as React.Dispatch<React.SetStateAction<string>>)(
                        event.target.value
                      )
                    }
                    className="h-control appearance-none rounded-lg border border-input bg-card pl-300 pr-700 text-200 font-medium text-card-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="All">All {String(label).toLowerCase()}s</option>
                    {(options as string[]).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-300 top-1/2 icon-size-100 -translate-y-1/2 text-muted-foreground" />
                </label>
              ))}
              {filtersAreActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-control rounded-lg px-300 text-200 font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
            <p className="text-200 text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredCampaigns.length.toLocaleString()}
              </span>{' '}
              of {campaignDataSource.recordCount.toLocaleString()} records ·{' '}
              {campaignDataSource.worksheet} · reviewed 5 Oct 2026
            </p>
              </div>

              <div className="mt-300 flex flex-col gap-300 border-t border-border pt-300 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex flex-wrap items-center gap-200"
              role="group"
              aria-label="Campaign health focus"
            >
              <span className="text-100 font-semibold uppercase tracking-wide text-muted-foreground">
                Focus
              </span>
              {(
                [
                  ['All', 'bg-primary/10 text-primary', <Sparkles />],
                  [
                    'Overspent',
                    'bg-status-paused/14 text-status-paused-foreground',
                    <Gauge />,
                  ],
                  [
                    'At risk',
                    'bg-destructive/12 text-destructive',
                    <AlertTriangle />,
                  ],
                  [
                    'High ROI',
                    'bg-status-completed/14 text-status-completed-foreground',
                    <TrendingUp />,
                  ],
                ] as const
              ).map(([label, activeClass, icon]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={healthFilter === label}
                  onClick={() => setHealthFilter(label)}
                  className={`inline-flex h-control items-center gap-200 rounded-full border px-300 text-200 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    healthFilter === label
                      ? `${activeClass} border-current`
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span className="[&>svg]:icon-size-200">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-200">
              <label className="relative">
                <span className="sr-only">Sort campaigns</span>
                <ArrowDownUp className="pointer-events-none absolute left-300 top-1/2 icon-size-200 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as SortMode)
                  }
                  className="h-control appearance-none rounded-lg border border-input bg-card pl-700 pr-700 text-200 font-medium text-card-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring/30"
                >
                  <option value="End date">Sort: end date</option>
                  <option value="Revenue">Sort: revenue</option>
                  <option value="ROI">Sort: ROI</option>
                  <option value="Budget use">Sort: budget use</option>
                </select>
                <SlidersHorizontal className="pointer-events-none absolute right-300 top-1/2 icon-size-100 -translate-y-1/2 text-muted-foreground" />
              </label>

              <div
                className="flex rounded-lg border border-border bg-card p-100"
                role="group"
                aria-label="Card density"
              >
                <button
                  type="button"
                  aria-label="Comfortable cards"
                  aria-pressed={!compactCards}
                  onClick={() => setCompactCards(false)}
                  className={`grid size-density place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    !compactCards
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Grid2X2 className="icon-size-200" />
                </button>
                <button
                  type="button"
                  aria-label="Compact cards"
                  aria-pressed={compactCards}
                  onClick={() => setCompactCards(true)}
                  className={`grid size-density place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    compactCards
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Rows3 className="icon-size-200" />
                </button>
              </div>
            </div>
              </div>
            </>
          ) : null}
        </header>

        {activePage === 'Board' ? (
          <>
            <section
              aria-label="Campaign summary"
              className="flex overflow-x-auto border-b border-border bg-secondary py-300"
            >
              <Metric
                label="Campaigns"
                value={filteredCampaigns.length.toLocaleString()}
                icon={<Target className="icon-size-200" />}
              />
              <Metric
                label="Budget"
                value={compactCurrency.format(summary.budget)}
                icon={<CircleDollarSign className="icon-size-200" />}
              />
              <Metric
                label="Pipeline"
                value={compactCurrency.format(summary.pipeline)}
                icon={<TrendingUp className="icon-size-200" />}
              />
              <Metric
                label="Revenue"
                value={compactCurrency.format(summary.revenue)}
                icon={<BarChart3 className="icon-size-200" />}
              />
              <Metric
                label="Leads"
                value={compactNumber.format(summary.leads)}
                icon={<Users className="icon-size-200" />}
              />
            </section>

            <section
              aria-label="Campaign status board"
              className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-board p-400 lg:p-500"
            >
              <div className="flex h-full min-w-max gap-400">
                {statusOrder.map((status) => {
              const statusCampaigns = filteredCampaigns
                .filter((campaign) => campaign.status === status)
                .sort((left, right) => {
                  if (sortMode === 'Revenue') {
                    return right.revenue - left.revenue;
                  }
                  if (sortMode === 'ROI') {
                    return right.roi - left.roi;
                  }
                  if (sortMode === 'Budget use') {
                    return (
                      right.spend / right.budget - left.spend / left.budget
                    );
                  }
                  return dateValue(left.endDate) - dateValue(right.endDate);
                });
              const visibleCampaigns = statusCampaigns.slice(
                0,
                visibleCounts[status]
              );

                  return (
                    <section
                      key={status}
                      aria-labelledby={`column-${status}`}
                      onDragOver={(event) => {
                        if (overridesLoading || overridesError) return;
                        event.preventDefault();
                        setDragOverStatus(status);
                      }}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                          setDragOverStatus(null);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggedCampaignId) {
                          moveToStatus(draggedCampaignId, status);
                        }
                        setDraggedCampaignId(null);
                        setDragOverStatus(null);
                      }}
                      className={`flex h-full w-board-column flex-col overflow-hidden rounded-xl border border-t-column bg-column shadow-column transition ${statusStyles[status].accent} ${
                        dragOverStatus === status
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border'
                      }`}
                    >
                  <div className="flex items-center justify-between border-b border-border px-400 py-300">
                    <div className="flex items-center gap-200">
                      <span
                        className={`size-200 rounded-full ${statusStyles[status].dot}`}
                      />
                      <h2
                        id={`column-${status}`}
                        className="font-heading text-400 font-semibold text-foreground"
                      >
                        {status}
                      </h2>
                      <span
                        className={`rounded-full px-200 py-100-nudge font-numeric text-100 font-bold ${statusStyles[status].badge}`}
                      >
                        {statusCampaigns.length}
                      </span>
                    </div>
                    <PanelRightClose className="icon-size-200 text-muted-foreground" />
                  </div>

                  <div className="min-h-0 flex-1 space-y-300 overflow-y-auto p-300">
                    {visibleCampaigns.length ? (
                      visibleCampaigns.map((campaign) => (
                        <CampaignCard
                          key={campaign.campaignId}
                          campaign={campaign}
                          onOpen={(selected) =>
                            setSelectedCampaignId(selected.campaignId)
                          }
                          compact={compactCards}
                          pending={pendingCampaigns.has(campaign.campaignId)}
                          onDragStart={(dragged) =>
                            setDraggedCampaignId(dragged.campaignId)
                          }
                          onDragEnd={() => {
                            setDraggedCampaignId(null);
                            setDragOverStatus(null);
                          }}
                        />
                      ))
                    ) : (
                      <div className="grid min-h-empty place-items-center rounded-xl border border-dashed border-border bg-card/40 p-500 text-center">
                        <div>
                          <Target className="mx-auto icon-size-500 text-muted-foreground" />
                          <p className="mt-300 text-300 font-semibold text-foreground">
                            No {status.toLowerCase()} campaigns
                          </p>
                          <p className="mt-100-nudge text-200 text-muted-foreground">
                            Adjust the current filters to see more records.
                          </p>
                        </div>
                      </div>
                    )}

                    {visibleCampaigns.length < statusCampaigns.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCounts((current) => ({
                            ...current,
                            [status]: current[status] + 12,
                          }))
                        }
                        className="w-full rounded-lg border border-dashed border-border bg-card/50 py-300 text-200 font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-card hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Show 12 more ·{' '}
                        {statusCampaigns.length - visibleCampaigns.length}{' '}
                        remaining
                      </button>
                    ) : null}
                  </div>
                    </section>
                  );
                })}
              </div>
            </section>
          </>
        ) : activePage === 'Map' ? (
          <CampaignMapPage campaigns={effectiveCampaigns} />
        ) : (
          <PerformancePage campaigns={effectiveCampaigns} />
        )}
      </main>

      {selectedCampaign ? (
        <CampaignDetails
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaignId(null)}
          onMove={(status) =>
            moveToStatus(selectedCampaign.campaignId, status)
          }
          pending={pendingCampaigns.has(selectedCampaign.campaignId)}
        />
      ) : null}
    </div>
  );
}

export default App;
