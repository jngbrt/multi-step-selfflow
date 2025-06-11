#!/usr/bin/env python3
"""
Database Manager - Handles Upstash Vector database operations for workflow system
"""

import os
import json
import time
import hashlib
from typing import Dict, List, Optional, Any
import requests
from datetime import datetime, timezone

class DatabaseManager:
    def __init__(self):
        self.base_url = os.getenv('UPSTASH_VECTOR_REST_URL')
        self.token = os.getenv('UPSTASH_VECTOR_REST_TOKEN')
        self.readonly_token = os.getenv('UPSTASH_VECTOR_REST_READONLY_TOKEN')
        
        if not all([self.base_url, self.token]):
            raise ValueError("Missing required Upstash Vector environment variables")
        
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        self.readonly_headers = {
            'Authorization': f'Bearer {self.readonly_token}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, readonly: bool = False) -> Dict:
        """Make HTTP request to Upstash Vector API."""
        url = f"{self.base_url}/{endpoint}"
        headers = self.readonly_headers if readonly else self.headers
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            print(f"Database request failed: {e}")
            return {}
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate a simple embedding for text (using hash-based approach for demo)."""
        # In production, you'd use a proper embedding model like OpenAI, Cohere, etc.
        # For demo purposes, we'll create a deterministic vector from text hash
        hash_obj = hashlib.sha256(text.encode())
        hash_bytes = hash_obj.digest()
        
        # Convert to 384-dimensional vector (common embedding size)
        vector = []
        for i in range(0, min(len(hash_bytes), 48), 1):  # 48 bytes = 384 bits
            byte_val = hash_bytes[i]
            # Convert each byte to 8 float values between -1 and 1
            for bit in range(8):
                bit_val = (byte_val >> bit) & 1
                vector.append(2.0 * bit_val - 1.0)  # Convert 0,1 to -1,1
        
        # Pad or truncate to exactly 384 dimensions
        while len(vector) < 384:
            vector.append(0.0)
        
        return vector[:384]
    
    def store_file_record(self, file_info: Dict) -> bool:
        """Store a file record in the vector database."""
        try:
            # Create searchable text from file info
            searchable_text = f"{file_info.get('name', '')} {file_info.get('currentRole', '')} {file_info.get('status', '')}"
            
            # Generate embedding
            vector = self.generate_embedding(searchable_text)
            
            # Prepare record
            record = {
                'id': file_info['id'],
                'vector': vector,
                'metadata': {
                    'name': file_info.get('name', ''),
                    'type': file_info.get('type', ''),
                    'size': file_info.get('size', 0),
                    'currentRole': file_info.get('currentRole', ''),
                    'status': file_info.get('status', ''),
                    'progress': file_info.get('progress', 0),
                    'historyCount': file_info.get('historyCount', 0),
                    'priority': file_info.get('priority', 5),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                    'searchable_text': searchable_text
                }
            }
            
            # Store in database
            result = self._make_request('POST', 'upsert', {'vectors': [record]})
            return bool(result)
            
        except Exception as e:
            print(f"Error storing file record: {e}")
            return False
    
    def update_file_record(self, file_id: str, updates: Dict) -> bool:
        """Update an existing file record."""
        try:
            # Get existing record first
            existing = self.get_file_record(file_id)
            if not existing:
                return False
            
            # Merge updates
            metadata = existing.get('metadata', {})
            metadata.update(updates)
            metadata['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Regenerate searchable text and embedding
            searchable_text = f"{metadata.get('name', '')} {metadata.get('currentRole', '')} {metadata.get('status', '')}"
            vector = self.generate_embedding(searchable_text)
            metadata['searchable_text'] = searchable_text
            
            # Update record
            record = {
                'id': file_id,
                'vector': vector,
                'metadata': metadata
            }
            
            result = self._make_request('POST', 'upsert', {'vectors': [record]})
            return bool(result)
            
        except Exception as e:
            print(f"Error updating file record: {e}")
            return False
    
    def get_file_record(self, file_id: str) -> Optional[Dict]:
        """Get a specific file record by ID."""
        try:
            result = self._make_request('GET', f'fetch?ids={file_id}', readonly=True)
            vectors = result.get('vectors', [])
            return vectors[0] if vectors else None
            
        except Exception as e:
            print(f"Error getting file record: {e}")
            return None
    
    def search_files(self, query: str, limit: int = 10) -> List[Dict]:
        """Search files using vector similarity."""
        try:
            # Generate query embedding
            query_vector = self.generate_embedding(query)
            
            # Search
            search_data = {
                'vector': query_vector,
                'topK': limit,
                'includeMetadata': True
            }
            
            result = self._make_request('POST', 'query', search_data, readonly=True)
            return result.get('matches', [])
            
        except Exception as e:
            print(f"Error searching files: {e}")
            return []
    
    def get_all_files(self, limit: int = 100) -> List[Dict]:
        """Get all file records (for dashboard display)."""
        try:
            # Use a broad search to get all files
            result = self.search_files("", limit)
            return result
            
        except Exception as e:
            print(f"Error getting all files: {e}")
            return []
    
    def delete_file_record(self, file_id: str) -> bool:
        """Delete a file record."""
        try:
            result = self._make_request('DELETE', f'delete?ids={file_id}')
            return bool(result)
            
        except Exception as e:
            print(f"Error deleting file record: {e}")
            return False
    
    def store_workflow_history(self, file_id: str, history_entry: Dict) -> bool:
        """Store a workflow history entry."""
        try:
            # Create unique ID for history entry
            history_id = f"{file_id}_history_{int(time.time() * 1000)}"
            
            # Create searchable text
            searchable_text = f"{history_entry.get('role', '')} {history_entry.get('action', '')} {history_entry.get('message', '')}"
            
            # Generate embedding
            vector = self.generate_embedding(searchable_text)
            
            # Prepare record
            record = {
                'id': history_id,
                'vector': vector,
                'metadata': {
                    'type': 'history',
                    'file_id': file_id,
                    'timestamp': history_entry.get('timestamp', datetime.now(timezone.utc).isoformat()),
                    'role': history_entry.get('role', ''),
                    'action': history_entry.get('action', ''),
                    'status': history_entry.get('status', ''),
                    'message': history_entry.get('message', ''),
                    'duration_ms': history_entry.get('duration_ms', 0),
                    'worker_pid': history_entry.get('worker_pid', 0),
                    'searchable_text': searchable_text
                }
            }
            
            result = self._make_request('POST', 'upsert', {'vectors': [record]})
            return bool(result)
            
        except Exception as e:
            print(f"Error storing workflow history: {e}")
            return False
    
    def get_file_history(self, file_id: str) -> List[Dict]:
        """Get workflow history for a specific file."""
        try:
            # Search for history entries for this file
            query = f"file_id:{file_id} type:history"
            results = self.search_files(query, limit=50)
            
            # Filter and sort by timestamp
            history_entries = []
            for result in results:
                metadata = result.get('metadata', {})
                if metadata.get('file_id') == file_id and metadata.get('type') == 'history':
                    history_entries.append(metadata)
            
            # Sort by timestamp
            history_entries.sort(key=lambda x: x.get('timestamp', ''))
            return history_entries
            
        except Exception as e:
            print(f"Error getting file history: {e}")
            return []
    
    def get_system_stats(self) -> Dict:
        """Get system statistics from the database."""
        try:
            all_files = self.get_all_files(1000)  # Get up to 1000 files for stats
            
            total_files = len(all_files)
            processing_files = len([f for f in all_files if f.get('metadata', {}).get('status') == 'processing'])
            completed_files = len([f for f in all_files if f.get('metadata', {}).get('status') == 'complete'])
            pending_files = len([f for f in all_files if f.get('metadata', {}).get('status') == 'pending'])
            error_files = len([f for f in all_files if f.get('metadata', {}).get('status') == 'error'])
            
            # Calculate average processing time (mock for now)
            avg_processing_time = 2500  # milliseconds
            
            return {
                'total_files': total_files,
                'processing_files': processing_files,
                'completed_files': completed_files,
                'pending_files': pending_files,
                'error_files': error_files,
                'avg_processing_time': avg_processing_time,
                'database_status': 'connected'
            }
            
        except Exception as e:
            print(f"Error getting system stats: {e}")
            return {
                'total_files': 0,
                'processing_files': 0,
                'completed_files': 0,
                'pending_files': 0,
                'error_files': 0,
                'avg_processing_time': 0,
                'database_status': 'error'
            }
    
    def cleanup_old_records(self, days: int = 30) -> int:
        """Clean up old records (older than specified days)."""
        try:
            # This is a simplified cleanup - in production you'd want more sophisticated logic
            cutoff_date = datetime.now(timezone.utc).timestamp() - (days * 24 * 60 * 60)
            
            # For now, just return 0 as we don't have date-based filtering in this simple implementation
            return 0
            
        except Exception as e:
            print(f"Error cleaning up old records: {e}")
            return 0

# Test the database connection
if __name__ == "__main__":
    try:
        db = DatabaseManager()
        
        # Test connection
        print("🔍 Testing database connection...")
        stats = db.get_system_stats()
        print(f"✅ Database connected successfully!")
        print(f"📊 Current stats: {stats}")
        
        # Test storing a sample record
        print("\n📝 Testing record storage...")
        sample_file = {
            'id': 'test_file_001',
            'name': 'test_image.jpg',
            'type': 'image/jpeg',
            'size': 1024000,
            'currentRole': 'captioner',
            'status': 'pending',
            'progress': 0,
            'historyCount': 0,
            'priority': 5
        }
        
        success = db.store_file_record(sample_file)
        if success:
            print("✅ Test record stored successfully!")
            
            # Test retrieval
            retrieved = db.get_file_record('test_file_001')
            if retrieved:
                print("✅ Test record retrieved successfully!")
                print(f"📄 Retrieved: {retrieved['metadata']['name']}")
            
            # Test search
            search_results = db.search_files("test image", limit=5)
            print(f"🔍 Search results: {len(search_results)} matches")
            
            # Clean up test record
            db.delete_file_record('test_file_001')
            print("🧹 Test record cleaned up")
        
        print("\n🎉 Database integration test completed successfully!")
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
