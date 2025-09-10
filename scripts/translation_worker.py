import argparse
import json
import time

from metadata_reader import MetadataReader


def main() -> int:
    parser = argparse.ArgumentParser(description="Dummy translation worker")
    parser.add_argument("--file", required=True, help="Path to file")
    args = parser.parse_args()

    reader = MetadataReader()
    meta = reader.extract_workflow_metadata(args.file)
    if not meta or meta.get("current", {}).get("role") != "translator":
        return 1

    caption = meta.get("outputs", {}).get("caption", "")
    translation = f"{caption} (translated)"

    history_entry = {
        "role": "translator",
        "status": "complete",
        "message": "Translated caption",
        "updated_at": time.time(),
    }

    meta["outputs"]["translation"] = translation
    meta["history"].append(history_entry)
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
