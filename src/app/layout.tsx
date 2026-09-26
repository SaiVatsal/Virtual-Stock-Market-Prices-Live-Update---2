import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXUS TRADER | Forex & Gold Paper Trading Terminal',
  description: 'Simulated institutional paper-trading platform for XAUUSD & EURUSD with TradingView charts, OANDA price feed, webhooks, and server-side Claude AI suite.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#06090E] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
