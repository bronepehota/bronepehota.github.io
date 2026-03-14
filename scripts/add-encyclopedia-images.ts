#!/usr/bin/env tsx
/**
 * Add images to encyclopedia units from source files
 *
 * This script adds the `image` field to encyclopedia units by copying
 * the image from the corresponding source file (squad/machine).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '../src/data');
const ENCYCLOPEDIA_FILE = path.join(DATA_DIR, 'encyclopedia/units.json');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');

interface EncyclopediaUnit {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  type: 'squad' | 'machine';
  sources: Array<{ id: string; cost: number }>;
  image?: string;
  encyclopedia?: {
    [key: string]: any;
  };
}

interface SourceUnit {
  id: string;
  image?: string;
  soldiers?: Array<{ image?: string }>;
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
 * Find image for a unit from source files
 */
function findImageForUnit(unitId: string, unitType: 'squad' | 'machine'): string | undefined {
  // Search all source directories
  const sourceDirs = getDirectories(SOURCES_DIR);

  for (const sourceDir of sourceDirs) {
    const factionsPath = path.join(sourceDir, 'factions.json');
    const factions = readJson<Array<{ id: string }>>(factionsPath);

    if (!factions) continue;

    for (const faction of factions) {
      const factionDir = path.join(sourceDir, faction.id);

      if (unitType === 'squad') {
        const squadsPath = path.join(factionDir, 'squads.json');
        const squads = readJson<SourceUnit[]>(squadsPath);

        if (squads) {
          const squad = squads.find(s => s.id === unitId);
          if (squad) {
            // Use squad image if available
            if (squad.image) return squad.image;
            // Otherwise use first soldier's image
            if (squad.soldiers && squad.soldiers.length > 0) {
              const firstWithImage = squad.soldiers.find(s => s.image);
              if (firstWithImage?.image) return firstWithImage.image;
            }
          }
        }
      } else {
        const machinesPath = path.join(factionDir, 'machines.json');
        const machines = readJson<SourceUnit[]>(machinesPath);

        if (machines) {
          const machine = machines.find(m => m.id === unitId);
          if (machine?.image) return machine.image;
        }
      }
    }
  }

  return undefined;
}

/**
 * Main function
 */
function addImages(): void {
  console.log('🖼️  Adding images to encyclopedia units...\n');

  // Read encyclopedia units
  const units = readJson<EncyclopediaUnit[]>(ENCYCLOPEDIA_FILE);
  if (!units) {
    console.error('❌ Could not read encyclopedia units file');
    return;
  }

  console.log(`📚 Found ${units.length} units in encyclopedia\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  // Add images to units that don't have them
  const updatedUnits = units.map(unit => {
    // Skip if already has image
    if (unit.image) {
      skippedCount++;
      return unit;
    }

    const image = findImageForUnit(unit.id, unit.type);
    if (image) {
      updatedCount++;
      console.log(`  ✓ ${unit.id}: ${image}`);
      return { ...unit, image };
    }

    return unit;
  });

  // Write back to encyclopedia file
  writeJson(ENCYCLOPEDIA_FILE, updatedUnits);

  console.log(`\n✅ Done!`);
  console.log(`   - ${updatedCount} units updated`);
  console.log(`   - ${skippedCount} units already had images`);
  console.log(`   - ${units.length - updatedCount - skippedCount} units without images`);
}

// Run
addImages();
