export interface SelfflowMetadata {
  role: string
  prompt: string
  history: HistoryEntry[]
  status: "pending" | "running" | "completed" | "error"
}

export interface HistoryEntry {
  timestamp: string
  worker: string
  action: string
  result?: string
  nextRole?: string
}

export interface FileWithMetadata {
  name: string
  size: number
  type: string
  selfflow?: SelfflowMetadata
  filePath?: string // Add this line for temp file path
}
