"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, CheckCircle, AlertCircle, Activity } from "lucide-react"
import { useState } from "react"

interface WorkflowFile {
  id: string
  name: string
  currentRole: string
  status: string
  lastUpdated: number
  historyCount: number
}

interface WorkflowHistoryProps {
  files: WorkflowFile[]
}

export function WorkflowHistory({ files }: WorkflowHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  // Generate mock history entries
  const generateHistoryEntries = () => {
    const entries = []
    const roles = ["captioner", "translator", "resizer", "optimizer"]
    const actions = ["execute", "validate", "process", "analyze"]
    const statuses = ["success", "error", "warning"]

    files.forEach((file) => {
      for (let i = 0; i < file.historyCount; i++) {
        entries.push({
          id: `${file.id}-${i}`,
          fileName: file.name,
          fileId: file.id,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          role: roles[i % roles.length],
          action: actions[Math.floor(Math.random() * actions.length)],
          status: i === file.historyCount - 1 && file.status === "error" ? "error" : "success",
          message: `${roles[i % roles.length]} processing completed successfully`,
          duration: Math.floor(1000 + Math.random() * 3000),
          workerPid: 12345 + Math.floor(Math.random() * 1000),
        })
      }
    })

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const historyEntries = generateHistoryEntries()

  const filteredEntries = historyEntries.filter((entry) => {
    const matchesSearch =
      entry.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || entry.status === statusFilter
    const matchesRole = roleFilter === "all" || entry.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case "captioner":
        return "🖼️"
      case "translator":
        return "🌐"
      case "resizer":
        return "📏"
      case "optimizer":
        return "⚡"
      default:
        return "⚙️"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Workflow History
          </CardTitle>
          <CardDescription>Complete processing history across all files</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files, roles, or messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="captioner">Captioner</SelectItem>
                <SelectItem value="translator">Translator</SelectItem>
                <SelectItem value="resizer">Resizer</SelectItem>
                <SelectItem value="optimizer">Optimizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* History Entries */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history entries found</p>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Process some files to see history"}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(entry.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getRoleEmoji(entry.role)}</span>
                          <Badge variant="outline">{entry.role}</Badge>
                          <span className="text-sm text-gray-600">•</span>
                          <span className="font-medium">{entry.fileName}</span>
                        </div>

                        <p className="text-sm text-gray-800 mb-2">{entry.message}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Action: {entry.action}</span>
                          <span>Duration: {entry.duration}ms</span>
                          <span>Worker: {entry.workerPid}</span>
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          {filteredEntries.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{filteredEntries.length}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredEntries.filter((e) => e.status === "success").length}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {filteredEntries.filter((e) => e.status === "error").length}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(filteredEntries.reduce((acc, e) => acc + e.duration, 0) / filteredEntries.length)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
