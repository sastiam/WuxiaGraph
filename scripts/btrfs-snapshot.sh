#!/usr/bin/env bash
set -euo pipefail

# Btrfs CoW Snapshot Helper for OpenSpec Engine v2
ACTION="${1:-create}"
SNAPSHOT_NAME="${2:-pre-execution}"
REPO_DIR="${3:-/home/sastiam/Workspace/WuxiaGraph}"
SNAPSHOT_DIR="/home/sastiam/Workspace/.snapshots/${SNAPSHOT_NAME}"

mkdir -p /home/sastiam/Workspace/.snapshots

case "$ACTION" in
  create)
    rm -rf "$SNAPSHOT_DIR"
    cp --reflink=always -r "$REPO_DIR" "$SNAPSHOT_DIR"
    echo "Btrfs CoW snapshot created at: $SNAPSHOT_DIR"
    ;;
  rollback)
    if [ ! -d "$SNAPSHOT_DIR" ]; then
      echo "Error: Snapshot $SNAPSHOT_DIR does not exist." >&2
      exit 1
    fi
    rsync -a --delete --exclude='.git' "$SNAPSHOT_DIR/" "$REPO_DIR/"
    echo "Rolled back repository to snapshot: $SNAPSHOT_DIR"
    ;;
  clean)
    rm -rf "$SNAPSHOT_DIR"
    echo "Cleaned snapshot: $SNAPSHOT_DIR"
    ;;
  *)
    echo "Usage: $0 {create|rollback|clean} [snapshot-name] [repo-dir]" >&2
    exit 1
    ;;
esac
