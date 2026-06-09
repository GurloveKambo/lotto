import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { Card, SectionTitle, Button, Input } from '../components/ui'

export function Settings() {
  const { settings, updateSettings, exportBackup, importBackup, resetAll, loadSampleData, results, betRecords } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')
  const [importOk, setImportOk] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [sampleDone, setSampleDone] = useState(false)

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('')
    setImportOk(false)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importBackup(reader.result as string)
        setImportOk(true)
        setTimeout(() => setImportOk(false), 3000)
      } catch (err) {
        setImportError('Invalid backup file. Please select a valid .json backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (resetConfirm) {
      resetAll()
      setResetConfirm(false)
    } else {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 5000)
    }
  }

  const handleSample = () => {
    loadSampleData()
    setSampleDone(true)
    setTimeout(() => setSampleDone(false), 2500)
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-[#8B949E]">Configure alerts, backup, and reset</p>
      </div>

      {/* Stats */}
      <Card>
        <SectionTitle>Database</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Results stored', v: results.length },
            { l: 'Bet records', v: betRecords.length },
          ].map(x => (
            <div key={x.l} className="bg-[#0D1117] rounded-lg p-3">
              <p className="text-xs text-[#484F58]">{x.l}</p>
              <p className="font-mono text-lg text-[#F0F6FC] mt-0.5">{x.v.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk alerts */}
      <Card>
        <SectionTitle>Risk Alerts</SectionTitle>
        <div className="space-y-3">
          <Input
            label="Alert when bet level ≥ (₹)"
            type="number"
            value={settings.maxBetAlert}
            onChange={e => updateSettings({ maxBetAlert: parseInt(e.target.value) || 80 })}
            min={10}
            step={10}
          />
          <Input
            label="Alert when daily loss ≥ (₹)"
            type="number"
            value={settings.maxDailyLossAlert}
            onChange={e => updateSettings({ maxDailyLossAlert: parseInt(e.target.value) || 5000 })}
            min={100}
            step={500}
          />
        </div>
      </Card>

      {/* GitHub Pages base path */}
      <Card>
        <SectionTitle>Deployment</SectionTitle>
        <Input
          label="GitHub Repo Name (for Pages base path)"
          value={settings.repoName}
          onChange={e => updateSettings({ repoName: e.target.value })}
          placeholder="lotto-tracker"
        />
        <p className="text-xs text-[#484F58] mt-2">
          Used as the Vite base path: <code className="text-violet-400">/{settings.repoName}/</code>
        </p>
      </Card>

      {/* Backup */}
      <Card>
        <SectionTitle>Backup &amp; Restore</SectionTitle>
        <div className="space-y-2">
          <Button onClick={exportBackup} className="w-full" variant="secondary">
            ↓ Export Backup (.json)
          </Button>
          <Button onClick={() => fileRef.current?.click()} className="w-full" variant="secondary">
            ↑ Import Backup
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />
          {importOk && (
            <div className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg p-2">
              ✓ Backup imported successfully
            </div>
          )}
          {importError && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-2">
              ✕ {importError}
            </div>
          )}
        </div>
      </Card>

      {/* Sample data */}
      <Card>
        <SectionTitle>Demo Data</SectionTitle>
        <p className="text-xs text-[#8B949E] mb-3">
          Load 30 days of randomised results to explore the app.
        </p>
        <Button onClick={handleSample} variant="secondary" className="w-full" disabled={sampleDone}>
          {sampleDone ? '✓ Sample data loaded' : 'Load sample data (30 days)'}
        </Button>
      </Card>

      {/* Danger zone */}
      <Card>
        <SectionTitle>Danger Zone</SectionTitle>
        <p className="text-xs text-[#8B949E] mb-3">
          Permanently delete all results, bet records, and reset strategies to default.
        </p>
        <Button onClick={handleReset} variant="danger" className="w-full">
          {resetConfirm ? '⚠ Tap again to confirm reset' : 'Reset all data'}
        </Button>
        {resetConfirm && (
          <p className="text-xs text-red-400 mt-2 text-center">This cannot be undone. Tap again to confirm.</p>
        )}
      </Card>

      {/* About */}
      <Card>
        <SectionTitle>About</SectionTitle>
        <div className="space-y-1 text-xs text-[#8B949E]">
          <p>Lotto Tracker v2.0</p>
          <p>Client-side PWA · Offline-first · localStorage</p>
          <p>No server · No data leaves your device</p>
          <p className="text-violet-400">github.com/gurlovekambo/{settings.repoName}</p>
        </div>
      </Card>
    </div>
  )
}
