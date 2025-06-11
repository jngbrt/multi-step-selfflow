"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FileWithMetadata } from "../../types/selfflow"
import { Play, Loader2, Zap } from "lucide-react"

interface WorkerTriggerProps {
  file: FileWithMetadata
  onWorkerComplete: (updatedFile: FileWithMetadata) => void
}

export function WorkerTrigger({ file, onWorkerComplete }: WorkerTriggerProps) {
  const [isRunning, setIsRunning] = useState(false)

  const handleRunWorker = async () => {
    if (!file.selfflow || !file.filePath) return

    setIsRunning(true)

    try {
      const response = await fetch("/api/worker/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: file.filePath,
          fileName: file.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Worker execution failed")
      }

      const updatedFile: FileWithMetadata = await response.json()
      onWorkerComplete(updatedFile)
    } catch (error) {
      console.error("Error running worker:", error)
      // You might want to show this error to the user
    } finally {
      setIsRunning(false)
    }
  }

  const canRun = file.selfflow?.status === "pending" || file.selfflow?.status === "completed"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Worker Control</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Execute the current workflow step using the embedded instructions.</p>

          <Button onClick={handleRunWorker} disabled={!canRun || isRunning} className="w-full" size="lg">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Worker...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Worker
              </>
            )}
          </Button>

          {!canRun && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Worker cannot run in current state: {file.selfflow?.status}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
