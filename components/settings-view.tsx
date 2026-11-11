'use client'

import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/animate'
import { Palette, Type, Save, Check } from 'lucide-react'
import { toast } from 'sonner'

const FONT_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'serif', label: 'Serif (Georgia)' },
  { value: 'sans', label: 'Sans-serif (DM Sans)' },
  { value: 'mono', label: 'Monospace (JetBrains)' },
  { value: 'dyslexic', label: 'OpenDyslexic' },
]

interface Settings {
  accentColor: string
  highlightColor: string
  readingFont: string
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>({
    accentColor: '#7C3AED',
    highlightColor: '#FBBF24',
    readingFont: 'system',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data && !data.error) setSettings({
        accentColor: data.accentColor || '#7C3AED',
        highlightColor: data.highlightColor || '#FBBF24',
        readingFont: data.readingFont || 'system',
      })
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        toast.success('Settings saved')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const PRESET_ACCENTS = ['#7C3AED', '#2563EB', '#DC2626', '#059669', '#D97706', '#EC4899', '#6366F1']
  const PRESET_HIGHLIGHTS = ['#FBBF24', '#34D399', '#60A5FA', '#F87171', '#A78BFA', '#FB923C']

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[800px] px-3 sm:px-4 py-6 sm:py-8">
        <FadeIn>
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Customize the app appearance.</p>
          </div>
        </FadeIn>

        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5" /> Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_ACCENTS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSettings(s => ({ ...s, accentColor: c }))}
                        className={`w-9 h-9 rounded-full border-2 transition-all touch-manipulation ${
                          settings.accentColor === c ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={settings.accentColor}
                      onChange={e => setSettings(s => ({ ...s, accentColor: e.target.value }))}
                      className="w-10 h-10 p-1 cursor-pointer rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Highlighted Word Color</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_HIGHLIGHTS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSettings(s => ({ ...s, highlightColor: c }))}
                        className={`w-9 h-9 rounded-full border-2 transition-all touch-manipulation ${
                          settings.highlightColor === c ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={settings.highlightColor}
                      onChange={e => setSettings(s => ({ ...s, highlightColor: e.target.value }))}
                      className="w-10 h-10 p-1 cursor-pointer rounded-lg"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-lg border p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: settings.accentColor }}>Accent Button</div>
                    <span className="text-lg">
                      The <span className="font-bold px-1 rounded" style={{ backgroundColor: `${settings.highlightColor}44`, color: settings.highlightColor }}>highlighted</span> word
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="h-5 w-5" /> Reading Font
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSettings(s => ({ ...s, readingFont: f.value }))}
                    className={`w-full text-left rounded-lg border p-3 transition-colors touch-manipulation ${
                      settings.readingFont === f.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <span
                      className="text-base"
                      style={{
                        fontFamily: f.value === 'serif' ? 'Georgia, serif'
                          : f.value === 'mono' ? 'var(--font-mono), monospace'
                          : f.value === 'dyslexic' ? 'OpenDyslexic, sans-serif'
                          : f.value === 'sans' ? 'var(--font-sans), sans-serif'
                          : 'inherit'
                      }}
                    >
                      {f.label} — The quick brown fox jumps over the lazy dog
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <Button onClick={handleSave} disabled={saving} className="gap-2 h-11 touch-manipulation">
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </FadeIn>
        </div>
      </main>
    </div>
  )
}
