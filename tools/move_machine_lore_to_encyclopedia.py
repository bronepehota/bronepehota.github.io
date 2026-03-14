#!/usr/bin/env python3
"""
Move lore fields from army list machine root to encyclopedia object.

After this, army list will only contain game data (cost, rank, weapons, etc).
All lore fields (class, type, mass, crew, etc.) will be in encyclopedia.
"""

import json
from pathlib import Path

# Fields to move into encyclopedia
FIELDS_TO_ENCYCLOPEDIA = {
    'class': 'class',
    'type': 'type',
    'developer': 'manufacturer',  # Renamed to match encyclopedia schema
    'monoblock': 'monoblock',
    'mass': 'mass',
    'crew': 'crew',
    'description': 'shortDescription',  # Renamed to avoid conflict
    'sourceUrl': 'sourceUrl',  # Keep existing encyclopedia sourceUrl if present
}

# Weapon fields to remove (belong in separate weapon encyclopedia)
WEAPON_LORE_FIELDS = {
    'description',
    'manufacturer',
}

def move_to_encyclopedia(machine: dict) -> dict:
    """Move lore fields from root to encyclopedia object."""
    result = {}
    encyclopedia_updates = {}

    # First pass: collect fields to move and copy non-lore fields
    for key, value in machine.items():
        if key in FIELDS_TO_ENCYCLOPEDIA:
            # Field should be in encyclopedia
            new_key = FIELDS_TO_ENCYCLOPEDIA[key]
            encyclopedia_updates[new_key] = value
        elif key == 'weapons' and isinstance(value, list):
            # Clean weapons
            result[key] = [clean_weapon(w) for w in value]
        elif key == 'encyclopedia' and isinstance(value, dict):
            # Keep existing encyclopedia, will merge updates
            result[key] = value.copy()
        else:
            # Keep other fields (game data)
            result[key] = value

    # Merge encyclopedia updates into result
    if 'encyclopedia' not in result:
        result['encyclopedia'] = {}

    # Apply updates (don't overwrite existing encyclopedia fields)
    for key, value in encyclopedia_updates.items():
        if key not in result['encyclopedia']:
            result['encyclopedia'][key] = value

    return result

def clean_weapon(weapon: dict) -> dict:
    """Remove lore fields from weapon."""
    return {
        k: v for k, v in weapon.items()
        if k not in WEAPON_LORE_FIELDS
    }

def process_file(filepath: Path) -> None:
    """Process a machines.json file."""
    print(f"Processing {filepath}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            machines = json.load(f)
        except json.JSONDecodeError:
            print(f"  Warning: Empty or invalid JSON, skipping")
            return

    if not machines:
        print(f"  No machines to process")
        return

    # Show what will be moved
    first_machine = machines[0]
    fields_to_move = set(first_machine.keys()) & FIELDS_TO_ENCYCLOPEDIA.keys()
    if fields_to_move:
        print(f"  Moving to encyclopedia: {', '.join(sorted(fields_to_move))}")

    # Process all machines
    cleaned_machines = [move_to_encyclopedia(m) for m in machines]

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(cleaned_machines, f, ensure_ascii=False, indent=2)

    print(f"  Processed {len(cleaned_machines)} machines")

def main():
    """Find and process all machines.json files."""
    project_root = Path(__file__).parent.parent
    sources_dir = project_root / 'src' / 'data' / 'sources'

    machines_files = list(sources_dir.glob('**/machines.json'))

    if not machines_files:
        print("No machines.json files found")
        return

    print(f"Found {len(machines_files)} machines.json files\n")

    for filepath in machines_files:
        process_file(filepath)

    print("\n✅ Done! Lore fields moved to encyclopedia.")

if __name__ == '__main__':
    main()
