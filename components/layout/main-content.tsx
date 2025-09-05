"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface MainContentProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function MainContent({ title, children, actions }: MainContentProps) {
  return (
    <>
      {/* Top Bar */}
      <div className="bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {actions || (
              <>
                <Button variant="outline" size="sm">
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  Filter: VA
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </>
  )
}
