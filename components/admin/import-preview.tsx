'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

// Types based on API response
interface LocationPreview {
  id: string
  state: string
  city: string
  displayName: string
  address: string
  sheetId: string
  isActive: boolean
}

interface SaintPreview {
  saintNumber: string
  name: string
  saintName: string
  saintDate: string
  saintYear: number
}

interface SaintYearPreview {
  year: number
  burger: string
  tapBeerList: string[]
  canBottleBeerList: string[]
  facebookEvent?: string
  sticker?: string
}

interface MilestonePreview {
  count: number
  date: string
  sticker?: string
}

interface LocationSheetData {
  location: LocationPreview
  saints: SaintPreview[]
  saintYears: SaintYearPreview[]
  milestones: MilestonePreview[]
  errors: string[]
}

interface PreviewResult {
  success: boolean
  message: string
  locations: LocationPreview[]
  locationSheets: LocationSheetData[]
  totalLocations: number
  activeLocations: number
  totalSaints: number
  totalSaintYears: number
  totalMilestones: number
  conflicts: string[]
  errors: string[]
}

// Component props
interface ImportPreviewProps {
  spreadsheetId: string
  onImportComplete?: (result: any) => void
}

// Selection state types
interface ImportSelections {
  saints: boolean
  historicalData: boolean
  milestones: boolean
  locations: { [locationId: string]: boolean }
}

export default function ImportPreview({ spreadsheetId, onImportComplete }: ImportPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<ImportSelections>({
    saints: true,
    historicalData: true,
    milestones: true,
    locations: {}
  })
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [hasFetchedPreview, setHasFetchedPreview] = useState(false)
  const [showFullSelection, setShowFullSelection] = useState(false)

  // Fetch preview data function
  const fetchPreview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/database/import/sheets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch preview data')
      }

      const data: PreviewResult = await response.json()
      setPreviewData(data)
      setHasFetchedPreview(true)

      // Initialize location selections
      const locationSelections: { [key: string]: boolean } = {}
      data.locationSheets.forEach(sheet => {
        locationSelections[sheet.location.id] = true
      })
      setSelections(prev => ({ ...prev, locations: locationSelections }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Selection handlers
  const handleDataTypeChange = (dataType: keyof Omit<ImportSelections, 'locations'>, checked: boolean) => {
    setSelections(prev => ({ ...prev, [dataType]: checked }))
  }

  const handleLocationChange = (locationId: string, checked: boolean) => {
    setSelections(prev => ({
      ...prev,
      locations: { ...prev.locations, [locationId]: checked }
    }))
  }

  const handleSelectAllLocations = (checked: boolean) => {
    if (!previewData) return
    const newLocations = { ...selections.locations }
    previewData.locationSheets.forEach(sheet => {
      newLocations[sheet.location.id] = checked
    })
    setSelections(prev => ({ ...prev, locations: newLocations }))
  }

  const handleDeselectAllLocations = () => {
    handleSelectAllLocations(false)
  }

  const toggleLocationExpansion = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(locationId)) {
        newSet.delete(locationId)
      } else {
        newSet.add(locationId)
      }
      return newSet
    })
  }

  // Import execution
  const handleImport = async () => {
    if (!previewData) return

    try {
      setImporting(true)
      setStatusMessage('Starting import process...')

      // Convert selections.locations boolean map to selectedLocations string array
      const selectedLocations = Object.keys(selections.locations).filter(id => selections.locations[id])

      // Debug logs
      console.log('selections.locations:', selections.locations)
      console.log('selectedLocations array:', selectedLocations)
      console.log('selectedLocations length:', selectedLocations.length)

      // Ensure at least one location is selected
      if (selectedLocations.length === 0) {
        throw new Error('At least one location must be selected')
      }

      // Map data type selections to API format
      const selectedDataTypes: ('saints' | 'historical' | 'milestones')[] = []
      if (selections.saints) selectedDataTypes.push('saints')
      if (selections.historicalData) selectedDataTypes.push('historical')
      if (selections.milestones) selectedDataTypes.push('milestones')

      console.log('selectedDataTypes:', selectedDataTypes)

      const response = await fetch('/api/database/import/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          selectedLocations,
          selectedDataTypes,
          conflictResolution: 'skip' // Default conflict resolution
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Import failed with status ${response.status}`)
      }

      const result = await response.json()
      setStatusMessage('Import completed successfully')
      onImportComplete?.(result)
    } catch (err) {
      console.error('Import failed:', err)
      setStatusMessage(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      onImportComplete?.({ success: false, message: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setImporting(false)
    }
  }

  // Initial check step
  if (!hasFetchedPreview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Preview</CardTitle>
          <CardDescription>
            Verify the master sheet data before proceeding with the import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Master sheet ID: <code className="bg-muted px-2 py-1 rounded">{spreadsheetId}</code>
            </p>
            <Button
              onClick={fetchPreview}
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking...
                </>
              ) : (
                'Check Data'
              )}
            </Button>
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading preview...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !previewData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error: {error || 'Failed to load preview data'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Preview step
  if (!showFullSelection) {
    return (
      <div className="space-y-6">
        {/* Location Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Location Preview</CardTitle>
            <CardDescription>
              Locations found in the master sheet that will be available for import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {previewData.locations.map((location) => (
                <div key={location.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{location.displayName}</h4>
                    <Badge variant={location.isActive ? "default" : "secondary"}>
                      {location.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                  <p className="text-sm text-muted-foreground">Sheet ID: {location.sheetId}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {previewData.totalLocations} locations found ({previewData.activeLocations} active)
              </p>
              <Button onClick={() => setShowFullSelection(true)}>
                Proceed to Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedLocationsCount = Object.values(selections.locations).filter(Boolean).length
  const totalSelectedItems = selectedLocationsCount * (
    (selections.saints ? 1 : 0) +
    (selections.historicalData ? 1 : 0) +
    (selections.milestones ? 1 : 0)
  )

  return (
    <div className="space-y-6">
      {/* Screen reader status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
      {/* Import Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>
            Preview of data to be imported from Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{previewData.totalLocations}</div>
              <div className="text-sm text-muted-foreground">Total Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{previewData.activeLocations}</div>
              <div className="text-sm text-muted-foreground">Active Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{previewData.totalSaints}</div>
              <div className="text-sm text-muted-foreground">Saints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{previewData.totalSaintYears}</div>
              <div className="text-sm text-muted-foreground">Saint Years</div>
            </div>
          </div>

          {previewData.conflicts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-destructive mb-2">Conflicts Detected</h4>
              <ul className="list-disc list-inside space-y-1">
                {previewData.conflicts.map((conflict, index) => (
                  <li key={index} className="text-sm text-destructive">{conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {previewData.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-destructive mb-2">Errors</h4>
              <ul className="list-disc list-inside space-y-1">
                {previewData.errors.map((error, index) => (
                  <li key={index} className="text-sm text-destructive">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selective Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
          <CardDescription>
            Select which data types and locations to import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Data Type Selection */}
            <div>
              <h4 className="font-semibold mb-2">Data Types</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saints"
                    checked={selections.saints}
                    onChange={(e) => handleDataTypeChange('saints', e.target.checked)}
                  />
                  <Label htmlFor="saints">Saints Data ({previewData.totalSaints} records)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="historical"
                    checked={selections.historicalData}
                    onChange={(e) => handleDataTypeChange('historicalData', e.target.checked)}
                  />
                  <Label htmlFor="historical">Historical Data ({previewData.totalSaintYears} records)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="milestones"
                    checked={selections.milestones}
                    onChange={(e) => handleDataTypeChange('milestones', e.target.checked)}
                  />
                  <Label htmlFor="milestones">Milestones ({previewData.totalMilestones} records)</Label>
                </div>
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Locations ({selectedLocationsCount}/{previewData.locationSheets.length})</h4>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAllLocations(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllLocations}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {previewData.locationSheets.map((sheet) => (
                  <div key={sheet.location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${sheet.location.id}`}
                      checked={selections.locations[sheet.location.id] || false}
                      onChange={(e) => handleLocationChange(sheet.location.id, e.target.checked)}
                      aria-describedby={sheet.errors.length > 0 ? `location-errors-${sheet.location.id}` : undefined}
                    />
                    <Label htmlFor={`location-${sheet.location.id}`}>
                      {sheet.location.displayName}
                      {sheet.errors.length > 0 && (
                        <span id={`location-errors-${sheet.location.id}`} className="sr-only">
                          Has {sheet.errors.length} validation errors
                        </span>
                      )}
                      {sheet.errors.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {sheet.errors.length} errors
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Details */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Details</CardTitle>
          <CardDescription>
            Expand locations to see sample data and validation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previewData.locationSheets.map((sheet) => (
              <div key={sheet.location.id} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  onClick={() => toggleLocationExpansion(sheet.location.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleLocationExpansion(sheet.location.id)
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-2">
                    <span id={`location-header-${sheet.location.id}`} className="font-medium">{sheet.location.displayName}</span>
                    <Badge variant={sheet.location.isActive ? "default" : "secondary"}>
                      {sheet.location.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {sheet.errors.length > 0 && (
                      <Badge variant="destructive">
                        {sheet.errors.length} errors
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {sheet.saints.length} saints, {sheet.saintYears.length} years, {sheet.milestones.length} milestones
                    </span>
                    <Button variant="ghost" size="sm">
                      {expandedLocations.has(sheet.location.id) ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </div>

                {expandedLocations.has(sheet.location.id) && (
                  <div
                    id={`location-details-${sheet.location.id}`}
                    className="px-4 pb-4 space-y-4"
                    role="region"
                    aria-labelledby={`location-header-${sheet.location.id}`}
                  >
                    {/* Saints Preview */}
                    {sheet.saints.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Saints (Sample)</h5>
                        <div className="bg-muted/50 rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sheet.saints.slice(0, 6).map((saint, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{saint.name}</div>
                                <div className="text-muted-foreground">#{saint.saintNumber} - {saint.saintName}</div>
                                <div className="text-muted-foreground">{saint.saintDate}</div>
                              </div>
                            ))}
                          </div>
                          {sheet.saints.length > 6 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ... and {sheet.saints.length - 6} more saints
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Historical Data Preview */}
                    {sheet.saintYears.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Historical Data (Sample)</h5>
                        <div className="bg-muted/50 rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {sheet.saintYears.slice(0, 4).map((year, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{year.year}</div>
                                <div className="text-muted-foreground">Burger: {year.burger || 'N/A'}</div>
                                <div className="text-muted-foreground">
                                  Beers: {year.tapBeerList.length + year.canBottleBeerList.length} varieties
                                </div>
                              </div>
                            ))}
                          </div>
                          {sheet.saintYears.length > 4 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ... and {sheet.saintYears.length - 4} more years
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Milestones Preview */}
                    {sheet.milestones.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Milestones (Sample)</h5>
                        <div className="bg-muted/50 rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {sheet.milestones.slice(0, 4).map((milestone, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">K{milestone.count}</div>
                                <div className="text-muted-foreground">{milestone.date}</div>
                                {milestone.sticker && (
                                  <div className="text-muted-foreground">Sticker: {milestone.sticker}</div>
                                )}
                              </div>
                            ))}
                          </div>
                          {sheet.milestones.length > 4 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ... and {sheet.milestones.length - 4} more milestones
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Errors */}
                    {sheet.errors.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2 text-destructive">Validation Errors</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {sheet.errors.map((error, index) => (
                            <li key={index} className="text-sm text-destructive">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution */}
      {previewData.conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Conflict Resolution</CardTitle>
            <CardDescription>
              Review and resolve duplicate saint numbers before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewData.conflicts.map((conflict, index) => (
                <div key={index} className="border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-destructive mt-0.5">⚠️</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{conflict}</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`conflict-skip-${index}`}
                            defaultChecked={true}
                          />
                          <Label htmlFor={`conflict-skip-${index}`} className="text-sm">
                            Skip duplicate (recommended)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`conflict-overwrite-${index}`}
                          />
                          <Label htmlFor={`conflict-overwrite-${index}`} className="text-sm">
                            Overwrite existing record
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`conflict-rename-${index}`}
                          />
                          <Label htmlFor={`conflict-rename-${index}`} className="text-sm">
                            Create new record with modified saint number
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Execution */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Ready to import {totalSelectedItems} data types from {selectedLocationsCount} locations
              </p>
              {previewData.conflicts.length > 0 && (
                <p className="text-sm text-destructive mt-1">
                  ⚠️ {previewData.conflicts.length} conflicts detected - review resolution options above
                </p>
              )}
            </div>
            <Button
              onClick={handleImport}
              disabled={importing || totalSelectedItems === 0}
              className="min-w-32"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                'Import Selected'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}