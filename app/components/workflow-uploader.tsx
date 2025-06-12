"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileImage, FileText, Archive, X } from "lucide-react"

interface WorkflowUploaderProps {
  onFilesUploaded: (files: File[]) => void
}

export function WorkflowUploader({ onFilesUploaded }: WorkflowUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [initialRole, setInitialRole] = useState("captioner")
  const [priority, setPriority] = useState("5")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      // Check if we're actually leaving the drop zone
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY

      if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        setDragActive(false)
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles((prev) => [...prev, ...files])
      e.dataTransfer.clearData()
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = () => {
    if (selectedFiles.length > 0) {
      onFilesUploaded(selectedFiles)
      setSelectedFiles([])
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-600" />
    if (type.startsWith("text/")) return <FileText className="h-5 w-5 text-green-600" />
    if (type.includes("zip") || type.includes("archive")) return <Archive className="h-5 w-5 text-purple-600" />
    return <FileText className="h-5 w-5 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Files for Processing</CardTitle>
          <CardDescription>Upload files to initialize them with workflow metadata and start processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <Upload
              className={`h-12 w-12 mx-auto mb-4 transition-colors ${dragActive ? "text-blue-500" : "text-gray-400"}`}
            />
            <p className="text-lg font-medium mb-2">
              {dragActive ? "Drop files here!" : "Drag and drop files here, or click to select"}
            </p>
            <p className="text-sm text-gray-600 mb-4">Supports images, documents, archives, and text files</p>
            <Button variant="outline" type="button" className="pointer-events-none">
              Select Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.txt,.json,.zip,.docx"
            />
          </div>

          {/* Workflow Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-role">Initial Worker Role</Label>
              <Select value={initialRole} onValueChange={setInitialRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select initial role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="captioner">🖼️ Captioner</SelectItem>
                  <SelectItem value="translator">🌐 Translator</SelectItem>
                  <SelectItem value="analyzer">🔍 Analyzer</SelectItem>
                  <SelectItem value="optimizer">⚡ Optimizer</SelectItem>
                  <SelectItem value="generic">⚙️ Generic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Processing Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Lowest</SelectItem>
                  <SelectItem value="3">3 - Low</SelectItem>
                  <SelectItem value="5">5 - Normal</SelectItem>
                  <SelectItem value="7">7 - High</SelectItem>
                  <SelectItem value="10">10 - Highest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || "Unknown type"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={uploadFiles} className="w-full" disabled={selectedFiles.length === 0}>
                Initialize {selectedFiles.length} File{selectedFiles.length !== 1 ? "s" : ""} with Workflow Metadata
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Schema Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Schema (selfflow.v1.yml)</CardTitle>
          <CardDescription>Files are initialized with this metadata structure</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {`version: 1.0
metadata:
  current:
    role: ${initialRole}
    status: pending
    priority: ${priority}
    created_at: [timestamp]
    updated_at: [timestamp]
  
  config:
    timeout_seconds: 300
    max_retries: 3
    allowed_roles:
      - captioner
      - translator
      - resizer
      - optimizer
      - publisher
      - done
  
  history: []
  outputs: {}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
