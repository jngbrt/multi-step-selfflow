import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FileWithMetadata } from "../../types/selfflow"
import { FileText, User } from "lucide-react"

interface MetadataViewerProps {
  file: FileWithMetadata
}

export function MetadataViewer({ file }: MetadataViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>File Metadata</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Name:</span>
            <p className="mt-1">{file.name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Size:</span>
            <p className="mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Type:</span>
            <p className="mt-1">{file.type}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <div className="mt-1">
              <Badge variant={file.selfflow?.status === "completed" ? "default" : "secondary"}>
                {file.selfflow?.status || "No selfflow data"}
              </Badge>
            </div>
          </div>
        </div>

        {file.selfflow && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Current Role
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{file.selfflow.role}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
