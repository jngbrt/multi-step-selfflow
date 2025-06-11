import { Index } from "@upstash/vector"
import { NextResponse } from "next/server"

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

export const GET = async () => {
  try {
    const result = await index.fetch(["vector-id"], { includeData: true })

    return NextResponse.json({
      success: true,
      result: result[0],
    })
  } catch (error) {
    console.error("Vector fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch vector data" }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  try {
    const { id, vector, metadata } = await request.json()

    const result = await index.upsert([
      {
        id,
        vector,
        metadata,
      },
    ])

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Vector upsert error:", error)
    return NextResponse.json({ success: false, error: "Failed to store vector data" }, { status: 500 })
  }
}
