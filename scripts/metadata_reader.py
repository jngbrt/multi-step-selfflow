import json
import os
from typing import Any, Dict, Optional

class MetadataReader:
    """Read workflow metadata from a sidecar JSON file."""

    def _metadata_path(self, path: str) -> str:
        return f"{path}.meta.json"

    def extract_workflow_metadata(self, path: str) -> Optional[Dict[str, Any]]:
        """Return workflow metadata for a file if present."""
        meta_path = self._metadata_path(path)
        if not os.path.exists(meta_path):
            return None
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            return None
