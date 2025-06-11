"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Activity, Zap, Target } from "lucide-react"

interface AnalyticsData {
  overview: {
    total_files: number
    processing_files: number
    completed_files: number
    pending_files: number
    error_files: number
    avg_processing_time: number
  }
  trends: {
    files_processed_today: number
    success_rate: number
    avg_workflow_steps: number
    most_common_role: string
  }
  performance: {
    avg_processing_time: number
    fastest_workflow: number
    slowest_workflow: number
    throughput_per_hour: number
  }
  errors: {
    total_errors: number
    error_rate: number
    common_errors: Array<{ type: string; count: number }>
  }
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin mr-2" />
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Analytics not available</p>
            <p className="text-sm">Database connection required</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const successRate = (analytics.trends.success_rate * 100).toFixed(1)
  const errorRate = (analytics.errors.error_rate * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Workflow Analytics
              </CardTitle>
              <CardDescription>Insights and performance metrics from the vector database</CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Live Data
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.overview.total_files}</p>
                    <p className="text-sm text-gray-600">Total Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.overview.completed_files}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.overview.processing_files}</p>
                    <p className="text-sm text-gray-600">Processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.overview.error_files}</p>
                    <p className="text-sm text-gray-600">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Success Rate</span>
                  <span className="text-2xl font-bold text-green-600">{successRate}%</span>
                </div>
                <Progress value={analytics.trends.success_rate * 100} className="h-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Successful: </span>
                    <span className="font-medium">{analytics.overview.completed_files}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed: </span>
                    <span className="font-medium">{analytics.overview.error_files}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Processing Speed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Time</span>
                    <span className="font-medium">{analytics.performance.avg_processing_time}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fastest</span>
                    <span className="font-medium text-green-600">{analytics.performance.fastest_workflow}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Slowest</span>
                    <span className="font-medium text-red-600">{analytics.performance.slowest_workflow}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.performance.throughput_per_hour}</div>
                  <div className="text-sm text-gray-600">Files per hour</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Progress</span>
                    <span>{analytics.trends.files_processed_today} files</span>
                  </div>
                  <Progress value={(analytics.trends.files_processed_today / 50) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.trends.avg_workflow_steps}</div>
                  <div className="text-sm text-gray-600">Avg Steps per File</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.trends.most_common_role}</div>
                  <div className="text-sm text-gray-600">Most Common Role</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{successRate}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Trends</CardTitle>
              <CardDescription>Daily and hourly processing patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Today's Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Files Processed</span>
                        <span className="font-medium">{analytics.trends.files_processed_today}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-medium text-green-600">{successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Steps</span>
                        <span className="font-medium">{analytics.trends.avg_workflow_steps}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Worker Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">🖼️ Captioner</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">🌐 Translator</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">⚡ Optimizer</span>
                        <span className="font-medium">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Error Analysis
              </CardTitle>
              <CardDescription>Error patterns and troubleshooting insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Error Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Errors</span>
                        <span className="font-medium text-red-600">{analytics.errors.total_errors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="font-medium">{errorRate}%</span>
                      </div>
                      <Progress value={analytics.errors.error_rate * 100} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Common Error Types</h4>
                    <div className="space-y-2">
                      {analytics.errors.common_errors.map((error, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm capitalize">{error.type.replace("_", " ")}</span>
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {error.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Troubleshooting Tips</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Check file formats are supported before upload</li>
                    <li>• Ensure ExifTool is properly installed and accessible</li>
                    <li>• Monitor disk space for large file processing</li>
                    <li>• Verify worker scripts have proper permissions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()} • Data from Upstash Vector Database
      </div>
    </div>
  )
}
