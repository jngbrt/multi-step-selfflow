# Frontend Integration Guide

This document explains how the web frontend integrates with the Git repository version of the active metadata workflow system.

## Architecture Overview

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Flask API     │    │   Python        │
│   Frontend      │◄──►│   Bridge        │◄──►│   Workers       │
│   (Port 3000)   │    │   (Port 5000)   │    │   (CLI Tools)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │   File Upload   │    │   ExifTool      │
│   Dashboard     │    │   & Processing  │    │   Metadata      │
│   Monitoring    │    │   Queue         │    │   Embedding     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Key Integration Points

### 1. Repository Sync
- **Status**: Connected to `multi-step-selfflow` (main branch, commit cd3a520)
- **Schema**: Uses `selfflow.v1.yml` metadata structure
- **Workers**: Integrates with Python worker scripts

### 2. File Processing Flow
1. **Upload**: Files uploaded via web interface
2. **Initialize**: Metadata embedded using `MetadataEmbedder`
3. **Process**: Workers execute based on role matching
4. **Monitor**: Real-time progress tracking via API
5. **Complete**: Results displayed with full audit trail

### 3. API Endpoints
- `GET /api/status` - System status and repository info
- `GET /api/files` - List all workflow files
- `POST /api/upload` - Upload and initialize files
- `POST /api/files/{id}/start` - Start workflow processing
- `GET /api/files/{id}/metadata` - Get detailed metadata
- `GET /api/files/{id}/download` - Download processed file

### 4. Real-time Features
- **Live Monitoring**: WebSocket-like updates via polling
- **Progress Tracking**: Real-time progress bars
- **Status Updates**: Instant status changes
- **History Tracking**: Complete audit trail display

## Usage Instructions

### Quick Start
\`\`\`bash
# Clone and setup
git clone <repository>
cd active-metadata-workflow

# Start the complete system
chmod +x scripts/start_system.sh
./scripts/start_system.sh
\`\`\`

### Manual Setup
\`\`\`bash
# Backend (Terminal 1)
cd scripts
python api_bridge.py

# Frontend (Terminal 2)
npm install
npm run dev
\`\`\`

### Access Points
- **Web Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api/status
- **File Upload**: Dashboard → Upload Files tab
- **Live Monitor**: Dashboard → Live Monitor tab

## Features Demonstrated

### ✅ Self-Propelling Workflows
- Files carry their own processing instructions
- Workers self-select based on role matching
- No central orchestrator required

### ✅ Stateless Workers
- Workers only act when role matches
- Can run independently on different machines
- Fault-tolerant and resumable

### ✅ Composable Processing
- Add new steps by editing metadata
- Reorder workflow sequences easily
- Extensible worker architecture

### ✅ Complete Audit Trail
- All steps logged in file metadata
- Timestamps and duration tracking
- Full provenance preservation

### ✅ Web Interface
- Drag-and-drop file upload
- Real-time progress monitoring
- Detailed metadata inspection
- Processing history visualization

## File Format Support

The system supports embedding workflow metadata in:
- **Images**: JPG, PNG, TIFF, WebP (via XMP)
- **Documents**: PDF, DOCX (via XMP/metadata fields)
- **Archives**: ZIP, RAR (via comment fields)
- **Text Files**: TXT, JSON, XML (via comment headers)

## Worker Types Available

1. **🖼️ Captioner**: Generates image descriptions
2. **🌐 Translator**: Translates text content
3. **📏 Resizer**: Resizes images to specifications
4. **⚡ Optimizer**: Optimizes files for web delivery
5. **⚙️ Generic**: Customizable worker template

## Monitoring & Debugging

The web interface provides comprehensive monitoring:
- **System Status**: Repository sync, worker availability
- **File States**: Current role, processing status, progress
- **History View**: Complete processing timeline
- **Metadata Inspector**: Raw metadata examination
- **Error Tracking**: Failed operations and retry logic

This integration bridges the gap between the command-line workflow system and modern web-based file management, providing a complete solution for self-propelling metadata workflows.
