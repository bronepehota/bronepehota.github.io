'use client';

import { useState, useEffect } from 'react';
import { getAllUnits, filterUnits, UnitWithType } from '@/lib/encyclopedia-utils';
import { FactionID } from '@/lib/types';
import { FilterBar } from '@/components/encyclopedia/FilterBar';
import { SearchInput } from '@/components/encyclopedia/SearchInput';
import { UnitGrid } from '@/components/encyclopedia/UnitGrid';

export default function EncyclopediaPage() {
  const [units, setUnits] = useState<UnitWithType[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitWithType[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<FactionID | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'squad' | 'machine'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllUnits().then(data => {
      setUnits(data);
      setFilteredUnits(data);
    });
  }, []);

  useEffect(() => {
    const filtered = filterUnits(units, {
      faction: selectedFaction === 'all' ? undefined : selectedFaction,
      type: selectedType === 'all' ? undefined : selectedType,
      search: searchQuery || undefined,
    });
    setFilteredUnits(filtered);
  }, [units, selectedFaction, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Энциклопедия</h1>

        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <FilterBar
          selectedFaction={selectedFaction}
          selectedType={selectedType}
          onFactionChange={setSelectedFaction}
          onTypeChange={setSelectedType}
        />

        <UnitGrid units={filteredUnits} />
      </div>
    </div>
  );
}
