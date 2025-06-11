"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, Clock, FileText } from "lucide-react"

interface SearchResult {
  id: string
  name: string
  currentRole: string
  status: string
  score: number
  lastUpdated: string
  relevance: string
}

interface SearchInterfaceProps {
  onFileSelect?: (fileId: string) => void
}

export function SearchInterface({ onFileSelect }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTime, setSearchTime] = useState(0)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    const startTime = Date.now()

    try {
      const response = await fetch("/api/files/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 20,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setSearchTime(Date.now() - startTime)
      } else {
        console.error("Search failed:", response.statusText)
        setResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Vector Search
        </CardTitle>
        <CardDescription>Search files using AI-powered semantic similarity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files by name, role, content, or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Search Suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Try:</span>
          {["image processing", "translation complete", "error status", "captioner role"].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(suggestion)
                // Auto-search after setting suggestion
                setTimeout(() => handleSearch(), 100)
              }}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Search Results</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{searchTime}ms</span>
                <span>•</span>
                <span>{results.length} results</span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onFileSelect?.(result.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getRoleEmoji(result.currentRole)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{result.name}</h4>
                          <Badge variant="outline">{result.currentRole}</Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Status: {result.status}</span>
                          <span>•</span>
                          <span>Updated: {new Date(result.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">{result.relevance}</div>
                        <div className="text-xs text-gray-500">relevance</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {query && !isSearching && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files found matching "{query}"</p>
            <p className="text-sm">Try different keywords or check your spelling</p>
          </div>
        )}

        {/* Search Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Search Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use descriptive terms like "image processing" or "translation complete"</li>
            <li>• Search by file status: "error", "complete", "processing"</li>
            <li>• Find files by worker role: "captioner", "translator", "optimizer"</li>
            <li>• Combine terms for more specific results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
