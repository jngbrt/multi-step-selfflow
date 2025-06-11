import { type NextRequest, NextResponse } from "next/server"
import type { FileWithMetadata, HistoryEntry } from "../../../types/selfflow"

export async function POST(request: NextRequest) {
  try {
    const { fileName, role, prompt } = await request.json()

    // Simulate worker execution delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real implementation, you would:
    // 1. Spawn a Python process with the role and prompt
    // 2. Wait for completion
    // 3. Read the updated metadata from the file
    // 4. Return the updated file metadata

    // For demo purposes, simulate worker execution
    const newHistoryEntry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      worker: role,
      action: "Executed workflow step",
      result: `Processed image according to role '${role}'. Applied transformations and prepared for next step.`,
      nextRole: role === "image_processor" ? "metadata_enricher" : "quality_checker",
    }

    const updatedFile: FileWithMetadata = {
      name: fileName,
      size: 1024 * 150, // Mock size
      type: "image/jpeg",
      selfflow: {
        role: newHistoryEntry.nextRole || role,
        prompt: getNextPrompt(newHistoryEntry.nextRole || role),
        history: [
          // Previous history would be loaded from file
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            worker: "initial_processor",
            action: "Image uploaded and metadata embedded",
            result: "Successfully embedded selfflow instructions",
            nextRole: "image_processor",
          },
          newHistoryEntry,
        ],
        status: "completed",
      },
    }

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error("Error running worker:", error)
    return NextResponse.json({ error: "Worker execution failed" }, { status: 500 })
  }
}

function getNextPrompt(role: string): string {
  const prompts: Record<string, string> = {
    metadata_enricher:
      "Enrich the image metadata with AI-generated tags and descriptions. Extract EXIF data and add semantic labels. Pass to quality_checker when complete.",
    quality_checker:
      "Perform quality analysis on the processed image. Check for artifacts, proper exposure, and color balance. Generate quality report and mark as final.",
    image_processor:
      "Analyze this image and extract key visual elements. Then resize to 800x600 and apply basic color correction. Pass to metadata_enricher when complete.",
  }

  return prompts[role] || "Complete the workflow step according to your role."
}
