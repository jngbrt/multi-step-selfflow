import json
import os
import time
from typing import List

class MetadataEmbedder:
    """Embed workflow metadata into a sidecar JSON file.

    This simplified implementation stores metadata alongside the asset
    instead of embedding it into the binary file. The API bridge expects
    the embedder to create a minimal selfflow.v1 structure so subsequent
    worker scripts can update it.
    """

    def _metadata_path(self, path: str) -> str:
        return f"{path}.meta.json"

    def embed_metadata(self, path: str, initial_role: str, priority: int) -> bool:
        """Create initial workflow metadata for a file.

        Args:
            path: File path to associate metadata with.
            initial_role: Starting worker role.
            priority: Processing priority.

        Returns:
            True if metadata was written successfully.
        """
        allowed_roles: List[str]
        if initial_role == "captioner":
            allowed_roles = ["captioner", "translator", "done"]
        else:
            allowed_roles = [initial_role, "done"]

        metadata = {
            "schema": "selfflow.v1",
            "current": {
                "role": initial_role,
                "status": "pending",
                "priority": priority,
                "created_at": time.time(),
                "updated_at": time.time(),
            },
            "config": {
                "allowed_roles": allowed_roles,
                "max_retries": 3,
                "priority": priority,
            },
            "history": [],
            "outputs": {},
        }

        try:
            with open(self._metadata_path(path), "w", encoding="utf-8") as f:
                json.dump(metadata, f)
            return True
        except OSError:
            return False
