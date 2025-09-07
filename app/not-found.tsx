import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

export default async function NotFound() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || 'unknown'
  const timestamp = new Date().toISOString()
  console.log(`[404] Page not found: ${pathname} at ${timestamp}`)
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p>This page could not be found.</p>
    </div>
  )
}