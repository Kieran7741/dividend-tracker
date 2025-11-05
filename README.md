# Dividend Tax Calculator

A Next.js web application for tracking dividend payments and calculating their EUR equivalent values using official ECB exchange rates.

## Features

- **Add Dividend Payments**: Record USD dividend payments with their payment dates
- **Automatic Currency Conversion**: Uses ECB (European Central Bank) exchange rates for accurate USD to EUR conversion
- **Local Storage**: All dividend data is stored in your browser's local storage
- **CSV Export**: Export your dividend history to CSV format for tax reporting
- **Collapsible Form**: Toggle the entry form to maximize screen space
- **Totals Calculation**: Automatically calculates total dividends in both USD and EUR

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Fetch Exchange Rates

Before running the app, fetch the latest exchange rates from the ECB:

```bash
node fetch-exchange-rates.js
```

This will download historical USD/EUR exchange rates and save them to `public/exchange-rates.json`.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## How It Works

1. **Enter a dividend**: Input the USD amount and payment date
2. **Automatic conversion**: The app looks up the ECB exchange rate for that date
3. **View your dividends**: All payments are displayed in a table with both USD and EUR amounts
4. **Export for taxes**: Click "Export CSV" to download your dividend history

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Exchange Rate Source**: European Central Bank (ECB) API

## Data Storage

All dividend data is stored locally in your browser using localStorage. No data is sent to any server.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/dividend-tax-calculator)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).
