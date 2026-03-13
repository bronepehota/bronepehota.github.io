#!/usr/bin/env python3
"""
Remove duplicate lore fields from army list machines.json files.

Moves lore fields from army list to encyclopedia object.
Lore fields should only exist in encyclopedia data.
Army list should only contain game data.
"""

import json
from pathlib import Path

# Fields to move from army list to encyclopedia
LORE_FIELDS_TO_ENCYCLOPEDIA = {
    'class',
    'type',
    'developer',  # Will be renamed to 'manufacturer' in encyclopedia
    'monoblock',
    'mass',
    'crew',
    'description',  # Will be renamed to 'shortDescription' in encyclopedia
    'sourceUrl',  # Keep sourceUrl if encyclopedia doesn't have one
}

# Weapon fields to remove (weapon descriptions belong in encyclopedia)
WEAPON_LORE_FIELDS = {
    'description',
    'manufacturer',
}

def clean_machine(machine: dict) -> dict:
    """Remove lore fields from a single machine entry."""
    cleaned = {}

    # Copy non-lore fields
    for key, value in machine.items():
        if key not in LORE_FIELDS:
            if key == 'weapons' and isinstance(value, list):
                # Clean weapons too
                cleaned[key] = [clean_weapon(w) for w in value]
            elif key == 'encyclopedia':
                # Keep encyclopedia as-is
                cleaned[key] = value
            else:
                cleaned[key] = value

    return cleaned

def clean_weapon(weapon: dict) -> dict:
    """Remove lore fields from a single weapon entry."""
    return {
        k: v for k, v in weapon.items()
        if k not in WEAPON_LORE_FIELDS
    }

def clean_file(filepath: Path) -> None:
    """Clean a machines.json file."""
    print(f"Processing {filepath}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        machines = json.load(f)

    original_count = len(machines)
    cleaned_machines = [clean_machine(m) for m in machines]

    # Show what was removed
    if machines:
        first_original = machines[0]
        first_cleaned = cleaned_machines[0]
        removed_fields = set(first_original.keys()) - set(first_cleaned.keys())
        if removed_fields:
            print(f"  Removing fields: {', '.join(sorted(removed_fields))}")

        # Check weapon fields
        if first_original.get('weapons'):
            first_weapon = first_original['weapons'][0]
            first_weapon_cleaned = first_cleaned['weapons'][0]
            weapon_removed = set(first_weapon.keys()) - set(first_weapon_cleaned.keys())
            if weapon_removed:
                print(f"  Removing weapon fields: {', '.join(sorted(weapon_removed))}")

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(cleaned_machines, f, ensure_ascii=False, indent=2)

    print(f"  Cleaned {original_count} machines")

def main():
    """Find and clean all machines.json files in army lists."""
    project_root = Path(__file__).parent.parent
    sources_dir = project_root / 'src' / 'data' / 'sources'

    # Find machines.json in any subdirectory
    machines_files = list(sources_dir.glob('**/machines.json'))

    if not machines_files:
        print("No machines.json files found")
        return

    print(f"Found {len(machines_files)} machines.json files\n")

    for filepath in machines_files:
        clean_file(filepath)

    print("\n✅ Done! All machines.json files cleaned.")

if __name__ == '__main__':
    main()
