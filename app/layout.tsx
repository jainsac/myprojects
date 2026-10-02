import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Cuddl — Meet through what you love', description: 'Activity-first social dating: play, listen, explore and connect.', applicationName: 'Cuddl', manifest: '/manifest.webmanifest', themeColor: '#e85b6a' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
