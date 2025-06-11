import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SelfflowMetadata } from "../../types/selfflow"
import { MessageSquare, Target } from "lucide-react"

interface InstructionViewerProps {
  metadata: SelfflowMetadata
}

export function InstructionViewer({ metadata }: InstructionViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Current Instruction</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">Active Role:</span>
          </div>
          <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
            <code className="text-sm font-mono text-blue-800">{metadata.role}</code>
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <span className="font-medium text-gray-900">Instructions:</span>
          </div>
          <div className="bg-green-50 p-3 rounded border-l-4 border-green-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{metadata.prompt}</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Status:</strong> {metadata.status} | <strong>History entries:</strong> {metadata.history.length}
        </div>
      </CardContent>
    </Card>
  )
}
