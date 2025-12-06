'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface PdfUploadProps {
    onUploadComplete: (pdfId: string, textContent: string) => void
}

export function PdfUpload({ onUploadComplete }: PdfUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            toast.error('Invalid file type', {
                description: 'Please upload a PDF file',
            })
            return
        }

        setUploading(true)
        setProgress(10)

        const formData = new FormData()
        formData.append('file', file)

        try {
            // Simulate upload progress
            const interval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90))
            }, 500)

            const response = await fetch('/api/pdf/upload', {
                method: 'POST',
                body: formData,
            })

            clearInterval(interval)
            setProgress(100)

            if (!response.ok) throw new Error('Upload failed')

            const data = await response.json()

            toast.success('PDF uploaded successfully', {
                description: `${file.name} has been processed`,
            })

            onUploadComplete(data.id, data.text)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Upload failed', {
                description: 'Could not process the PDF file',
            })
        } finally {
            setUploading(false)
            setTimeout(() => setProgress(0), 1000)
        }
    }, [onUploadComplete])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: uploading,
    })

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="p-4 rounded-full bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium">
                            {isDragActive ? 'Drop PDF here' : 'Click or drag PDF to upload'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            PDFs up to 10MB
                        </p>
                    </div>
                </div>
            </div>

            {uploading && (
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Processing PDF...</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
            )}
        </div>
    )
}
