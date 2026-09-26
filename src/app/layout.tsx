import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SDAPM | Precision medicine OS',
  description: 'Patient-specific anatomy and surgical simulation workspace.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
