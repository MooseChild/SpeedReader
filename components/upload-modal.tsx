'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { parseFileClient } from '@/lib/client-parser'
import { saveBookOffline } from '@/lib/indexeddb'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

const ACCEPTED_TYPES = '.pdf,.epub,.docx,.txt,.md,.csv,.html,.htm,.xml,.json'

export function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'select' | 'uploading' | 'parsing' | 'done' | 'error'>('select')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setTitle('')
    setUrl('')
    setUploading(false)
    setStep('select')
    setProgress(0)
    setErrorMsg('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e?.target?.files?.[0]
    if (selected) {
      setFile(selected)
      const name = selected?.name ?? 'file'
      const nameWithoutExt = name?.substring(0, name?.lastIndexOf('.') ?? name?.length) ?? name
      setTitle(nameWithoutExt)
    }
  }

  const saveToServerAndOffline = async (
    docTitle: string,
    fileName: string,
    ext: string,
    fileSize: number,
    storagePath: string,
    text: string,
    wordCount: number
  ) => {
    // Save to server database
    const docRes = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: docTitle,
        fileName,
        fileType: ext,
        fileSize,
        storagePath,
        isPublic: false,
        contentText: text,
        wordCount,
      }),
    })
    if (!docRes?.ok) throw new Error('Failed to save document')
    const savedDoc = await docRes.json()

    // Also save to IndexedDB for offline access
    try {
      await saveBookOffline({
        id: savedDoc?.id ?? '',
        title: docTitle,
        fileName,
        fileType: ext,
        fileSize,
        wordCount,
        contentText: text,
        savedAt: Date.now(),
      })
    } catch (e) {
      console.warn('IndexedDB save failed (offline may not work):', e)
    }

    return savedDoc
  }

  const handleFileUpload = async () => {
    if (!file) return
    setUploading(true)
    setStep('parsing')
    setProgress(10)

    try {
      const fileName = file?.name ?? 'file'
      const ext = fileName?.split('.')?.pop()?.toLowerCase?.() ?? 'txt'

      // 1. Parse on client side (no API needed for PDF/EPUB)
      setProgress(20)
      const { text, wordCount } = await parseFileClient(file)
      setProgress(60)

      // 2. Upload file to server storage
      setStep('uploading')
      let storagePath = ''
      try {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        const uploadRes = await fetch('/api/upload/file', {
          method: 'POST',
          body: uploadFormData,
        })
        if (uploadRes?.ok) {
          const data = await uploadRes.json()
          storagePath = data?.storage_path ?? data?.cloud_storage_path ?? ''
        }
      } catch {
        // If upload fails (offline), continue — book is still saved via IndexedDB
        console.warn('File upload to server failed, saving offline only')
      }
      setProgress(80)

      // 3. Save to DB + IndexedDB
      try {
        await saveToServerAndOffline(
          title || fileName,
          fileName,
          ext,
          file?.size ?? 0,
          storagePath,
          text,
          wordCount
        )
      } catch {
        // Server save failed — save to IndexedDB only
        const offlineId = `offline-${Date.now()}`
        await saveBookOffline({
          id: offlineId,
          title: title || fileName,
          fileName,
          fileType: ext,
          fileSize: file?.size ?? 0,
          wordCount,
          contentText: text,
          savedAt: Date.now(),
        })
      }

      setProgress(100)
      setStep('done')
      toast.success('Document processed successfully!')
      setTimeout(() => {
        onUploaded()
        reset()
      }, 1000)
    } catch (error: any) {
      console.error('Upload error:', error)
      setErrorMsg(error?.message ?? 'Upload failed')
      setStep('error')
      toast.error(error?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!url?.trim()) return
    setUploading(true)
    setStep('uploading')
    setProgress(10)

    try {
      setStep('parsing')
      setProgress(20)

      const res = await fetch('/api/upload/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res?.ok) {
        const errData = await res?.json?.().catch(() => ({}))
        throw new Error(errData?.error ?? 'Failed to download from URL')
      }

      const data = await res.json()
      setProgress(80)

      await saveToServerAndOffline(
        title || data?.fileName || 'Imported Document',
        data?.fileName ?? 'download',
        data?.fileType ?? 'txt',
        data?.fileSize ?? 0,
        data?.storage_path ?? data?.cloud_storage_path ?? '',
        data?.text ?? '',
        data?.wordCount ?? 0
      )

      setProgress(100)
      setStep('done')
      toast.success('Document imported successfully!')
      setTimeout(() => {
        onUploaded()
        reset()
      }, 1000)
    } catch (error: any) {
      console.error('URL import error:', error)
      setErrorMsg(error?.message ?? 'Import failed')
      setStep('error')
      toast.error(error?.message ?? 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => {
      if (!isOpen) {
        onClose()
        reset()
      }
    }}>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'file' ? 'Upload Document' : 'Import from URL'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'file'
              ? 'Upload a PDF, EPUB, DOCX, TXT, or other text file to your library.'
              : 'Paste a direct link to a document file to import it.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 'select' && (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => setMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation ${
                    mode === 'file'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setMode('url')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation ${
                    mode === 'url'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Import URL
                </button>
              </div>

              {mode === 'file' ? (
                <>
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 sm:p-8 transition-colors hover:border-primary/50 active:border-primary/70 cursor-pointer touch-manipulation"
                    onClick={() => fileInputRef?.current?.click?.()}
                  >
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-primary" />
                        <p className="font-medium text-sm text-center break-all px-2">{file?.name ?? 'File'}</p>
                        <p className="text-xs text-muted-foreground">
                          {((file?.size ?? 0) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Tap to select a file</p>
                        <p className="text-xs text-muted-foreground text-center">PDF, EPUB, DOCX, TXT supported</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {file && (
                    <div className="space-y-2">
                      <Label htmlFor="title">Document Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e?.target?.value ?? '')}
                        placeholder="Enter a title..."
                        className="text-base h-11"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleFileUpload}
                    disabled={!file || uploading}
                    className="w-full gap-2 h-12 text-base touch-manipulation"
                  >
                    <Upload className="h-4 w-4" />
                    Upload & Process
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="url">Document URL</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e?.target?.value ?? '')}
                      placeholder="https://example.com/book.pdf"
                      type="url"
                      className="text-base h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a direct link to a PDF, EPUB, DOCX, TXT, or other supported file.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url-title">Document Title (optional)</Label>
                    <Input
                      id="url-title"
                      value={title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e?.target?.value ?? '')}
                      placeholder="Enter a title or leave blank to auto-detect"
                      className="text-base h-11"
                    />
                  </div>

                  <Button
                    onClick={handleUrlImport}
                    disabled={!url?.trim() || uploading}
                    className="w-full gap-2 h-12 text-base touch-manipulation"
                  >
                    <Link2 className="h-4 w-4" />
                    Download & Import
                  </Button>
                </>
              )}
            </>
          )}

          {(step === 'uploading' || step === 'parsing') && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {step === 'uploading'
                  ? (mode === 'url' ? 'Downloading file...' : 'Saving file...')
                  : 'Processing document...'}
              </p>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-green-600">
                {mode === 'url' ? 'Import complete!' : 'Upload complete!'}
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-medium text-destructive text-center px-2">{errorMsg || 'Upload failed'}</p>
              <Button variant="outline" onClick={reset} className="touch-manipulation">Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
