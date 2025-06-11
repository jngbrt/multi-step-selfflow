import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SelfflowMetadata } from "../../types/selfflow"
import { History, Clock, CheckCircle, ArrowRight } from "lucide-react"

interface ResultDisplayProps {
  metadata: SelfflowMetadata
}

export function ResultDisplay({ metadata }: ResultDisplayProps) {
  if (metadata.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Execution History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            No execution history yet. Run a worker to see results.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Execution History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metadata.history.map((entry, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">{entry.worker}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                <strong>Action:</strong> {entry.action}
              </p>

              {entry.result && (
                <p className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-blue-200">{entry.result}</p>
              )}

              {entry.nextRole && (
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Next role:</span>
                  <Badge variant="outline">{entry.nextRole}</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
