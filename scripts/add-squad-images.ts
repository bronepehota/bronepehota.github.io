#!/usr/bin/env tsx
/**
 * Add default images to squads from first soldier
 *
 * This script ensures each squad has an image field by using
 * the first soldier's image as the default.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SOURCES_DIR = path.join(__dirname, '../src/data/sources');

interface Soldier {
  num: number;
  image?: string;
  [key: string]: unknown;
}

interface Squad {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  cost: number;
  soldiers: Soldier[];
  image?: string;
  [key: string]: unknown;
}

/**
 * Add default image to squad if missing
 */
function addDefaultImage(squad: Squad): Squad {
  // If squad already has image, keep it
  if (squad.image) {
    return squad;
  }

  // Use first soldier's image as default
  const firstSoldierWithImage = squad.soldiers.find(s => s.image);
  if (firstSoldierWithImage?.image) {
    return { ...squad, image: firstSoldierWithImage.image };
  }

  return squad;
}

/**
 * Get all directories in a path
 */
function getDirectories(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name));
}

/**
 * Read and parse JSON file
 */
function readJson<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Write JSON file with pretty formatting
 */
function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`✓ Wrote ${filePath}`);
}

/**
 * Main function
 */
function addImages(): void {
  console.log('🖼️  Adding default images to squads...\n');

  let squadsUpdated = 0;

  // Get all source directories
  const sourceDirs = getDirectories(SOURCES_DIR);
  console.log(`📂 Found ${sourceDirs.length} source(s): ${sourceDirs.map(d => path.basename(d)).join(', ')}\n`);

  for (const sourceDir of sourceDirs) {
    const sourceId = path.basename(sourceDir);

    // Read factions.json to get faction list
    const factionsPath = path.join(sourceDir, 'factions.json');
    const factions = readJson<Array<{ id: string }>>(factionsPath);

    if (!factions) continue;

    // Process each faction directory
    for (const faction of factions) {
      const factionDir = path.join(sourceDir, faction.id);
      if (!fs.existsSync(factionDir)) continue;

      // Read squads.json
      const squadsPath = path.join(factionDir, 'squads.json');
      const squads = readJson<Squad[]>(squadsPath);

      if (squads && squads.length > 0) {
        const updatedSquads = squads.map(addDefaultImage);
        writeJson(squadsPath, updatedSquads);
        squadsUpdated += squads.length;
        console.log(`  └─ ${faction.id}: Updated ${squads.length} squads`);
      }
    }
  }

  console.log('\n✅ Done!');
  console.log(`   - ${squadsUpdated} squads processed`);
}

// Run
addImages();
