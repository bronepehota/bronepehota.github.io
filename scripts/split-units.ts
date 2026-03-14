#!/usr/bin/env tsx
/**
 * Split encyclopedia units.json into faction/type structure
 *
 * Creates:
 * - src/data/encyclopedia/units/polaris/squads.json
 * - src/data/encyclopedia/units/polaris/machines.json
 * - src/data/encyclopedia/units/protectorate/squads.json
 * - src/data/encyclopedia/units/protectorate/machines.json
 * - src/data/encyclopedia/units/mercenaries/squads.json
 * - src/data/encyclopedia/units/mercenaries/machines.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '../src/data/encyclopedia');
const UNITS_FILE = path.join(DATA_DIR, 'units.json');
const OUTPUT_DIR = path.join(DATA_DIR, 'units');

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

/**
 * Read JSON file
 */
function readJson<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
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
  console.log(`  ✓ ${path.relative(DATA_DIR, filePath)}`);
}

/**
 * Main function
 */
function splitUnits(): void {
  console.log('🔪 Splitting encyclopedia units by faction and type...\n');

  // Read all units
  const units = readJson<EncyclopediaUnit[]>(UNITS_FILE);
  if (!units) {
    console.error('❌ Could not read units.json');
    return;
  }

  console.log(`📚 Found ${units.length} units\n`);

  // Group by faction and type
  const groups: Record<string, Record<string, EncyclopediaUnit[]>> = {
    polaris: { squads: [], machines: [] },
    protectorate: { squads: [], machines: [] },
    mercenaries: { squads: [], machines: [] },
  };

  let count = 0;
  for (const unit of units) {
    const faction = unit.faction as keyof typeof groups;
    const type = unit.type === 'squad' ? 'squads' : 'machines';

    if (!groups[faction]) {
      console.warn(`  ⚠️  Unknown faction: ${faction}`);
      continue;
    }

    groups[faction][type].push(unit);
    count++;
  }

  // Write files
  for (const [faction, types] of Object.entries(groups)) {
    console.log(`\n${faction.toUpperCase()}:`);

    for (const [type, units] of Object.entries(types)) {
      const filePath = path.join(OUTPUT_DIR, faction, `${type}.json`);
      writeJson(filePath, units);
      console.log(`    ${units.length} ${type}`);
    }
  }

  console.log(`\n✅ Done! Split ${count} units into 6 files.`);

  // Stats
  console.log('\n📊 Stats:');
  for (const [faction, types] of Object.entries(groups)) {
    const total = types.squads.length + types.machines.length;
    console.log(`  ${faction}: ${total} units (${types.squads.length} squads, ${types.machines.length} machines)`);
  }
}

// Run
splitUnits();
