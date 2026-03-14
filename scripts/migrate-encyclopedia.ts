#!/usr/bin/env tsx
/**
 * Migration script: Extract encyclopedia data from army list sources
 * and create centralized encyclopedia database.
 *
 * This script:
 * 1. Scans all sources in src/data/sources/
 * 2. Extracts unique units by id from squads/machines
 * 3. Merges encyclopedia data (first occurrence wins)
 * 4. Builds sources[] array tracking where each unit appears
 * 5. Extracts factions with sources array
 * 6. Writes src/data/encyclopedia/units.json and factions.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '../src/data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');
const ENCYCLOPEDIA_DIR = path.join(DATA_DIR, 'encyclopedia');

// Type definitions
interface SourceUnit {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  cost: number;
  encyclopedia?: {
    class?: string;
    type?: string;
    lore?: string;
    tactics?: string;
    history?: string;
    manufacturer?: string;
    traditions?: string;
    keyBattles?: Array<{ name: string; year: string; description: string; outcome: string }>;
    locations?: Array<{ name: string; description: string }>;
    sourceUrl?: string;
    monoblock?: string;
    mass?: string;
    crew?: string;
    shortDescription?: string;
    [key: string]: any;
  };
  image?: string;
  rank?: number;
  fire_rate?: number;
  ammo_max?: number;
  durability_max?: number;
  speed_sectors?: Array<{ min_durability: number; max_durability: number; speed: number }>;
  weapons?: Array<{ name: string; range: string; power: string; ammo?: number; special?: string }>;
  soldiers?: Array<{
    rank: number;
    speed: number;
    range: string;
    power: string;
    melee: number;
    props: string[];
    armor: number;
  }>;
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
  encyclopedia?: {
    description?: string;
    lore?: string;
    [key: string]: any;
  };
}

interface EncyclopediaUnit {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  type: 'squad' | 'machine';
  sources: Array<{ id: string; cost: number }>;
  image?: string;
  encyclopedia?: {
    class?: string;
    type?: string;
    lore?: string;
    tactics?: string;
    history?: string;
    manufacturer?: string;
    traditions?: string;
    keyBattles?: Array<{ name: string; year: string; description: string; outcome: string }>;
    locations?: Array<{ name: string; description: string }>;
    sourceUrl?: string;
    monoblock?: string;
    mass?: string;
    crew?: string;
    shortDescription?: string;
    [key: string]: any;
  };
}

interface EncyclopediaFaction {
  id: string;
  name: string;
  color?: string;
  symbol?: string;
  description?: string;
  homeWorld?: string;
  motto?: string;
  icon?: string;
  banner?: string;
  sources: string[];
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
 * Main migration function
 */
function migrate(): void {
  console.log('🔄 Starting encyclopedia data migration...\n');

  // Maps for deduplication
  const unitsMap = new Map<string, EncyclopediaUnit>();
  const factionsMap = new Map<string, EncyclopediaFaction>();

  // Get all source directories
  const sourceDirs = getDirectories(SOURCES_DIR);
  console.log(`📂 Found ${sourceDirs.length} source(s): ${sourceDirs.map(d => path.basename(d)).join(', ')}\n`);

  for (const sourceDir of sourceDirs) {
    const sourceId = path.basename(sourceDir);
    console.log(`\n📖 Processing source: ${sourceId}`);

    // Read factions.json
    const factionsPath = path.join(sourceDir, 'factions.json');
    const factions = readJson<SourceFaction[]>(factionsPath);

    if (factions) {
      console.log(`  └─ Found ${factions.length} factions`);
      for (const faction of factions) {
        const existing = factionsMap.get(faction.id);
        if (existing) {
          // Add source to existing faction
          if (!existing.sources.includes(sourceId)) {
            existing.sources.push(sourceId);
          }
        } else {
          // Create new faction entry
          factionsMap.set(faction.id, {
            id: faction.id,
            name: faction.name || faction.id,
            color: faction.color,
            symbol: faction.symbol,
            description: faction.description || faction.encyclopedia?.description,
            homeWorld: faction.homeWorld,
            motto: faction.motto,
            icon: faction.icon,
            banner: faction.banner,
            sources: [sourceId]
          });
        }
      }
    }

    // Process each faction directory
    for (const faction of factions || []) {
      const factionDir = path.join(sourceDir, faction.id);
      if (!fs.existsSync(factionDir)) continue;

      // Read squads.json
      const squadsPath = path.join(factionDir, 'squads.json');
      const squads = readJson<SourceUnit[]>(squadsPath);

      if (squads) {
        console.log(`  └─ ${faction.id}: ${squads.length} squads`);
        for (const squad of squads) {
          const existing = unitsMap.get(squad.id);
          if (existing) {
            // Add source to existing unit
            existing.sources.push({ id: sourceId, cost: squad.cost });
          } else {
            // Create new unit entry
            unitsMap.set(squad.id, {
              id: squad.id,
              name: squad.name,
              shortName: squad.shortName,
              faction: squad.faction,
              type: 'squad',
              sources: [{ id: sourceId, cost: squad.cost }],
              image: squad.image,
              encyclopedia: squad.encyclopedia
            });
          }
        }
      }

      // Read machines.json
      const machinesPath = path.join(factionDir, 'machines.json');
      const machines = readJson<SourceUnit[]>(machinesPath);

      if (machines) {
        console.log(`  └─ ${faction.id}: ${machines.length} machines`);
        for (const machine of machines) {
          const existing = unitsMap.get(machine.id);
          if (existing) {
            // Add source to existing unit
            existing.sources.push({ id: sourceId, cost: machine.cost });
          } else {
            // Create new unit entry
            unitsMap.set(machine.id, {
              id: machine.id,
              name: machine.name,
              shortName: machine.shortName,
              faction: machine.faction,
              type: 'machine',
              sources: [{ id: sourceId, cost: machine.cost }],
              image: machine.image,
              encyclopedia: machine.encyclopedia
            });
          }
        }
      }
    }
  }

  // Convert maps to arrays and sort
  const units = Array.from(unitsMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const factions = Array.from(factionsMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  // Write output files
  console.log('\n📝 Writing encyclopedia files...');
  writeJson(path.join(ENCYCLOPEDIA_DIR, 'units.json'), units);
  writeJson(path.join(ENCYCLOPEDIA_DIR, 'factions.json'), factions);

  // Print summary
  console.log('\n✅ Migration complete!');
  console.log(`   - ${units.length} unique units`);
  console.log(`   - ${factions.length} factions`);
  console.log(`   - Sources: ${sourceDirs.map(d => path.basename(d)).join(', ')}`);
}

// Run migration
migrate();
