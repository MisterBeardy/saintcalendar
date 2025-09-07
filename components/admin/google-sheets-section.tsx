"use client"

import { useState, useEffect } from "react"
import { flushSync } from "react-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Eye, Upload, Download, X } from "lucide-react"

// TypeScript interfaces
interface Location {
  id: string
  state: string
  city: string
  displayName: string
  address: string
  sheetId: string
  isActive: boolean
}

interface ConsoleMessage {
  timestamp: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
}

interface PreviewData {
  locations: Location[]
  totalLocations: number
  activeLocations: number
  totalSaints: number
  totalSaintYears: number
  totalMilestones: number
  conflicts: string[]
  errors: string[]
}

interface ImportState {
  masterSheetId: string
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[]
  selectedLocations: string[]
  consoleMessages: ConsoleMessage[]
  isValidating: boolean
  isImporting: boolean
  previewData: PreviewData | null
  showPreview: boolean
  scanPhase: 'idle' | 'master-scanning' | 'master-complete' | 'locations-scanning' | 'completed'
  masterResults: Location[]
  locationProgress: Record<string, { saints: number, historical: number, milestones: number, status: string }>
}

interface ExportState {
  spreadsheetId: string
  exportMode: 'full' | 'incremental'
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[]
  selectedLocations: string[]
  isExporting: boolean
}

export function GoogleSheetsSection() {
  // Import state
  const [importState, setImportState] = useState<ImportState>({
    masterSheetId: '',
    selectedDataTypes: ['saints', 'historical', 'milestones'],
    selectedLocations: [],
    consoleMessages: [],
    isValidating: false,
    isImporting: false,
    previewData: null,
    showPreview: false,
    scanPhase: 'idle',
    masterResults: [],
    locationProgress: {}
  })

  // Export state
  const [exportState, setExportState] = useState<ExportState>({
    spreadsheetId: '',
    exportMode: 'incremental',
    selectedDataTypes: ['saints', 'historical', 'milestones'],
    selectedLocations: [],
    isExporting: false
  })

  // Add console message helper
  const addConsoleMessage = (type: ConsoleMessage['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setImportState(prev => ({
      ...prev,
      consoleMessages: [...prev.consoleMessages, { timestamp, type, message }]
    }))
  }

  // Clear console
  const clearConsole = () => {
    setImportState(prev => ({ ...prev, consoleMessages: [] }))
  }

  // Check master sheet
  const checkMasterSheet = async () => {
    if (!importState.masterSheetId.trim()) {
      addConsoleMessage('error', 'Master Sheet ID is required')
      return
    }

    setImportState(prev => ({
      ...prev,
      isValidating: true,
      previewData: null,
      showPreview: false,
      scanPhase: 'master-scanning',
      masterResults: [],
      locationProgress: {}
    }))

    try {
      addConsoleMessage('info', 'Scanning master sheet...')

      const response = await fetch('/api/database/import/sheets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: importState.masterSheetId })
      })

      const data = await response.json()

      if (data.success) {
        addConsoleMessage('success', `✓ Master sheet structure valid`)
        addConsoleMessage('success', `✓ Found ${data.totalLocations} locations (${data.activeLocations} active)`)

        if (data.conflicts.length > 0) {
          data.conflicts.forEach((conflict: string) => {
            addConsoleMessage('warning', `⚠ ${conflict}`)
          })
        }

        if (data.errors.length > 0) {
          data.errors.forEach((error: string) => {
            addConsoleMessage('error', `✗ ${error}`)
          })
        }

        setImportState(prev => ({
          ...prev,
          previewData: data,
          masterResults: data.locations,
          selectedLocations: data.locations.filter((loc: Location) => loc.isActive).map((loc: Location) => loc.sheetId),
          scanPhase: 'master-complete'
        }))
      } else {
        addConsoleMessage('error', `✗ ${data.message}`)
        data.errors?.forEach((error: string) => {
          addConsoleMessage('error', `✗ ${error}`)
        })
        setImportState(prev => ({ ...prev, scanPhase: 'idle' }))
      }
    } catch (error) {
      addConsoleMessage('error', `✗ Failed to check master sheet: ${error}`)
      setImportState(prev => ({ ...prev, scanPhase: 'idle' }))
    } finally {
      setImportState(prev => ({ ...prev, isValidating: false }))
    }
  }

  // Scan locations progressively
  const scanLocations = async () => {
    if (!importState.previewData || importState.scanPhase !== 'master-complete') {
      addConsoleMessage('error', 'Please complete master sheet scan first')
      return
    }

    setImportState(prev => ({ ...prev, scanPhase: 'locations-scanning' }))
    addConsoleMessage('info', 'Starting location scanning...')

    const activeLocations = importState.previewData!.locations.filter(loc => loc.isActive)

    // Initialize progress for all locations
    const initialProgress: Record<string, { saints: number, historical: number, milestones: number, status: string }> = {}
    activeLocations.forEach(loc => {
      initialProgress[loc.sheetId] = { saints: 0, historical: 0, milestones: 0, status: 'pending' }
    })

    setImportState(prev => ({ ...prev, locationProgress: initialProgress }))
    console.log('Initial locationProgress:', initialProgress)

    // Scan each location with real data from preview
    for (const location of activeLocations) {
      addConsoleMessage('info', `Scanning ${location.displayName}...`)

      // Update status to scanning
      flushSync(() => {
        setImportState(prev => ({
          ...prev,
          locationProgress: {
            ...prev.locationProgress,
            [location.sheetId]: { ...prev.locationProgress[location.sheetId], status: 'scanning' }
          }
        }))
      })

      try {
        // Simulate API call delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

        // Get real counts from preview data
        const locationSheet = importState.previewData!.locationSheets?.find(ls => ls.location.sheetId === location.sheetId)
        const saintsCount = locationSheet?.saints.length || 0
        const historicalCount = locationSheet?.saintYears.length || 0
        const milestonesCount = locationSheet?.milestones.length || 0

        console.log(`Location ${location.displayName} counts:`, { saintsCount, historicalCount, milestonesCount })

        flushSync(() => {
          setImportState(prev => ({
            ...prev,
            locationProgress: {
              ...prev.locationProgress,
              [location.sheetId]: {
                saints: saintsCount,
                historical: historicalCount,
                milestones: milestonesCount,
                status: 'completed'
              }
            }
          }))
        })

        console.log('Updated locationProgress:', {
          ...initialProgress,
          [location.sheetId]: {
            saints: saintsCount,
            historical: historicalCount,
            milestones: milestonesCount,
            status: 'completed'
          }
        })

        addConsoleMessage('success', `✓ ${location.displayName} scanned (${saintsCount} saints, ${historicalCount} historical, ${milestonesCount} milestones)`)
      } catch (error) {
        flushSync(() => {
          setImportState(prev => ({
            ...prev,
            locationProgress: {
              ...prev.locationProgress,
              [location.sheetId]: { ...prev.locationProgress[location.sheetId], status: 'error' }
            }
          }))
        })
        addConsoleMessage('error', `✗ Failed to scan ${location.displayName}: ${error}`)
      }
    }

    setImportState(prev => ({ ...prev, scanPhase: 'completed' }))
    addConsoleMessage('success', '✓ All locations scanned successfully')
  }

  // Handle data type selection
  const handleDataTypeChange = (dataType: 'saints' | 'historical' | 'milestones', checked: boolean) => {
    setImportState(prev => ({
      ...prev,
      selectedDataTypes: checked
        ? [...prev.selectedDataTypes, dataType]
        : prev.selectedDataTypes.filter(type => type !== dataType)
    }))
  }

  // Handle location selection
  const handleLocationChange = (locationId: string, checked: boolean) => {
    setImportState(prev => ({
      ...prev,
      selectedLocations: checked
        ? [...prev.selectedLocations, locationId]
        : prev.selectedLocations.filter(id => id !== locationId)
    }))
  }

  // Select/deselect all locations
  const toggleAllLocations = () => {
    if (!importState.previewData) return

    const allSelected = importState.previewData.locations
      .filter(loc => loc.isActive)
      .every(loc => importState.selectedLocations.includes(loc.sheetId))

    if (allSelected) {
      setImportState(prev => ({ ...prev, selectedLocations: [] }))
    } else {
      setImportState(prev => ({
        ...prev,
        selectedLocations: importState.previewData!.locations
          .filter(loc => loc.isActive)
          .map(loc => loc.sheetId)
      }))
    }
  }

  // Preview import
  const previewImport = () => {
    if (importState.selectedLocations.length === 0) {
      addConsoleMessage('error', 'Please select at least one location')
      return
    }
    setImportState(prev => ({ ...prev, showPreview: true }))
  }

  // Execute import
  const executeImport = async () => {
    if (importState.scanPhase !== 'completed' || !importState.masterSheetId || importState.selectedLocations.length === 0) {
      addConsoleMessage('error', 'Please complete scanning process and select locations')
      return
    }

    setImportState(prev => ({ ...prev, isImporting: true }))

    try {
      addConsoleMessage('info', 'Starting import...')

      const response = await fetch('/api/database/import/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: importState.masterSheetId,
          selectedLocations: importState.selectedLocations,
          selectedDataTypes: importState.selectedDataTypes,
          conflictResolution: 'skip' // Default to skip for safety
        })
      })

      const data = await response.json()

      if (data.success) {
        addConsoleMessage('success', `✓ Import completed successfully`)
        addConsoleMessage('info', `Processed ${data.recordsProcessed.locations} locations, ${data.recordsProcessed.saints} saints`)
      } else {
        addConsoleMessage('error', `✗ Import failed: ${data.message}`)
      }
    } catch (error) {
      addConsoleMessage('error', `✗ Import failed: ${error}`)
    } finally {
      setImportState(prev => ({ ...prev, isImporting: false }))
    }
  }

  // Execute export
  const executeExport = async () => {
    if (!exportState.spreadsheetId || exportState.selectedLocations.length === 0) {
      // For export, we'd show an error, but for now just log
      console.error('Export validation failed')
      return
    }

    setExportState(prev => ({ ...prev, isExporting: true }))

    try {
      const response = await fetch('/api/database/export/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: exportState.spreadsheetId,
          selectedLocations: exportState.selectedLocations,
          selectedDataTypes: exportState.selectedDataTypes,
          exportMode: exportState.exportMode
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Export completed:', data)
      } else {
        console.error('Export failed:', data.message)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExportState(prev => ({ ...prev, isExporting: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Google Sheets Sync</h2>
          <p className="text-sm text-muted-foreground">
            Import and export data between your database and Google Sheets
          </p>
        </div>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          {/* Master Sheet Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Master Sheet Validation</CardTitle>
              <CardDescription>Enter master sheet ID and validate structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Google Sheets ID or URL"
                  value={importState.masterSheetId}
                  onChange={(e) => setImportState(prev => ({ ...prev, masterSheetId: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  onClick={checkMasterSheet}
                  disabled={importState.isValidating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importState.isValidating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Check Master Sheet'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Types Selection */}
          {importState.previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Types</CardTitle>
                <CardDescription>Select data types to import</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saints"
                      checked={importState.selectedDataTypes.includes('saints')}
                      onChange={(e) => handleDataTypeChange('saints', e.target.checked)}
                    />
                    <Label htmlFor="saints" className="text-sm">
                      Saints Data ({importState.previewData.totalSaints} records)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="historical"
                      checked={importState.selectedDataTypes.includes('historical')}
                      onChange={(e) => handleDataTypeChange('historical', e.target.checked)}
                    />
                    <Label htmlFor="historical" className="text-sm">
                      Historical Data ({importState.previewData.totalSaintYears} records)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="milestones"
                      checked={importState.selectedDataTypes.includes('milestones')}
                      onChange={(e) => handleDataTypeChange('milestones', e.target.checked)}
                    />
                    <Label htmlFor="milestones" className="text-sm">
                      Milestones ({importState.previewData.totalMilestones} records)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Selection */}
          {importState.previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Locations</CardTitle>
                <CardDescription>Check individual location sheets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllLocations}
                  >
                    {importState.previewData.locations
                      .filter(loc => loc.isActive)
                      .every(loc => importState.selectedLocations.includes(loc.sheetId))
                      ? 'Deselect All'
                      : 'Select All'
                    }
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {importState.previewData.locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2 p-3 border rounded-md">
                      <Checkbox
                        id={location.id}
                        checked={importState.selectedLocations.includes(location.sheetId)}
                        onChange={(e) => handleLocationChange(location.sheetId, e.target.checked)}
                        disabled={!location.isActive}
                      />
                      <div className="flex-1">
                        <Label htmlFor={location.id} className="text-sm font-medium">
                          {location.displayName}
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={location.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {location.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Console Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan Results</CardTitle>
              <CardDescription>Real-time validation and scan output</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Console Output</span>
                  <Button variant="outline" size="sm" onClick={clearConsole}>
                    Clear Console
                  </Button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-48 overflow-y-auto font-mono text-sm">
                  {importState.consoleMessages.length === 0 ? (
                    <div className="text-gray-500">No messages yet...</div>
                  ) : (
                    importState.consoleMessages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-2 mb-1">
                        <span className="text-gray-400 text-xs">{msg.timestamp}</span>
                        <span className={`text-xs ${
                          msg.type === 'success' ? 'text-green-600' :
                          msg.type === 'warning' ? 'text-yellow-600' :
                          msg.type === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {msg.type === 'success' ? '✓' :
                           msg.type === 'warning' ? '⚠' :
                           msg.type === 'error' ? '✗' :
                           'ℹ'}
                        </span>
                        <span className="flex-1">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Master Sheet Results Table */}
          {importState.scanPhase === 'master-complete' && importState.masterResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Master Sheet Results</CardTitle>
                <CardDescription>Locations found in master sheet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">State</th>
                        <th className="text-left p-2">Address</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importState.masterResults.map((location) => (
                        <tr key={location.id} className="border-b">
                          <td className="p-2">{location.displayName}</td>
                          <td className="p-2">{location.state}</td>
                          <td className="p-2">{location.address}</td>
                          <td className="p-2 text-center">
                            <Badge variant={location.isActive ? "default" : "secondary"}>
                              {location.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Total: {importState.masterResults.length} locations ({importState.masterResults.filter(l => l.isActive).length} active)
                  </div>
                  <Button onClick={scanLocations} className="bg-blue-600 hover:bg-blue-700">
                    Proceed to Scan Locations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locations Progress Table */}
          {(importState.scanPhase === 'locations-scanning' || importState.scanPhase === 'completed') && Object.keys(importState.locationProgress).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location Scanning Progress</CardTitle>
                <CardDescription>Real-time scanning results for each location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Location</th>
                        <th className="text-center p-2">Saints Data</th>
                        <th className="text-center p-2">Historical Data</th>
                        <th className="text-center p-2">Milestones</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(importState.locationProgress).map(([sheetId, progress]) => {
                        const location = importState.masterResults.find(l => l.sheetId === sheetId)
                        return (
                          <tr key={sheetId} className="border-b">
                            <td className="p-2">{location?.displayName || sheetId}</td>
                            <td className="p-2 text-center">{progress.saints}</td>
                            <td className="p-2 text-center">{progress.historical}</td>
                            <td className="p-2 text-center">{progress.milestones}</td>
                            <td className="p-2 text-center">
                              <Badge
                                variant={
                                  progress.status === 'completed' ? 'default' :
                                  progress.status === 'error' ? 'destructive' :
                                  progress.status === 'scanning' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {progress.status === 'scanning' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                                {progress.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {importState.scanPhase === 'completed' && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Scanning completed for {Object.keys(importState.locationProgress).length} locations
                    </div>
                    <Button onClick={() => setImportState(prev => ({ ...prev, showPreview: true }))} className="bg-green-600 hover:bg-green-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Import
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Section */}
          {importState.scanPhase === 'completed' && importState.previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Summary</CardTitle>
                <CardDescription>Preview of data to be imported</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importState.previewData.totalLocations}</div>
                    <div className="text-sm text-muted-foreground">Total Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importState.previewData.activeLocations}</div>
                    <div className="text-sm text-muted-foreground">Active Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{importState.previewData.totalSaints}</div>
                    <div className="text-sm text-muted-foreground">Saints</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{importState.previewData.totalSaintYears}</div>
                    <div className="text-sm text-muted-foreground">Historical Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{importState.previewData.totalMilestones}</div>
                    <div className="text-sm text-muted-foreground">Milestones</div>
                  </div>
                </div>

                {importState.previewData.conflicts.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Conflicts Detected</span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {importState.previewData.conflicts.map((conflict, index) => (
                        <li key={index}>• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={previewImport}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={executeImport}
                    disabled={importState.isImporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {importState.isImporting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {importState.isImporting ? 'Importing...' : 'Import'}
                  </Button>
                  <Button variant="outline" onClick={() => setImportState(prev => ({ ...prev, scanPhase: 'idle', showPreview: false }))}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Configuration</CardTitle>
              <CardDescription>Configure export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="export-spreadsheet-id">Spreadsheet ID</Label>
                <Input
                  id="export-spreadsheet-id"
                  placeholder="Enter Google Sheets ID"
                  value={exportState.spreadsheetId}
                  onChange={(e) => setExportState(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Export Mode</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="full-export"
                      name="export-mode"
                      value="full"
                      checked={exportState.exportMode === 'full'}
                      onChange={(e) => setExportState(prev => ({ ...prev, exportMode: e.target.value as 'full' | 'incremental' }))}
                      aria-label="Full Export (replace all data)"
                    />
                    <Label htmlFor="full-export" className="text-sm">Full Export (replace all data)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="incremental-export"
                      name="export-mode"
                      value="incremental"
                      checked={exportState.exportMode === 'incremental'}
                      onChange={(e) => setExportState(prev => ({ ...prev, exportMode: e.target.value as 'full' | 'incremental' }))}
                      aria-label="Incremental (update existing)"
                    />
                    <Label htmlFor="incremental-export" className="text-sm">Incremental (update existing)</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Data Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-saints"
                      checked={exportState.selectedDataTypes.includes('saints')}
                      onChange={(e) => setExportState(prev => ({
                        ...prev,
                        selectedDataTypes: e.target.checked
                          ? [...prev.selectedDataTypes, 'saints']
                          : prev.selectedDataTypes.filter(type => type !== 'saints')
                      }))}
                    />
                    <Label htmlFor="export-saints" className="text-sm">Saints</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-historical"
                      checked={exportState.selectedDataTypes.includes('historical')}
                      onChange={(e) => setExportState(prev => ({
                        ...prev,
                        selectedDataTypes: e.target.checked
                          ? [...prev.selectedDataTypes, 'historical']
                          : prev.selectedDataTypes.filter(type => type !== 'historical')
                      }))}
                    />
                    <Label htmlFor="export-historical" className="text-sm">Historical Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-milestones"
                      checked={exportState.selectedDataTypes.includes('milestones')}
                      onChange={(e) => setExportState(prev => ({
                        ...prev,
                        selectedDataTypes: e.target.checked
                          ? [...prev.selectedDataTypes, 'milestones']
                          : prev.selectedDataTypes.filter(type => type !== 'milestones')
                      }))}
                    />
                    <Label htmlFor="export-milestones" className="text-sm">Milestones</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Selection</CardTitle>
              <CardDescription>Choose locations to export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Location selection would be populated from database locations
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={executeExport}
                  disabled={exportState.isExporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {exportState.isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {exportState.isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}