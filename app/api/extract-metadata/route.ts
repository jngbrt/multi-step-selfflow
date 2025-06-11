import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import yaml from "js-yaml"
import type { FileWithMetadata, SelfflowMetadata } from "../../../types/selfflow"

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer())
    tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`)
    await writeFile(tempFilePath, buffer)

    // Extract selfflow metadata using ExifTool
    const selfflowData = await extractSelfflowMetadata(tempFilePath)

    const fileWithMetadata: FileWithMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      selfflow: selfflowData,
      filePath: tempFilePath, // Keep temp file for worker execution
    }

    return NextResponse.json(fileWithMetadata)
  } catch (error) {
    console.error("Error extracting metadata:", error)

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError)
      }
    }

    return NextResponse.json({ error: "Failed to extract metadata" }, { status: 500 })
  }
}

async function extractSelfflowMetadata(filePath: string): Promise<SelfflowMetadata | null> {
  return new Promise((resolve, reject) => {
    const exiftool = spawn("exiftool", ["-b", "-XMP-dc:Description", filePath])

    let stdout = ""
    let stderr = ""

    exiftool.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    exiftool.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    exiftool.on("close", (code) => {
      if (code !== 0) {
        console.error("ExifTool error:", stderr)
        resolve(null) // No selfflow metadata found
        return
      }

      try {
        // Parse YAML blob from XMP-dc:Description
        const yamlContent = stdout.trim()
        if (!yamlContent) {
          resolve(null)
          return
        }

        const parsedData = yaml.load(yamlContent) as any

        // Validate and structure the selfflow metadata
        if (parsedData && parsedData.selfflow) {
          const selfflowMeta: SelfflowMetadata = {
            role: parsedData.selfflow.role || "unknown",
            prompt: parsedData.selfflow.prompt || "",
            history: parsedData.selfflow.history || [],
            status: parsedData.selfflow.status || "pending",
          }
          resolve(selfflowMeta)
        } else {
          resolve(null)
        }
      } catch (parseError) {
        console.error("Error parsing YAML metadata:", parseError)
        resolve(null)
      }
    })

    exiftool.on("error", (error) => {
      console.error("ExifTool spawn error:", error)
      reject(error)
    })
  })
}
