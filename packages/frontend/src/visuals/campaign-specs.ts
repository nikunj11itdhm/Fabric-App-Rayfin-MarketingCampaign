import type { VisualizationSpec } from '@microsoft/fabric-visuals';

export const revenueByProductSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Revenue by product',
  width: 'container',
  height: 'container',
  encoding: {
    y: {
      field: 'product',
      type: 'nominal',
      sort: '-x',
      title: null,
    },
    x: {
      field: 'revenue',
      type: 'quantitative',
      title: 'Revenue (USD)',
    },
  },
  layer: [
    {
      mark: { type: 'bar', cornerRadiusEnd: 5 },
      encoding: {
        color: {
          field: 'product',
          type: 'nominal',
          legend: null,
          scale: {
            domain: [
              'Azure AI Foundry',
              'Azure Databricks',
              'Azure OpenAI',
              'Azure SQL MI',
              'Copilot Studio',
              'Microsoft Fabric',
              'OneLake',
              'Power BI',
            ],
            range: [
              '#8b7cf6',
              '#4cb5e8',
              '#f58d57',
              '#d36fba',
              '#66c8a4',
              '#f2b84b',
              '#7ebd62',
              '#e06780',
            ],
          },
        },
      },
    },
    {
      mark: { type: 'text', style: 'labelHorizontal' },
      encoding: {
        text: { field: 'revenue', type: 'quantitative' },
      },
    },
  ],
};

export const statusMixSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Campaign count by status',
  width: 'container',
  height: 'container',
  mark: { type: 'arc', innerRadius: 72, outerRadius: 125 },
  encoding: {
    theta: { field: 'campaigns', type: 'quantitative' },
    color: {
      field: 'status',
      type: 'nominal',
      legend: { title: null, orient: 'bottom' },
      scale: {
        domain: ['Planned', 'Active', 'Paused', 'Completed'],
        range: ['#be8cff', '#5ac8fa', '#ffb64d', '#8fd56f'],
      },
    },
    tooltip: [
      { field: 'status', type: 'nominal', title: 'Status' },
      { field: 'campaigns', type: 'quantitative', title: 'Campaigns' },
      { field: 'revenue', type: 'quantitative', title: 'Revenue' },
    ],
  },
};

export const revenueByCountrySpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Revenue by country',
  width: 'container',
  height: 'container',
  encoding: {
    x: {
      field: 'country',
      type: 'nominal',
      sort: '-y',
      title: null,
    },
    y: {
      field: 'revenue',
      type: 'quantitative',
      title: 'Revenue (USD)',
    },
  },
  layer: [
    {
      mark: { type: 'bar', cornerRadiusTopLeft: 5, cornerRadiusTopRight: 5 },
      encoding: {
        color: {
          field: 'country',
          type: 'nominal',
          legend: null,
          scale: {
            domain: [
              'Australia',
              'Canada',
              'Germany',
              'India',
              'Singapore',
              'UAE',
              'UK',
              'USA',
            ],
            range: [
              '#8b7cf6',
              '#4cb5e8',
              '#f58d57',
              '#d36fba',
              '#66c8a4',
              '#f2b84b',
              '#7ebd62',
              '#e06780',
            ],
          },
        },
      },
    },
    {
      mark: { type: 'text', style: 'labelVertical' },
      encoding: {
        text: { field: 'revenue', type: 'quantitative' },
      },
    },
  ],
};
