import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Second Brain Debugger — ML Cognitive Analysis',
  description:
    'A neural-network-style cognitive debugging interface. Six transformer stages parse, structure, detect conflicts, extract clarity, plan actions, and reflect.',
  keywords: ['second brain', 'thought debugger', 'mental clarity', 'AI analysis', 'ML visualization'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          * { font-family: 'JetBrains Mono', monospace !important; }
          body { overflow: hidden; background: #0a0a0a; }
        ` }} />
      </head>
      <body style={{ overflow: 'hidden', background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  )
}
