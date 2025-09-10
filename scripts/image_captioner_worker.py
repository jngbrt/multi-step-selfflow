import argparse
import json
import os
import time

from metadata_reader import MetadataReader


def main() -> int:
    parser = argparse.ArgumentParser(description="Dummy image captioner worker")
    parser.add_argument("--file", required=True, help="Path to file")
    args = parser.parse_args()

    reader = MetadataReader()
    meta = reader.extract_workflow_metadata(args.file)
    if not meta or meta.get("current", {}).get("role") != "captioner":
        return 1

    caption = f"Caption for {os.path.basename(args.file)}"

    history_entry = {
        "role": "captioner",
        "status": "complete",
        "message": "Generated caption",
        "updated_at": time.time(),
    }

    meta["outputs"]["caption"] = caption
    meta["history"].append(history_entry)
    meta["current"] = {
        "role": "translator",
        "status": "pending",
        "updated_at": time.time(),
    }

    meta_path = f"{args.file}.meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
