import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Second Brain Debugger — Untangle Your Mind',
  description:
    "Dump your thoughts. Six AI stages parse, structure, find conflicts, extract clarity, plan actions, and ask the questions you've been avoiding.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
