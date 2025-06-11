"use client"

import type React from "react"

import { useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileImage } from "lucide-react"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
}

export function FileUploader({ onFileUpload, isProcessing }: FileUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFileUpload(files[0])
      }
    },
    [onFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload(files[0])
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <FileImage className="h-8 w-8 text-gray-600" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your file here</h3>
              <p className="text-sm text-gray-600 mb-4">Upload an image or file with embedded selfflow metadata</p>
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.jpg,.jpeg,.png,.tiff"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" disabled={isProcessing} className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessing ? "Processing..." : "Choose File"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
