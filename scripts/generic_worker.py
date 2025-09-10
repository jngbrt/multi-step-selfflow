import argparse
import json
import time

from metadata_reader import MetadataReader


def main() -> int:
    parser = argparse.ArgumentParser(description="Generic worker placeholder")
    parser.add_argument("--file", required=True, help="Path to file")
    parser.add_argument("--role", help="Optional role override")
    args = parser.parse_args()

    reader = MetadataReader()
    meta = reader.extract_workflow_metadata(args.file)
    if not meta:
        return 1

    role = args.role or meta.get("current", {}).get("role")
    if meta.get("current", {}).get("role") != role:
        return 1

    history_entry = {
        "role": role,
        "status": "complete",
        "message": f"Processed by {role}",
        "updated_at": time.time(),
    }

    meta["history"].append(history_entry)
    meta["outputs"][role] = "done"
    meta["current"] = {
        "role": "done",
        "status": "complete",
        "updated_at": time.time(),
    }

    meta_path = f"{args.file}.meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
