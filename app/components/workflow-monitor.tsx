"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface WorkflowFile {
  id: string
  name: string
  currentRole: string
  status: "pending" | "processing" | "complete" | "error"
  progress: number
  lastUpdated: string
  historyCount: number
}

interface WorkflowMonitorProps {
  files: WorkflowFile[]
}

export function WorkflowMonitor({ files }: WorkflowMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const refresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
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

  const processingFiles = files.filter((f) => f.status === "processing")
  const completedFiles = files.filter((f) => f.status === "complete")
  const pendingFiles = files.filter((f) => f.status === "pending")
  const errorFiles = files.filter((f) => f.status === "error")

  return (
    <div className="space-y-6">
      {/* Monitor Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Workflow Monitor
              </CardTitle>
              <CardDescription>Real-time monitoring of workflow file processing</CardDescription>
            </div>
            <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{processingFiles.length}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedFiles.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{pendingFiles.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorFiles.length}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</div>
        </CardContent>
      </Card>

      {/* Processing Files */}
      {processingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Currently Processing</CardTitle>
            <CardDescription>Files being processed by workers right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-gray-600">
                          Worker: {file.currentRole} • Step {file.historyCount + 1}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Progress value={file.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{file.progress.toFixed(0)}% complete</span>
                      <span>Updated: {new Date(file.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Files Status */}
      <Card>
        <CardHeader>
          <CardTitle>All Files Status</CardTitle>
          <CardDescription>Complete overview of all files in the workflow system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files in the workflow system</p>
                <p className="text-sm">Upload files to start monitoring</p>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <h3 className="font-medium">{file.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Role: {file.currentRole}</span>
                        <span>•</span>
                        <span>{file.historyCount} steps completed</span>
                        <span>•</span>
                        <span>{new Date(file.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                    {file.status === "processing" && (
                      <div className="w-20">
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Integration with multi-step-selfflow repository</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Repository Status</h4>
              <div className="space-y-1 text-gray-600">
                <div>Repository: multi-step-selfflow</div>
                <div>Branch: main</div>
                <div>Commit: cd3a520</div>
                <div>Status: ✅ Synced</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Worker Configuration</h4>
              <div className="space-y-1 text-gray-600">
                <div>Schema: selfflow.v1.yml</div>
                <div>Python Workers: Active</div>
                <div>ExifTool: Available</div>
                <div>Metadata: XMP Embedded</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
