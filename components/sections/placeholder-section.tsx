"use client"

interface PlaceholderSectionProps {
  title: string
  description: string
}

export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-4">{description}</p>
      <p className="text-sm text-muted-foreground">Coming soon...</p>
    </div>
  )
}
