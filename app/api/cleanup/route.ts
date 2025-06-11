import { type NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    await unlink(filePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cleaning up file:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
