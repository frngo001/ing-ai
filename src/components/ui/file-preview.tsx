"use client"

import React, { useEffect, useState } from "react"
import { m } from "framer-motion"
import { FileIcon, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FilePreviewProps {
  file: File
  onRemove?: () => void
}

export const FilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>((props, ref) => {
  const fileType = props.file?.type || ""
  const fileName = props.file?.name || ""

  if (fileType.startsWith("image/")) {
    return <ImageFilePreview {...props} ref={ref} />
  }

  if (fileType.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    return <TextFilePreview {...props} ref={ref} />
  }

  return <GenericFilePreview {...props} ref={ref} />
})
FilePreview.displayName = "FilePreview"

const ImageFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove }, ref) => {
    const [previewOpen, setPreviewOpen] = useState(false)
    return (
      <>
        <m.div
          ref={ref}
          className="relative flex max-w-[200px] cursor-zoom-in rounded-md border p-1.5 pr-2 text-xs"
          layout
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          onClick={() => setPreviewOpen(true)}
        >
          <div className="flex w-full items-center space-x-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Attachment ${file.name}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted object-cover"
              src={URL.createObjectURL(file)}
            />
            <span className="w-full truncate text-muted-foreground">
              {file.name}
            </span>
          </div>

          {onRemove ? (
            <button
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-background shadow-sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              aria-label="Remove attachment"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          ) : null}
        </m.div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Bildvorschau: {file.name}</DialogTitle>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Attachment ${file.name}`}
              src={URL.createObjectURL(file)}
              className="max-h-full w-full object-contain rounded-md"
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }
)
ImageFilePreview.displayName = "ImageFilePreview"

const TextFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove }, ref) => {
    const [preview, setPreview] = React.useState<string>("")

    useEffect(() => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setPreview(text.slice(0, 15) + (text.length > 10 ? "..." : ""))
      }
      reader.readAsText(file)
    }, [file])

    return (
      <m.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted p-0.5">
            <div className="h-full w-full overflow-hidden text-[6px] leading-none text-muted-foreground">
              {preview || "Loading..."}
            </div>
          </div>
          <span className="w-full truncate text-muted-foreground">
            {file.name}
          </span>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-background shadow-sm"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </m.div>
    )
  }
)
TextFilePreview.displayName = "TextFilePreview"

const GenericFilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ file, onRemove }, ref) => {
    return (
      <m.div
        ref={ref}
        className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs"
        layout
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted">
            <FileIcon className="h-6 w-6 text-foreground" />
          </div>
          <span className="w-full truncate text-muted-foreground">
            {file.name}
          </span>
        </div>

        {onRemove ? (
          <button
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-background shadow-sm"
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </m.div>
    )
  }
)
GenericFilePreview.displayName = "GenericFilePreview"
