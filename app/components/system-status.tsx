"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Cpu, HardDrive, Activity } from "lucide-react"

interface SystemStats {
  totalFiles: number
  activeWorkers: number
  completedToday: number
  avgProcessingTime: number
}

interface SystemStatusProps {
  stats: SystemStats
}

export function SystemStatus({ stats }: SystemStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-green-500 text-white border-0">
                  Online
                </Badge>
              </div>
            </div>
            <Server className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Workers</p>
              <p className="text-2xl font-bold">{stats.activeWorkers}</p>
            </div>
            <Cpu className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Files Processed</p>
              <p className="text-2xl font-bold">{stats.completedToday}</p>
            </div>
            <HardDrive className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Process Time</p>
              <p className="text-2xl font-bold">{stats.avgProcessingTime}ms</p>
            </div>
            <Activity className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
