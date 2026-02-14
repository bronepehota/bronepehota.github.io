#!/usr/bin/env python3
"""
Standardize soldier images for Bronepehota wargame app.

Processes all images in public/images/squads/:
- Creates backups in public/images/squads_backup/
- Auto-crops to content with 5% margins
- Resizes to 300x400 px
- Generates HTML report for validation
"""

import os
import shutil
from pathlib import Path
from PIL import Image

# Configuration
TARGET_WIDTH = 300
TARGET_HEIGHT = 400
MARGIN_PERCENT = 0.05
WHITE_THRESHOLD = 250  # Pixels >= this are considered white
BACKGROUND_COLOR = (255, 255, 255)  # White

# Paths (relative to project root)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCE_DIR = PROJECT_ROOT / "public" / "images" / "squads"
BACKUP_DIR = PROJECT_ROOT / "public" / "images" / "squads_backup"
REPORT_PATH = PROJECT_ROOT / "public" / "images" / "standardization_report.html"

# Supported image extensions
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def ensure_backup_dir():
    """Create backup directory if it doesn't exist."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Backup directory: {BACKUP_DIR}")


def get_all_images():
    """Find all image files in source directory recursively."""
    images = []
    for root, dirs, files in os.walk(SOURCE_DIR):
        for filename in files:
            if Path(filename).suffix.lower() in IMAGE_EXTENSIONS:
                images.append(Path(root) / filename)
    return sorted(images)


def create_backup(image_path: Path) -> Path:
    """
    Create backup of original image in squads_backup/.
    Returns path to backup file.
    """
    # Get relative path from SOURCE_DIR
    rel_path = image_path.relative_to(SOURCE_DIR)
    backup_path = BACKUP_DIR / rel_path

    # Skip if backup already exists
    if backup_path.exists():
        return backup_path

    # Create parent directories
    backup_path.parent.mkdir(parents=True, exist_ok=True)

    # Copy file
    shutil.copy2(image_path, backup_path)
    return backup_path


def main():
    print("=" * 60)
    print("Image Standardization Script")
    print("=" * 60)
    print(f"Target size: {TARGET_WIDTH}x{TARGET_HEIGHT} px")
    print(f"Margin: {MARGIN_PERCENT * 100}%")
    print(f"Source: {SOURCE_DIR}")
    print(f"Backup: {BACKUP_DIR}")
    print("=" * 60)

    ensure_backup_dir()
    images = get_all_images()
    print(f"\nFound {len(images)} images to process")

    # Create backups
    print("\nCreating backups...")
    for i, img_path in enumerate(images, 1):
        backup_path = create_backup(img_path)
        if i <= 5 or i == len(images):
            print(f"  [{i}/{len(images)}] {img_path.relative_to(SOURCE_DIR)}")
    print("Backups created successfully!")


if __name__ == "__main__":
    main()
