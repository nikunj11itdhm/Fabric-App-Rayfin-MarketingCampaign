//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import App from '@/App';

const { moveCampaign } = vi.hoisted(() => ({
  moveCampaign: vi.fn(),
}));

vi.mock('@/hooks/use-campaign-status-overrides', () => ({
  useCampaignStatusOverrides: () => ({
    overrides: {},
    loading: false,
    error: null,
    pendingCampaigns: new Set<string>(),
    moveCampaign,
    refresh: vi.fn(),
  }),
}));

vi.mock('@microsoft/fabric-visuals', () => ({
  VegaVisual: () => <div data-testid="vega-visual" />,
  useCssTheme: () => ({}),
}));

describe('App', () => {
  beforeEach(() => {
    moveCampaign.mockClear();
  });

  it('renders without throwing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('mounts content into the document', () => {
    render(<App />);
    expect(
      document.querySelector('[aria-label="Campaign status board"]')
    ).toBeInTheDocument();
  });

  it('renders the worksheet snapshot count', () => {
    render(<App />);
    expect(document.body).toHaveTextContent('1,000 records');
  });

  it('filters campaigns by workbook values', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search campaigns' }), {
      target: { value: 'MC0008' },
    });
    expect(document.body).toHaveTextContent('1 of 1,000 records');
    expect(
      screen.getByRole('button', { name: 'Open campaign MC0008' })
    ).toBeVisible();
  });

  it('opens the full campaign detail panel', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search campaigns' }), {
      target: { value: 'MC0001' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Open campaign MC0001' })
    );
    expect(
      screen.getByRole('complementary', {
        name: /Details for Discover Azure Databricks/,
      })
    ).toBeVisible();
    expect(screen.getByText('Cost per acquisition')).toBeVisible();
    expect(screen.getByText('$2,118')).toBeVisible();
  });

  it('persists a requested status move from the detail panel', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search campaigns' }), {
      target: { value: 'MC0001' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Open campaign MC0001' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(moveCampaign).toHaveBeenCalledWith('MC0001', 'Active');
  });

  it('navigates to map and performance pages', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Country map' }));
    expect(
      screen.getByRole('heading', { name: 'Country performance map' })
    ).toBeVisible();
    fireEvent.click(screen.getByTitle('Performance'));
    expect(
      screen.getByRole('heading', { name: 'Marketing command KPIs' })
    ).toBeVisible();
  });
});
