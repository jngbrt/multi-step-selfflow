import { Index } from "@upstash/vector"
import { NextResponse } from "next/server"

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

// Simple text-to-vector function (in production, use a proper embedding model)
function textToVector(text: string): number[] {
  // This is a simplified example - in production you'd use OpenAI embeddings or similar
  const vector = new Array(1536).fill(0)
  for (let i = 0; i < text.length && i < vector.length; i++) {
    vector[i] = text.charCodeAt(i) / 255
  }
  return vector
}

export const POST = async (request: Request) => {
  try {
    const { fileId, fileName, metadata, outputs } = await request.json()

    // Create searchable text from metadata and outputs
    const searchableText = [
      fileName,
      metadata?.current?.role || "",
      metadata?.current?.instruction || "",
      JSON.stringify(outputs || {}),
      metadata?.history?.map((h: any) => h.message).join(" ") || "",
    ].join(" ")

    // Convert to vector (simplified - use proper embeddings in production)
    const vector = textToVector(searchableText)

    // Store in vector database
    const result = await index.upsert([
      {
        id: `workflow-${fileId}`,
        vector,
        metadata: {
          fileId,
          fileName,
          currentRole: metadata?.current?.role,
          status: metadata?.current?.status,
          lastUpdated: metadata?.current?.updated_at,
          searchableText: searchableText.substring(0, 1000), // Truncate for storage
          outputs,
        },
      },
    ])

    return NextResponse.json({
      success: true,
      vectorId: `workflow-${fileId}`,
      result,
    })
  } catch (error) {
    console.error("Workflow vectorization error:", error)
    return NextResponse.json({ success: false, error: "Failed to vectorize workflow data" }, { status: 500 })
  }
}

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query) {
      return NextResponse.json({ success: false, error: "Query parameter 'q' is required" }, { status: 400 })
    }

    // Convert query to vector
    const queryVector = textToVector(query)

    // Search similar vectors
    const results = await index.query({
      vector: queryVector,
      topK: limit,
      includeMetadata: true,
      includeValues: false,
    })

    return NextResponse.json({
      success: true,
      query,
      results:
        results.matches?.map((match) => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata,
        })) || [],
    })
  } catch (error) {
    console.error("Vector search error:", error)
    return NextResponse.json({ success: false, error: "Failed to search workflow data" }, { status: 500 })
  }
}
