import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import yaml from "js-yaml"
import type { FileWithMetadata, SelfflowMetadata } from "../../../../types/selfflow"

export async function POST(request: NextRequest) {
  try {
    const { filePath, fileName } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    // Execute Python worker
    const workerResult = await runPythonWorker(filePath)

    if (!workerResult.success) {
      return NextResponse.json({ error: workerResult.error }, { status: 500 })
    }

    // Re-extract updated metadata after worker execution
    const updatedMetadata = await extractUpdatedMetadata(filePath)

    const updatedFile: FileWithMetadata = {
      name: fileName,
      size: 0, // Size might have changed
      type: "image/jpeg", // Assume JPEG for now
      selfflow: updatedMetadata,
      filePath: filePath,
    }

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error("Error running worker:", error)
    return NextResponse.json({ error: "Worker execution failed" }, { status: 500 })
  }
}

async function runPythonWorker(filePath: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = spawn("python3", ["baton_runner.py", filePath])

    let stdout = ""
    let stderr = ""

    python.stdout.on("data", (data) => {
      stdout += data.toString()
      console.log("Python worker output:", data.toString())
    })

    python.stderr.on("data", (data) => {
      stderr += data.toString()
      console.error("Python worker error:", data.toString())
    })

    python.on("close", (code) => {
      if (code === 0) {
        console.log("Python worker completed successfully")
        resolve({ success: true })
      } else {
        console.error("Python worker failed with code:", code)
        resolve({ success: false, error: `Worker failed with exit code ${code}: ${stderr}` })
      }
    })

    python.on("error", (error) => {
      console.error("Python worker spawn error:", error)
      resolve({ success: false, error: `Failed to spawn worker: ${error.message}` })
    })
  })
}

async function extractUpdatedMetadata(filePath: string): Promise<SelfflowMetadata | null> {
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
        resolve(null)
        return
      }

      try {
        const yamlContent = stdout.trim()
        if (!yamlContent) {
          resolve(null)
          return
        }

        const parsedData = yaml.load(yamlContent) as any

        if (parsedData && parsedData.selfflow) {
          const selfflowMeta: SelfflowMetadata = {
            role: parsedData.selfflow.role || "unknown",
            prompt: parsedData.selfflow.prompt || "",
            history: parsedData.selfflow.history || [],
            status: parsedData.selfflow.status || "completed",
          }
          resolve(selfflowMeta)
        } else {
          resolve(null)
        }
      } catch (parseError) {
        console.error("Error parsing updated YAML metadata:", parseError)
        resolve(null)
      }
    })

    exiftool.on("error", (error) => {
      console.error("ExifTool spawn error:", error)
      reject(error)
    })
  })
}
