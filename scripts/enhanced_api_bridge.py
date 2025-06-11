#!/usr/bin/env python3
"""
Enhanced API Bridge with Database Integration
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
from datetime import datetime, timezone
from database_manager import DatabaseManager
from metadata_embedder import MetadataEmbedder
from metadata_reader import MetadataReader

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp(prefix='workflow_')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'json', 'zip', 'docx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize database
try:
    db = DatabaseManager()
    print("✅ Database connected successfully!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    db = None

# Global state (now backed by database)
active_files = {}
processing_queue = []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """Get system status information."""
    # Get stats from database if available
    if db:
        stats = db.get_system_stats()
    else:
        stats = {
            'total_files': len(active_files),
            'processing_files': len([f for f in active_files.values() if f.get('status') == 'processing']),
            'completed_files': len([f for f in active_files.values() if f.get('status') == 'complete']),
            'pending_files': len([f for f in active_files.values() if f.get('status') == 'pending']),
            'error_files': len([f for f in active_files.values() if f.get('status') == 'error']),
            'avg_processing_time': 2500,
            'database_status': 'disconnected'
        }
    
    return jsonify({
        'status': 'online',
        'database': {
            'status': stats.get('database_status', 'disconnected'),
            'provider': 'Upstash Vector',
            'features': ['search', 'analytics', 'persistence']
        },
        'repository': {
            'name': 'multi-step-selfflow',
            'branch': 'main',
            'commit': 'cd3a520'
        },
        'workers': {
            'available': ['captioner', 'translator', 'resizer', 'optimizer'],
            'active': stats.get('processing_files', 0)
        },
        'files': {
            'total': stats.get('total_files', 0),
            'processing': stats.get('processing_files', 0),
            'completed': stats.get('completed_files', 0),
            'pending': stats.get('pending_files', 0),
            'errors': stats.get('error_files', 0)
        },
        'performance': {
            'avg_processing_time': stats.get('avg_processing_time', 0)
        }
    })

@app.route('/api/files', methods=['GET'])
def get_files():
    """Get list of all files in the workflow system."""
    files_list = []
    
    # Get files from database if available
    if db:
        try:
            db_files = db.get_all_files(100)
            for db_file in db_files:
                metadata = db_file.get('metadata', {})
                if metadata.get('type') != 'history':  # Skip history entries
                    file_info = {
                        'id': db_file.get('id'),
                        'name': metadata.get('name', ''),
                        'size': metadata.get('size', 0),
                        'type': metadata.get('type', ''),
                        'currentRole': metadata.get('currentRole', ''),
                        'status': metadata.get('status', ''),
                        'progress': metadata.get('progress', 0),
                        'lastUpdated': metadata.get('updated_at', ''),
                        'historyCount': metadata.get('historyCount', 0),
                        'priority': metadata.get('priority', 5),
                        'score': db_file.get('score', 0)  # Relevance score from search
                    }
                    files_list.append(file_info)
        except Exception as e:
            print(f"Error getting files from database: {e}")
            # Fall back to in-memory files
            files_list = list(active_files.values())
    else:
        # Use in-memory files
        files_list = list(active_files.values())
    
    return jsonify(files_list)

@app.route('/api/files/search', methods=['POST'])
def search_files():
    """Search files using vector similarity."""
    if not db:
        return jsonify({'error': 'Database not available'}), 503
    
    data = request.get_json()
    query = data.get('query', '')
    limit = data.get('limit', 10)
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        results = db.search_files(query, limit)
        
        # Format results
        formatted_results = []
        for result in results:
            metadata = result.get('metadata', {})
            if metadata.get('type') != 'history':  # Skip history entries
                file_info = {
                    'id': result.get('id'),
                    'name': metadata.get('name', ''),
                    'currentRole': metadata.get('currentRole', ''),
                    'status': metadata.get('status', ''),
                    'score': result.get('score', 0),
                    'lastUpdated': metadata.get('updated_at', ''),
                    'relevance': f"{result.get('score', 0):.2f}"
                }
                formatted_results.append(file_info)
        
        return jsonify({
            'query': query,
            'results': formatted_results,
            'total': len(formatted_results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
                    'lastUpdated': datetime.now(timezone.utc).isoformat(),
                    'historyCount': 0,
                    'priority': priority
                }
                
                # Store in memory
                active_files[file_id] = file_info
                
                # Store in database
                if db:
                    try:
                        db.store_file_record(file_info)
                        print(f"✅ Stored {filename} in database")
                    except Exception as e:
                        print(f"❌ Failed to store {filename} in database: {e}")
                
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
    file_info['lastUpdated'] = datetime.now(timezone.utc).isoformat()
    
    # Update database
    if db:
        try:
            db.update_file_record(file_id, {
                'status': 'processing',
                'progress': 5
            })
        except Exception as e:
            print(f"Error updating database: {e}")
    
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
        
        # Get history from database if available
        if db:
            try:
                history = db.get_file_history(file_id)
                if metadata:
                    metadata['history'] = history
            except Exception as e:
                print(f"Error getting history from database: {e}")
        
        if metadata:
            return jsonify(metadata)
        else:
            return jsonify({'error': 'No workflow metadata found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>/history', methods=['GET'])
def get_file_history(file_id):
    """Get workflow history for a specific file."""
    if not db:
        return jsonify({'error': 'Database not available'}), 503
    
    try:
        history = db.get_file_history(file_id)
        return jsonify({
            'file_id': file_id,
            'history': history,
            'total': len(history)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get workflow analytics and insights."""
    if not db:
        return jsonify({'error': 'Database not available'}), 503
    
    try:
        stats = db.get_system_stats()
        
        # Additional analytics
        analytics = {
            'overview': stats,
            'trends': {
                'files_processed_today': stats.get('completed_files', 0),
                'success_rate': 0.95,  # Mock data
                'avg_workflow_steps': 2.3,
                'most_common_role': 'captioner'
            },
            'performance': {
                'avg_processing_time': stats.get('avg_processing_time', 0),
                'fastest_workflow': 1200,  # Mock data
                'slowest_workflow': 4500,
                'throughput_per_hour': 24
            },
            'errors': {
                'total_errors': stats.get('error_files', 0),
                'error_rate': 0.05,
                'common_errors': [
                    {'type': 'timeout', 'count': 2},
                    {'type': 'invalid_format', 'count': 1}
                ]
            }
        }
        
        return jsonify(analytics)
        
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
            if db:
                db.update_file_record(file_id, {'status': 'error'})
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
                file_info['lastUpdated'] = datetime.now(timezone.utc).isoformat()
                
                # Update database
                if db:
                    try:
                        db.update_file_record(file_id, {
                            'progress': file_info['progress'],
                            'currentRole': role
                        })
                    except Exception as e:
                        print(f"Error updating database: {e}")
                
                # Store workflow history entry
                if db:
                    try:
                        history_entry = {
                            'timestamp': datetime.now(timezone.utc).isoformat(),
                            'role': role,
                            'action': 'execute',
                            'status': 'started',
                            'message': f'Started {role} processing',
                            'duration_ms': 0,
                            'worker_pid': os.getpid()
                        }
                        db.store_workflow_history(file_id, history_entry)
                    except Exception as e:
                        print(f"Error storing history: {e}")
                
                # Run the appropriate worker
                start_time = time.time()
                worker_script = get_worker_script(role)
                if worker_script:
                    result = subprocess.run([
                        sys.executable, worker_script,
                        '--file', file_path
                    ], capture_output=True, text=True)
                    
                    duration_ms = int((time.time() - start_time) * 1000)
                    
                    if result.returncode != 0:
                        file_info['status'] = 'error'
                        if db:
                            db.update_file_record(file_id, {'status': 'error'})
                            # Store error in history
                            error_entry = {
                                'timestamp': datetime.now(timezone.utc).isoformat(),
                                'role': role,
                                'action': 'execute',
                                'status': 'error',
                                'message': f'Error in {role}: {result.stderr}',
                                'duration_ms': duration_ms,
                                'worker_pid': os.getpid()
                            }
                            db.store_workflow_history(file_id, error_entry)
                        return
                    
                    # Store success in history
                    if db:
                        try:
                            success_entry = {
                                'timestamp': datetime.now(timezone.utc).isoformat(),
                                'role': role,
                                'action': 'execute',
                                'status': 'success',
                                'message': f'Completed {role} processing successfully',
                                'duration_ms': duration_ms,
                                'worker_pid': os.getpid()
                            }
                            db.store_workflow_history(file_id, success_entry)
                        except Exception as e:
                            print(f"Error storing success history: {e}")
                    
                    # Small delay to simulate processing
                    time.sleep(1)
                    
                    # Re-read metadata to get updated state
                    metadata = reader.extract_workflow_metadata(file_path)
                    if metadata:
                        current_role = metadata.get('current', {}).get('role', 'done')
        
        # Mark as complete
        file_info['status'] = 'complete'
        file_info['progress'] = 100
        file_info['lastUpdated'] = datetime.now(timezone.utc).isoformat()
        
        # Update database
        if db:
            try:
                db.update_file_record(file_id, {
                    'status': 'complete',
                    'progress': 100,
                    'historyCount': file_info.get('historyCount', 0) + 1
                })
            except Exception as e:
                print(f"Error updating database: {e}")
        
    except Exception as e:
        print(f"Error processing file {file_id}: {e}")
        file_info['status'] = 'error'
        file_info['progress'] = 0
        if db:
            db.update_file_record(file_id, {'status': 'error', 'progress': 0})

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
    if script_name and os.path.exists(script_name):
        return script_name
    return None

if __name__ == '__main__':
    print(f"🚀 Starting Enhanced API Bridge with Database Integration...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📄 Supported file types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    if db:
        print(f"✅ Database: Connected to Upstash Vector")
        print(f"🔍 Features: Search, Analytics, Persistence")
    else:
        print(f"❌ Database: Not connected (running in memory mode)")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
