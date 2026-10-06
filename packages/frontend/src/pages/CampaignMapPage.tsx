import { MapPinned, MousePointer2, Target, TrendingUp } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CampaignRecord } from '@/data/campaigns';

const coordinates: Record<string, { latitude: number; longitude: number }> = {
  Australia: { latitude: -25.27, longitude: 133.78 },
  Canada: { latitude: 56.13, longitude: -106.35 },
  Germany: { latitude: 51.17, longitude: 10.45 },
  India: { latitude: 20.59, longitude: 78.96 },
  Singapore: { latitude: 1.35, longitude: 103.82 },
  UAE: { latitude: 23.42, longitude: 53.85 },
  UK: { latitude: 55.38, longitude: -3.44 },
  USA: { latitude: 37.09, longitude: -95.71 },
};

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const countryColors: Record<string, string> = {
  Australia: '#8b7cf6',
  Canada: '#4cb5e8',
  Germany: '#f58d57',
  India: '#d36fba',
  Singapore: '#66c8a4',
  UAE: '#f2b84b',
  UK: '#7ebd62',
  USA: '#e06780',
};

export function CampaignMapPage({
  campaigns,
}: {
  campaigns: CampaignRecord[];
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countryRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        country: string;
        campaigns: number;
        revenue: number;
        budget: number;
        conversions: number;
        active: number;
      }
    >();

    for (const campaign of campaigns) {
      const current = grouped.get(campaign.countrySegment) ?? {
        country: campaign.countrySegment,
        campaigns: 0,
        revenue: 0,
        budget: 0,
        conversions: 0,
        active: 0,
      };
      current.campaigns += 1;
      current.revenue += campaign.revenue;
      current.budget += campaign.budget;
      current.conversions += campaign.conversions;
      current.active += campaign.status === 'Active' ? 1 : 0;
      grouped.set(campaign.countrySegment, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({ ...row, ...coordinates[row.country] }))
      .sort((left, right) => right.revenue - left.revenue);
  }, [campaigns]);

  const selected =
    countryRows.find((row) => row.country === selectedCountry) ?? null;

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      minZoom: 2,
      maxZoom: 8,
      worldCopyJump: true,
      zoomControl: true,
    }).setView([22, 18], 2);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const largestRevenue = Math.max(
      ...countryRows.map((country) => country.revenue)
    );
    const bounds = L.latLngBounds([]);

    for (const country of countryRows) {
      const radius = 10 + (country.revenue / largestRevenue) * 20;
      const marker = L.circleMarker([country.latitude, country.longitude], {
        radius,
        color: '#ffffff',
        weight: 2,
        fillColor: countryColors[country.country],
        fillOpacity: 0.88,
      })
        .bindTooltip(
          `<strong>${country.country}</strong><br>${country.campaigns} campaigns<br>${compactCurrency.format(country.revenue)} revenue`,
          { direction: 'top' }
        )
        .on('click', () => setSelectedCountry(country.country))
        .addTo(map);

      bounds.extend(marker.getLatLng());
    }

    map.fitBounds(bounds.pad(0.25), { maxZoom: 3 });
    mapInstance.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [countryRows]);

  const fitMarkets = () => {
    if (!mapInstance.current) return;
    const bounds = L.latLngBounds(
      countryRows.map((country) => [country.latitude, country.longitude])
    );
    mapInstance.current.fitBounds(bounds.pad(0.25), { maxZoom: 3 });
  };

  const focusCountry = (country: (typeof countryRows)[number]) => {
    setSelectedCountry(country.country);
    mapInstance.current?.flyTo([country.latitude, country.longitude], 4, {
      duration: 0.65,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-board p-400 lg:p-500">
      <div className="mx-auto max-w-dashboard space-y-400">
        <div className="flex flex-col gap-300 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-100 font-semibold uppercase tracking-wide text-primary">
              Geographic campaign intelligence
            </p>
            <h2 className="mt-100-nudge font-heading text-hero-700 font-semibold text-foreground">
              Country performance map
            </h2>
            <p className="mt-200 max-w-copy text-300 text-muted-foreground">
              Bubble size represents revenue. Select a country on the map or in
              the ranking to focus its campaign portfolio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-200">
            <button
              type="button"
              onClick={fitMarkets}
              className="inline-flex h-control items-center gap-200 rounded-lg border border-border bg-card px-300 text-200 font-semibold text-card-foreground transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPinned className="icon-size-200 text-primary" />
              Fit all markets
            </button>
            <div className="inline-flex h-control items-center gap-200 rounded-full border border-border bg-card px-300 text-200 text-muted-foreground">
              <MousePointer2 className="icon-size-200 text-primary" />
              Click a bubble to inspect
            </div>
          </div>
        </div>

        <div className="grid gap-400 xl:grid-cols-map">
          <section className="overflow-hidden rounded-xl border border-border bg-card p-400 shadow-column">
            <div
              ref={mapContainer}
              aria-label="Interactive campaign country map"
              className="h-map overflow-hidden rounded-lg"
            />
          </section>

          <aside className="rounded-xl border border-border bg-card p-400 shadow-column">
            {selected ? (
              <div>
                <div className="flex items-center justify-between gap-300">
                  <div>
                    <p className="text-100 font-semibold uppercase tracking-wide text-primary">
                      Selected market
                    </p>
                    <h3 className="mt-100-nudge font-heading text-500 font-semibold text-card-foreground">
                      {selected.country}
                    </h3>
                  </div>
                  <MapPinned className="icon-size-500 text-primary" />
                </div>
                <div className="mt-500 grid grid-cols-2 gap-300">
                  {[
                    ['Campaigns', selected.campaigns.toLocaleString()],
                    ['Active', selected.active.toLocaleString()],
                    ['Revenue', compactCurrency.format(selected.revenue)],
                    ['Budget', compactCurrency.format(selected.budget)],
                    ['Conversions', selected.conversions.toLocaleString()],
                    [
                      'Revenue / budget',
                      `${(selected.revenue / selected.budget).toFixed(1)}x`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-secondary p-300"
                    >
                      <p className="text-100 uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-100-nudge font-numeric text-400 font-semibold text-secondary-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid min-h-map-aside place-items-center text-center">
                <div>
                  <MapPinned className="mx-auto icon-size-700 text-primary" />
                  <h3 className="mt-300 font-heading text-400 font-semibold text-card-foreground">
                    Select a country
                  </h3>
                  <p className="mt-200 text-200 leading-300 text-muted-foreground">
                    Choose a bubble or ranking row to display country-specific
                    campaign KPIs.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <section className="rounded-xl border border-border bg-card p-400 shadow-column">
          <div className="flex items-center justify-between gap-300">
            <div>
              <h3 className="font-heading text-400 font-semibold text-card-foreground">
                Market ranking
              </h3>
              <p className="mt-100-nudge text-200 text-muted-foreground">
                All countries from the Campaign Data worksheet
              </p>
            </div>
            <TrendingUp className="icon-size-300 text-status-completed" />
          </div>
          <div className="mt-400 grid gap-300 md:grid-cols-2 xl:grid-cols-4">
            {countryRows.map((country, index) => (
              <button
                type="button"
                key={country.country}
                onClick={() => focusCountry(country)}
                aria-pressed={selectedCountry === country.country}
                className={`rounded-xl border p-300 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedCountry === country.country
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary hover:border-primary/40 hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between gap-300">
                  <span className="grid size-rank place-items-center rounded-full bg-card font-numeric text-100 font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <Target className="icon-size-200 text-primary" />
                </div>
                <p className="mt-300 font-heading text-300 font-semibold text-foreground">
                  {country.country}
                </p>
                <p className="mt-100-nudge font-numeric text-400 font-semibold text-foreground">
                  {compactCurrency.format(country.revenue)}
                </p>
                <p className="mt-100-nudge text-100 text-muted-foreground">
                  {country.campaigns} campaigns · {country.conversions}{' '}
                  conversions
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
