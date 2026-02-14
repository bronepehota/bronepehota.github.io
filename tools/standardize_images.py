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


def find_content_bbox(image_path: Path) -> tuple:
    """
    Find bounding box of non-white content in image.
    Returns (left, top, right, bottom) with 5% margin added.
    """
    with Image.open(image_path) as img:
        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if img.mode != "RGB":
            img = img.convert("RGB")

        width, height = img.size

        # Load pixel data
        pixels = img.load()

        # Find content boundaries
        left = width
        top = height
        right = 0
        bottom = 0

        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                # Check if pixel is not white
                if r < WHITE_THRESHOLD or g < WHITE_THRESHOLD or b < WHITE_THRESHOLD:
                    left = min(left, x)
                    top = min(top, y)
                    right = max(right, x)
                    bottom = max(bottom, y)

        # Handle edge case: no content found
        if left >= right or top >= bottom:
            # Return full image
            return (0, 0, width, height)

        # Add 5% margin
        content_width = right - left
        content_height = bottom - top
        margin_x = int(content_width * MARGIN_PERCENT)
        margin_y = int(content_height * MARGIN_PERCENT)

        left = max(0, left - margin_x)
        top = max(0, top - margin_y)
        right = min(width, right + margin_x)
        bottom = min(height, bottom + margin_y)

        return (left, top, right, bottom)


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

    # Test bbox detection on first image
    if images:
        test_img = images[0]
        bbox = find_content_bbox(test_img)
        print(f"\nTest bbox for {test_img.name}: {bbox}")


if __name__ == "__main__":
    main()
