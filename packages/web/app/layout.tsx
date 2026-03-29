import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TruthCast - Autonomous AI Fact-Checking',
  description: 'Multi-agent fact-checking pipeline with immutable blockchain provenance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
