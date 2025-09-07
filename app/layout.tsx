import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "OneOfUs.beer - Saints Calendar",
  description: "Interactive Saints calendar with beer-count milestone tracking",
  generator: "v0.app",
}

import { headers } from 'next/headers'

async function logPageLoad() {
  try {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || 'unknown'
    const timestamp = new Date().toISOString()
    console.log(`[200] Page loaded: ${pathname} at ${timestamp}`)
  } catch (error) {
    console.error('[200] Error logging page load:', error)
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  logPageLoad()
  
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
