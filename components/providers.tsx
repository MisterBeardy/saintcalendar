"use client"

import { SessionProvider } from 'next-auth/react'
import { NotificationProvider } from './admin/notification-system'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  )
}