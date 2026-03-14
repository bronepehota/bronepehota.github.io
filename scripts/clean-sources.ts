#!/usr/bin/env tsx
/**
 * Clean source files by removing encyclopedia data
 *
 * This script removes encyclopedia fields from source JSON files,
 * keeping only game data needed for army building.
 *
 * Keeps:
 * - id, name, shortName, faction, cost
 * - soldiers[], weapons[], speed_sectors[]
 * - rank, fire_rate, ammo_max, durability_max
 * - image
 *
 * Removes:
 * - encyclopedia object (lore, history, tactics, etc.)
 * - All other lore-related fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '../src/data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');

interface SourceUnit {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  cost: number;
  soldiers?: unknown[];
  weapons?: unknown[];
  speed_sectors?: unknown[];
  rank?: number;
  fire_rate?: number;
  ammo_max?: number;
  durability_max?: number;
  image?: string;
  encyclopedia?: unknown;
  [key: string]: unknown;
}

interface SourceFaction {
  id: string;
  name?: string;
  shortName?: string;
  color?: string;
  symbol?: string;
  description?: string;
  homeWorld?: string;
  motto?: string;
  icon?: string;
  banner?: string;
  encyclopedia?: unknown;
  [key: string]: unknown;
}

/**
 * Clean a unit object, keeping only game data
 */
function cleanUnit(unit: SourceUnit): SourceUnit {
  const cleaned: SourceUnit = {
    id: unit.id,
    name: unit.name,
    shortName: unit.shortName,
    faction: unit.faction,
    cost: unit.cost,
  };

  // Add optional fields if present
  if (unit.image) cleaned.image = unit.image;
  if (unit.soldiers) cleaned.soldiers = unit.soldiers;
  if (unit.weapons) cleaned.weapons = unit.weapons;
  if (unit.speed_sectors) cleaned.speed_sectors = unit.speed_sectors;
  if (unit.rank !== undefined) cleaned.rank = unit.rank;
  if (unit.fire_rate !== undefined) cleaned.fire_rate = unit.fire_rate;
  if (unit.ammo_max !== undefined) cleaned.ammo_max = unit.ammo_max;
  if (unit.durability_max !== undefined) cleaned.durability_max = unit.durability_max;

  return cleaned;
}

/**
 * Clean a faction object, keeping only id
 */
function cleanFaction(faction: SourceFaction): { id: string } {
  return { id: faction.id };
}

/**
 * Recursively get all directories in a path
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
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`✓ Wrote ${filePath}`);
}

/**
 * Main cleanup function
 */
function cleanup(): void {
  console.log('🧹 Starting source files cleanup...\n');

  // Get all source directories
  const sourceDirs = getDirectories(SOURCES_DIR);
  console.log(`📂 Found ${sourceDirs.length} source(s): ${sourceDirs.map(d => path.basename(d)).join(', ')}\n`);

  let totalUnitsCleaned = 0;
  let totalFactionsCleaned = 0;

  for (const sourceDir of sourceDirs) {
    const sourceId = path.basename(sourceDir);
    console.log(`\n📖 Processing source: ${sourceId}`);

    // Read factions.json
    const factionsPath = path.join(sourceDir, 'factions.json');
    const factions = readJson<SourceFaction[]>(factionsPath);

    if (factions) {
      const cleanedFactions = factions.map(cleanFaction);
      writeJson(factionsPath, cleanedFactions);
      totalFactionsCleaned += factions.length;
      console.log(`  └─ Cleaned ${factions.length} factions`);
    }

    // Process each faction directory
    for (const faction of factions || []) {
      const factionDir = path.join(sourceDir, faction.id);
      if (!fs.existsSync(factionDir)) continue;

      // Read squads.json
      const squadsPath = path.join(factionDir, 'squads.json');
      const squads = readJson<SourceUnit[]>(squadsPath);

      if (squads) {
        const cleanedSquads = squads.map(cleanUnit);
        writeJson(squadsPath, cleanedSquads);
        totalUnitsCleaned += squads.length;
        console.log(`  └─ ${faction.id}: Cleaned ${squads.length} squads`);
      }

      // Read machines.json
      const machinesPath = path.join(factionDir, 'machines.json');
      const machines = readJson<SourceUnit[]>(machinesPath);

      if (machines) {
        const cleanedMachines = machines.map(cleanUnit);
        writeJson(machinesPath, cleanedMachines);
        totalUnitsCleaned += machines.length;
        console.log(`  └─ ${faction.id}: Cleaned ${machines.length} machines`);
      }
    }
  }

  // Print summary
  console.log('\n✅ Cleanup complete!');
  console.log(`   - ${totalUnitsCleaned} units cleaned`);
  console.log(`   - ${totalFactionsCleaned} factions cleaned`);
  console.log(`   - Sources: ${sourceDirs.map(d => path.basename(d)).join(', ')}`);
  console.log('\n⚠️  IMPORTANT: Run migration script first to preserve encyclopedia data!');
  console.log('   npm run migrate-encyclopedia');
}

// Run cleanup
cleanup();
