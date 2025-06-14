"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, History, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WorkflowFile {
  id: string
  name: string
  currentRole: string
  status: string
  progress: number
  lastUpdated: string
  historyCount: number
  outputs?: Record<string, any>
}

interface MetadataViewerProps {
  file: WorkflowFile
}

export function MetadataViewer({ file }: MetadataViewerProps) {
  const mockMetadata = {
    version: 1.0,
    current: {
      role: file.currentRole,
      status: file.status,
      priority: 5,
      created_at: "2025-01-11T19:22:17Z",
      updated_at: file.lastUpdated,
      instruction:
        file.currentRole === "captioner"
          ? "Generate a descriptive caption for this image"
          : file.currentRole === "translator"
            ? "Translate the caption to Spanish"
            : "Process the file",
    },
    config: {
      timeout_seconds: 300,
      max_retries: 3,
      allowed_roles: ["captioner", "translator", "resizer", "optimizer", "publisher", "done"],
    },
    history: Array.from({ length: file.historyCount }, (_, i) => ({
      timestamp: new Date(Date.now() - (file.historyCount - i) * 60000).toISOString(),
      role: i === 0 ? "captioner" : "translator",
      action: "execute",
      status: "success",
      message: i === 0 ? "Generated caption successfully" : "Translated caption to Spanish",
      duration_ms: 2000 + Math.random() * 1000,
      worker_pid: 12345 + i,
    })),
    outputs: file.outputs || {},
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {file.name}
            </CardTitle>
            <CardDescription>Workflow metadata and processing details</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Metadata
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current">Current State</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="raw">Raw Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Role</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {mockMetadata.current.role}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge
                      className={
                        mockMetadata.current.status === "complete"
                          ? "bg-green-500"
                          : mockMetadata.current.status === "processing"
                            ? "bg-blue-500"
                            : mockMetadata.current.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-500"
                      }
                    >
                      {mockMetadata.current.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <div className="mt-1 text-lg font-medium">{mockMetadata.current.priority}/10</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <div className="mt-1 text-sm">{new Date(mockMetadata.current.created_at).toLocaleString()}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <div className="mt-1 text-sm">{new Date(mockMetadata.current.updated_at).toLocaleString()}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Processing Steps</label>
                  <div className="mt-1 text-lg font-medium">{mockMetadata.history.length}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Current Instruction</label>
              <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">{mockMetadata.current.instruction}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Workflow Sequence</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {mockMetadata.config.allowed_roles.map((role, index) => (
                  <div key={role} className="flex items-center">
                    <Badge
                      variant={role === mockMetadata.current.role ? "default" : "outline"}
                      className={role === mockMetadata.current.role ? "bg-blue-600" : ""}
                    >
                      {role}
                    </Badge>
                    {index < mockMetadata.config.allowed_roles.length - 1 && (
                      <span className="mx-2 text-gray-400">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {mockMetadata.history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No processing history yet</p>
                </div>
              ) : (
                mockMetadata.history.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{entry.role}</Badge>
                        <span className="text-sm text-gray-600">{entry.action}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{entry.duration_ms}ms</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className="text-sm">{entry.message}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Status: {entry.status} • Worker PID: {entry.worker_pid}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="outputs" className="space-y-4">
            <div className="space-y-4">
              {Object.keys(mockMetadata.outputs).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No outputs generated yet</p>
                </div>
              ) : (
                Object.entries(mockMetadata.outputs).map(([role, output]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="outline">{role}</Badge>
                      Output
                    </h3>
                    <div className="space-y-2">
                      {typeof output === "object" ? (
                        Object.entries(output as Record<string, any>).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-600">{key}</label>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                              {typeof value === "string" ? value : JSON.stringify(value)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 bg-gray-50 rounded text-sm">{String(output)}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Raw Metadata (JSON)</label>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border">
                {JSON.stringify(mockMetadata, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
