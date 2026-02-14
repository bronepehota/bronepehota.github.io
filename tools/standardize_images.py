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


def process_image(image_path: Path) -> dict:
    """
    Process a single image: crop, resize, and save.
    Returns dict with processing info for report.
    """
    result = {
        "path": str(image_path.relative_to(SOURCE_DIR)),
        "original_size": None,
        "new_size": (TARGET_WIDTH, TARGET_HEIGHT),
        "status": "OK",
        "error": None,
    }

    try:
        with Image.open(image_path) as img:
            result["original_size"] = img.size

            # Convert to RGB if necessary
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Find content bounding box
            bbox = find_content_bbox(image_path)
            left, top, right, bottom = bbox

            # Crop to content
            cropped = img.crop((left, top, right, bottom))

            # Calculate scaling to fit in 300x400 while preserving aspect ratio
            crop_width, crop_height = cropped.size
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT
            crop_ratio = crop_width / crop_height

            if crop_ratio > target_ratio:
                # Image is wider than target - fit to width
                new_width = TARGET_WIDTH
                new_height = int(TARGET_WIDTH / crop_ratio)
            else:
                # Image is taller than target - fit to height
                new_height = TARGET_HEIGHT
                new_width = int(TARGET_HEIGHT * crop_ratio)

            # Resize
            resized = cropped.resize((new_width, new_height), Image.LANCZOS)

            # Create white canvas and center the image
            canvas = Image.new("RGB", (TARGET_WIDTH, TARGET_HEIGHT), BACKGROUND_COLOR)
            offset_x = (TARGET_WIDTH - new_width) // 2
            offset_y = (TARGET_HEIGHT - new_height) // 2
            canvas.paste(resized, (offset_x, offset_y))

            # Save as PNG
            canvas.save(image_path, "PNG", optimize=True)

    except Exception as e:
        result["status"] = "ERROR"
        result["error"] = str(e)

    return result


def generate_html_report(results: list):
    """Generate HTML report with before/after comparison."""

    # Calculate statistics
    total = len(results)
    success = sum(1 for r in results if r["status"] == "OK")
    errors = total - success

    # Build HTML
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Standardization Report</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e293b; color: #e2e8f0; padding: 20px; }}
        h1 {{ margin-bottom: 20px; color: #f8fafc; }}
        .stats {{ background: #334155; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 30px; }}
        .stat {{ }}
        .stat-value {{ font-size: 24px; font-weight: bold; color: #22c55e; }}
        .stat-value.error {{ color: #ef4444; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }}
        .card {{ background: #334155; border-radius: 8px; padding: 12px; }}
        .card.error {{ border: 2px solid #ef4444; }}
        .card-header {{ font-size: 12px; color: #94a3b8; margin-bottom: 8px; word-break: break-all; }}
        .images {{ display: flex; gap: 8px; margin-bottom: 8px; }}
        .image-container {{ flex: 1; }}
        .image-label {{ font-size: 10px; color: #64748b; margin-bottom: 4px; }}
        .image-container img {{ width: 100%; height: auto; border-radius: 4px; background: #fff; }}
        .meta {{ font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }}
        .status {{ font-weight: bold; }}
        .status.ok {{ color: #22c55e; }}
        .status.error {{ color: #ef4444; }}
    </style>
</head>
<body>
    <h1>Image Standardization Report</h1>
    <div class="stats">
        <div class="stat">
            <div class="stat-value">{total}</div>
            <div>Total Images</div>
        </div>
        <div class="stat">
            <div class="stat-value">{success}</div>
            <div>Processed</div>
        </div>
        <div class="stat">
            <div class="stat-value error">{errors}</div>
            <div>Errors</div>
        </div>
    </div>
    <div class="grid">
"""

    for result in results:
        status_class = "ok" if result["status"] == "OK" else "error"
        card_class = "" if result["status"] == "OK" else "error"

        # Get backup path for "before" image
        rel_path = result["path"]
        backup_path = f"squads_backup/{rel_path}"
        processed_path = f"squads/{rel_path}"

        orig_size = result["original_size"]
        orig_size_str = f"{orig_size[0]}x{orig_size[1]}" if orig_size else "N/A"

        html += f"""
        <div class="card {card_class}">
            <div class="card-header">{rel_path}</div>
            <div class="images">
                <div class="image-container">
                    <div class="image-label">Before ({orig_size_str})</div>
                    <img src="{backup_path}" alt="Before">
                </div>
                <div class="image-container">
                    <div class="image-label">After (300x400)</div>
                    <img src="{processed_path}" alt="After">
                </div>
            </div>
            <div class="meta">
                <span class="status {status_class}">{result["status"]}</span>
                {f'<span>{result["error"]}</span>' if result.get("error") else ''}
            </div>
        </div>
"""

    html += """
    </div>
</body>
</html>
"""

    # Write report
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nReport saved to: {REPORT_PATH}")


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

    # TEST: Process only first 3 images
    images = images[:3]

    # Process all images
    print("\nProcessing images...")
    results = []
    for i, img_path in enumerate(images, 1):
        result = process_image(img_path)
        results.append(result)
        status_icon = "✓" if result["status"] == "OK" else "✗"
        print(f"  [{i}/{len(images)}] {status_icon} {result['path']}")

    # Summary
    success_count = sum(1 for r in results if r["status"] == "OK")
    print(f"\nCompleted: {success_count}/{len(images)} images processed successfully")

    # Generate report
    print("\nGenerating HTML report...")
    generate_html_report(results)


if __name__ == "__main__":
    main()
