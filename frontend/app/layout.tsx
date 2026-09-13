import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PULSEDEPTH — Advanced Marine Intelligence Platform',
  description:
    'AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using Side-Scan Sonar Imagery. Multi-source evidence fusion and real-time geospatial intelligence.',
  keywords: [
    'Sonar',
    'Marine Debris',
    'Side-Scan Sonar',
    'Acoustic Detection',
    'Evidence Fusion',
    'Autonomous Underwater Vehicle',
    'Marine Intelligence',
    'Hydrographic Survey',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#030712] text-slate-100">
      <body className="min-h-full flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
