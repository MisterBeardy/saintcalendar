export default function TemplatesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Sticker Templates</h1>
      <p className="text-muted-foreground mb-4">
        This page provides predefined sticker sizes and external resources as outlined in the design documentation.
      </p>
      <p className="text-sm text-muted-foreground">
        Reference: <a href="/docs/mockup/sticker.md#templates-section" className="underline">Templates Section Design</a>
      </p>
      {/* Placeholder for templates list - to be implemented */}
      <div className="mt-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p>Sticker templates will be displayed here based on the mockup design.</p>
      </div>
    </div>
  )
}