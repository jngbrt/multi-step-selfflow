"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Database, Zap } from "lucide-react"

interface SearchResult {
  id: string
  score: number
  metadata: {
    fileId: string
    fileName: string
    currentRole: string
    status: string
    searchableText: string
    outputs?: Record<string, any>
  }
}

export function VectorSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/workflow/vectorize?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || "Search failed")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Vector Search
        </CardTitle>
        <CardDescription>Search workflow files using semantic similarity powered by Upstash Vector</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for files, roles, outputs, or descriptions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? <Zap className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {/* Error Display */}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* Results */}
        <div className="space-y-3">
          {results.length === 0 && !isSearching && query && !error && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try different keywords or check if files have been vectorized</p>
            </div>
          )}

          {results.map((result) => (
            <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{result.metadata.fileName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{result.metadata.currentRole}</Badge>
                    <Badge
                      className={
                        result.metadata.status === "complete"
                          ? "bg-green-500"
                          : result.metadata.status === "processing"
                            ? "bg-blue-500"
                            : result.metadata.status === "error"
                              ? "bg-red-500"
                              : "bg-gray-500"
                      }
                    >
                      {result.metadata.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{(result.score * 100).toFixed(1)}% match</div>
                  <div className="text-xs text-gray-500">ID: {result.metadata.fileId}</div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">{result.metadata.searchableText}</p>

              {result.metadata.outputs && Object.keys(result.metadata.outputs).length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">Outputs:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(result.metadata.outputs).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {String(value).substring(0, 30)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Search Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Search by file names, worker roles, or output content</li>
            <li>• Use descriptive terms like "image caption" or "translation"</li>
            <li>• Results are ranked by semantic similarity</li>
            <li>• Files must be processed and vectorized to appear in search</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
