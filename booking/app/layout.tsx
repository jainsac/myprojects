import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "BookFlow — Book any service", description: "Appointments, tables and services in one booking platform." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
