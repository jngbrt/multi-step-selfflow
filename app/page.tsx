"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, RotateCcw, Eye, GitBranch, FileText, Zap } from "lucide-react"
import { WorkflowUploader } from "./components/workflow-uploader"
import { WorkflowMonitor } from "./components/workflow-monitor"
import { MetadataViewer } from "./components/metadata-viewer"
import { WorkflowHistory } from "./components/workflow-history"
import { SystemStatus } from "./components/system-status"
import { VectorSearch } from "./components/vector-search"

interface WorkflowFile {
  id: string
  name: string
  size: number
  type: string
  currentRole: string
  status: "pending" | "processing" | "complete" | "error"
  progress: number
  lastUpdated: number
  historyCount: number
  outputs?: Record<string, any>
}

export default function WorkflowDashboard() {
  const [files, setFiles] = useState<WorkflowFile[]>([])
  const [selectedFile, setSelectedFile] = useState<WorkflowFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [systemStats, setSystemStats] = useState({
    totalFiles: 0,
    activeWorkers: 0,
    completedToday: 0,
    avgProcessingTime: 0,
  })

  // Poll backend for file updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/files")
        if (res.ok) {
          const data = await res.json()
          setFiles(data)
        }
      } catch (e) {
        console.error(e)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleFileUpload = async (
    uploadedFiles: File[],
    initialRole: string,
    priority: string,
  ) => {
    const formData = new FormData()
    uploadedFiles.forEach((file) => formData.append("files", file))
    formData.append("initialRole", initialRole)
    formData.append("priority", priority)

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    if (data.files) {
      setFiles((prev) => [...prev, ...data.files])
    }
  }

  const startWorkflow = async (fileId: string) => {
    setIsProcessing(true)
    await fetch(`http://localhost:5000/api/files/${fileId}/start`, {
      method: "POST",
    })
    setIsProcessing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "captioner":
        return "🖼️"
      case "translator":
        return "🌐"
      case "resizer":
        return "📏"
      case "optimizer":
        return "⚡"
      case "done":
        return "✅"
      default:
        return "⚙️"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Active Metadata Workflow
              </h1>
              <p className="text-gray-600 text-lg">Self-Propelling File Processing System</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <GitBranch className="h-4 w-4" />
            <span>Connected to multi-step-selfflow (main)</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              cd3a520
            </Badge>
          </div>
        </div>

        {/* System Status */}
        <SystemStatus stats={systemStats} />

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="search">Vector Search</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{files.length}</p>
                      <p className="text-sm text-gray-600">Total Files</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{files.filter((f) => f.status === "processing").length}</p>
                      <p className="text-sm text-gray-600">Processing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{files.filter((f) => f.status === "complete").length}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{files.filter((f) => f.status === "pending").length}</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* File List */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Files</CardTitle>
                <CardDescription>Files in the self-propelling workflow system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No files uploaded yet</p>
                      <p className="text-sm">Upload files to start processing</p>
                    </div>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedFile?.id === file.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getRoleIcon(file.currentRole)}</div>
                            <div>
                              <h3 className="font-medium">{file.name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Role: {file.currentRole}</span>
                                <span>•</span>
                                <span>{(file.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>{file.historyCount} steps</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(file.status)}>{file.status}</Badge>

                            {file.status === "processing" && (
                              <div className="w-24">
                                <Progress value={file.progress} className="h-2" />
                              </div>
                            )}

                            {file.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startWorkflow(file.id)
                                }}
                                disabled={isProcessing}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                          </div>
                        </div>

                        {file.status === "processing" && (
                          <div className="mt-3">
                            <Progress value={file.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Processing with {file.currentRole} worker...</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected File Details */}
            {selectedFile && <MetadataViewer file={selectedFile} />}
          </TabsContent>

          <TabsContent value="upload">
            <WorkflowUploader onFilesUploaded={handleFileUpload} />
          </TabsContent>

          <TabsContent value="monitor">
            <WorkflowMonitor files={files} />
          </TabsContent>

          <TabsContent value="history">
            <WorkflowHistory files={files} />
          </TabsContent>

          <TabsContent value="search">
            <VectorSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
