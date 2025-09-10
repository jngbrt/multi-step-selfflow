#!/usr/bin/env python3
"""
API Bridge - Connects the web frontend to the Python workflow system
"""

import os
import sys
import json
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import threading
import time
from metadata_embedder import MetadataEmbedder
from metadata_reader import MetadataReader

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp(prefix='workflow_')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'json', 'zip', 'docx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global state
active_files = {}
processing_queue = []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """Get system status information."""
    return jsonify({
        'status': 'online',
        'repository': {
            'name': 'multi-step-selfflow',
            'branch': 'main',
            'commit': 'cd3a520'
        },
        'workers': {
            'available': ['captioner', 'translator', 'resizer', 'optimizer'],
            'active': len([f for f in active_files.values() if f.get('status') == 'processing'])
        },
        'files': {
            'total': len(active_files),
            'processing': len([f for f in active_files.values() if f.get('status') == 'processing']),
            'completed': len([f for f in active_files.values() if f.get('status') == 'complete']),
            'pending': len([f for f in active_files.values() if f.get('status') == 'pending'])
        }
    })

@app.route('/api/files', methods=['GET'])
def get_files():
    """Get list of all files in the workflow system."""
    files_list = []
    
    for file_id, file_info in active_files.items():
        # Try to read current metadata
        try:
            reader = MetadataReader()
            metadata = reader.extract_workflow_metadata(file_info['path'])
            
            if metadata:
                current = metadata.get('current', {})
                history = metadata.get('history', [])
                outputs = metadata.get('outputs', {})
                
                file_info.update({
                    'currentRole': current.get('role', 'unknown'),
                    'status': current.get('status', 'unknown'),
                    'lastUpdated': current.get('updated_at', file_info.get('lastUpdated')),
                    'historyCount': len(history),
                    'outputs': outputs
                })
        except Exception as e:
            print(f"Error reading metadata for {file_id}: {e}")
        
        files_list.append(file_info)
    
    return jsonify(files_list)

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Upload files and initialize with workflow metadata."""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    initial_role = request.form.get('initialRole', 'captioner')
    priority = int(request.form.get('priority', 5))
    
    uploaded_files = []
    embedder = MetadataEmbedder()
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Initialize with workflow metadata
            success = embedder.embed_metadata(file_path, initial_role, priority)
            
            if success:
                file_id = f"file_{int(time.time() * 1000)}_{len(active_files)}"
                file_info = {
                    'id': file_id,
                    'name': filename,
                    'path': file_path,
                    'size': os.path.getsize(file_path),
                    'type': file.content_type or 'application/octet-stream',
                    'currentRole': initial_role,
                    'status': 'pending',
                    'progress': 0,
                    'lastUpdated': time.time(),
                    'historyCount': 0,
                    'priority': priority
                }
                
                active_files[file_id] = file_info
                uploaded_files.append(file_info)
    
    return jsonify({
        'message': f'Successfully uploaded {len(uploaded_files)} files',
        'files': uploaded_files
    })

@app.route('/api/files/<file_id>/start', methods=['POST'])
def start_workflow(file_id):
    """Start workflow processing for a specific file."""
    if file_id not in active_files:
        return jsonify({'error': 'File not found'}), 404
    
    file_info = active_files[file_id]
    
    # Add to processing queue
    processing_queue.append(file_id)
    file_info['status'] = 'processing'
    file_info['progress'] = 5
    
    # Start processing in background thread
    thread = threading.Thread(target=process_file_workflow, args=(file_id,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'message': 'Workflow started', 'file': file_info})

@app.route('/api/files/<file_id>/metadata', methods=['GET'])
def get_file_metadata(file_id):
    """Get detailed metadata for a specific file."""
    if file_id not in active_files:
        return jsonify({'error': 'File not found'}), 404
    
    file_info = active_files[file_id]
    
    try:
        reader = MetadataReader()
        metadata = reader.extract_workflow_metadata(file_info['path'])
        
        if metadata:
            return jsonify(metadata)
        else:
            return jsonify({'error': 'No workflow metadata found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>/download', methods=['GET'])
def download_file(file_id):
    """Download a processed file."""
    if file_id not in active_files:
        return jsonify({'error': 'File not found'}), 404
    
    file_info = active_files[file_id]
    
    if os.path.exists(file_info['path']):
        return send_file(file_info['path'], as_attachment=True, download_name=file_info['name'])
    else:
        return jsonify({'error': 'File not found on disk'}), 404

def vectorize_workflow_data(file_id, file_info):
    """Send workflow data to vector database for search indexing."""
    try:
        import requests
        
        # Read current metadata
        reader = MetadataReader()
        metadata = reader.extract_workflow_metadata(file_info['path'])
        
        if metadata:
            # Send to vectorization endpoint
            response = requests.post('http://localhost:3000/api/workflow/vectorize', json={
                'fileId': file_id,
                'fileName': file_info['name'],
                'metadata': metadata,
                'outputs': file_info.get('outputs', {})
            })
            
            if response.status_code == 200:
                print(f"✅ Vectorized workflow data for {file_info['name']}")
            else:
                print(f"⚠️ Failed to vectorize {file_info['name']}: {response.text}")
                
    except Exception as e:
        print(f"Error vectorizing workflow data: {e}")

def process_file_workflow(file_id):
    """Process a file through the complete workflow."""
    if file_id not in active_files:
        return
    
    file_info = active_files[file_id]
    file_path = file_info['path']
    
    try:
        # Read current metadata to determine workflow steps
        reader = MetadataReader()
        metadata = reader.extract_workflow_metadata(file_path)
        
        if not metadata:
            file_info['status'] = 'error'
            return
        
        current_role = metadata.get('current', {}).get('role', 'captioner')
        allowed_roles = metadata.get('config', {}).get('allowed_roles', ['captioner', 'translator', 'done'])
        
        # Process through each role in sequence
        for i, role in enumerate(allowed_roles):
            if role == 'done':
                break
                
            if role == current_role or i == 0:
                # Update progress
                progress = int((i + 1) / len(allowed_roles) * 100)
                file_info['progress'] = min(progress, 95)
                
                # Run the appropriate worker
                worker_script = get_worker_script(role)
                if worker_script:
                    result = subprocess.run([
                        sys.executable, worker_script,
                        '--file', file_path
                    ], capture_output=True, text=True)
                    
                    if result.returncode != 0:
                        file_info['status'] = 'error'
                        return
                    
                    # Small delay to simulate processing
                    time.sleep(1)
                    
                    # Re-read metadata to get updated state
                    metadata = reader.extract_workflow_metadata(file_path)
                    if metadata:
                        current_role = metadata.get('current', {}).get('role', 'done')
        
        # Mark as complete
        file_info['status'] = 'complete'
        file_info['progress'] = 100
        file_info['lastUpdated'] = time.time()
        
        # At the end of process_file_workflow function, after marking as complete:
        if file_info['status'] == 'complete':
            # Vectorize the workflow data for search
            vectorize_workflow_data(file_id, file_info)
        
    except Exception as e:
        print(f"Error processing file {file_id}: {e}")
        file_info['status'] = 'error'
        file_info['progress'] = 0

def get_worker_script(role):
    """Get the appropriate worker script for a role."""
    worker_scripts = {
        'captioner': 'image_captioner_worker.py',
        'translator': 'translation_worker.py',
        'resizer': 'generic_worker.py',
        'optimizer': 'generic_worker.py',
        'analyzer': 'generic_worker.py'
    }

    script_name = worker_scripts.get(role)
    if script_name:
        script_path = os.path.join(os.path.dirname(__file__), script_name)
        if os.path.exists(script_path):
            return script_path
    return None

if __name__ == '__main__':
    print(f"Starting API Bridge server...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Supported file types: {', '.join(ALLOWED_EXTENSIONS)}")
    app.run(debug=True, host='0.0.0.0', port=5000)
