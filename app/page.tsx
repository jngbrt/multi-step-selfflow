"use client"

import { useState } from "react"
import { FileUploader } from "./components/file-uploader"
import { MetadataViewer } from "./components/metadata-viewer"
import { InstructionViewer } from "./components/instruction-viewer"
import { WorkerTrigger } from "./components/worker-trigger"
import { ResultDisplay } from "./components/result-display"
import type { FileWithMetadata } from "../types/selfflow"

export default function SelfflowDemo() {
  const [currentFile, setCurrentFile] = useState<FileWithMetadata | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)

    try {
      // Create FormData to send file to API
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-metadata", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to extract metadata")

      const fileWithMetadata: FileWithMetadata = await response.json()
      setCurrentFile(fileWithMetadata)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWorkerComplete = (updatedFile: FileWithMetadata) => {
    setCurrentFile(updatedFile)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Selfflow Demo</h1>
          <p className="text-lg text-gray-600">
            Upload a file with embedded selfflow metadata to see the workflow in action
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Metadata */}
          <div className="space-y-6">
            <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />

            {currentFile && <MetadataViewer file={currentFile} />}
          </div>

          {/* Right Column - Instructions and Results */}
          <div className="space-y-6">
            {currentFile?.selfflow && (
              <>
                <InstructionViewer metadata={currentFile.selfflow} />

                <WorkerTrigger file={currentFile} onWorkerComplete={handleWorkerComplete} />

                <ResultDisplay metadata={currentFile.selfflow} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
