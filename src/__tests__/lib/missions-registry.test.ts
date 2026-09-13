import {
  getAllMissions,
  getMission,
  getMissionOrThrow,
  getMissionsForCampaign,
  getAllCampaigns,
  getCampaign,
  getObjectiveForFaction,
  isFreePlay,
  isValidMission,
  FREE_PLAY_MISSION_ID,
  missionHasParticipantsForFaction,
  missionHasAnyParticipants,
} from '@/lib/missions-registry';
import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { resolveMissionProvenance } from '@/lib/provenance';

describe('missions-registry', () => {
  describe('getAllMissions', () => {
    it('returns missions sorted ascending by order', () => {
      const all = getAllMissions();
      expect(all.length).toBeGreaterThan(0);
      for (let i = 1; i < all.length; i++) {
        expect(all[i].order).toBeGreaterThanOrEqual(all[i - 1].order);
      }
    });

    it('every mission has required fields and at least one faction objective', () => {
      for (const m of getAllMissions()) {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
        expect(m.campaign).toBeTruthy();
        // turnCount is optional (objective-based missions have no turn limit)
        if (m.parameters.turnCount !== undefined) {
          expect(m.parameters.turnCount).toBeGreaterThan(0);
        }
        expect(Object.keys(m.objectives).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns a new array each call (does not leak the internal sort)', () => {
      const a = getAllMissions();
      const b = getAllMissions();
      expect(a).not.toBe(b);
      // mutating one must not affect the other
      a.reverse();
      expect(a[0].id).not.toBe(b[0].id);
    });
  });

  describe('getMission', () => {
    it('returns a mission by id', () => {
      const first = getAllMissions()[0];
      const result = getMission(first.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(first.id);
    });

    it('returns undefined for an unknown id', () => {
      expect(getMission('nonexistent')).toBeUndefined();
    });
  });

  describe('getMissionOrThrow', () => {
    it('returns a mission by id', () => {
      const first = getAllMissions()[0];
      expect(getMissionOrThrow(first.id).id).toBe(first.id);
    });

    it('throws for an unknown id', () => {
      expect(() => getMissionOrThrow('nonexistent')).toThrow();
    });
  });

  describe('getMissionsForCampaign', () => {
    it('returns only missions in that campaign', () => {
      const first = getAllMissions()[0];
      const inCampaign = getMissionsForCampaign(first.campaign);
      expect(inCampaign.length).toBeGreaterThan(0);
      for (const m of inCampaign) {
        expect(m.campaign).toBe(first.campaign);
      }
    });

    it('returns empty array for unknown campaign', () => {
      expect(getMissionsForCampaign('nope')).toEqual([]);
    });
  });

  describe('getAllCampaigns / getCampaign', () => {
    it('returns all campaigns with id and name', () => {
      const all = getAllCampaigns();
      expect(all.length).toBeGreaterThan(0);
      for (const c of all) {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.intro).toBeTruthy();
      }
    });

    it('getCampaign returns a campaign by id', () => {
      const first = getAllCampaigns()[0];
      expect(getCampaign(first.id)?.id).toBe(first.id);
    });

    it('getCampaign returns undefined for unknown id', () => {
      expect(getCampaign('nonexistent')).toBeUndefined();
    });
  });

  describe('getObjectiveForFaction', () => {
    it('returns the objective for a faction that has one', () => {
      const mission = getAllMissions()[0];
      const faction = Object.keys(mission.objectives)[0];
      const obj = getObjectiveForFaction(mission.id, faction);
      expect(obj).toBeDefined();
      expect(obj!.text).toBeTruthy();
    });

    it('returns undefined for a faction with no objective', () => {
      const mission = getAllMissions()[0];
      expect(getObjectiveForFaction(mission.id, 'mercenaries')).toBeUndefined();
    });

    it('returns undefined for an unknown mission', () => {
      expect(getObjectiveForFaction('nonexistent', 'polaris')).toBeUndefined();
    });
  });

  describe('isFreePlay / isValidMission / FREE_PLAY_MISSION_ID', () => {
    it('free play sentinel is a non-empty string', () => {
      expect(typeof FREE_PLAY_MISSION_ID).toBe('string');
      expect(FREE_PLAY_MISSION_ID.length).toBeGreaterThan(0);
    });

    it('isFreePlay is true for null/undefined/sentinel', () => {
      expect(isFreePlay(null)).toBe(true);
      expect(isFreePlay(undefined)).toBe(true);
      expect(isFreePlay(FREE_PLAY_MISSION_ID)).toBe(true);
    });

    it('isFreePlay is false for a real mission id', () => {
      const first = getAllMissions()[0];
      expect(isFreePlay(first.id)).toBe(false);
    });

    it('isValidMission is true only for real mission ids', () => {
      const first = getAllMissions()[0];
      expect(isValidMission(first.id)).toBe(true);
      expect(isValidMission(FREE_PLAY_MISSION_ID)).toBe(false);
      expect(isValidMission(undefined)).toBe(false);
      expect(isValidMission('nonexistent')).toBe(false);
    });
  });

  describe('missionHasParticipantsForFaction', () => {
    it('returns true for a faction that has participants', () => {
      const m = getMission('osvobozhdenie')!;
      expect(missionHasParticipantsForFaction(m, 'polaris')).toBe(true);
    });

    it('returns false when participants is undefined', () => {
      const m = getMission('osvobozhdenie')!;
      const noForces = { ...m, participants: undefined };
      expect(missionHasParticipantsForFaction(noForces, 'polaris')).toBe(false);
    });

    it('returns false for an empty participants array', () => {
      const m = getMission('osvobozhdenie')!;
      const emptyForces = { ...m, participants: { polaris: [], protectorate: [] } };
      expect(missionHasParticipantsForFaction(emptyForces, 'polaris')).toBe(false);
    });
  });

  describe('missionHasAnyParticipants', () => {
    it('returns true when at least one faction has participants', () => {
      const m = getMission('osvobozhdenie')!;
      expect(missionHasAnyParticipants(m)).toBe(true);
    });

    it('returns false when participants is undefined', () => {
      const m = getMission('osvobozhdenie')!;
      expect(missionHasAnyParticipants({ ...m, participants: undefined })).toBe(false);
    });

    it('returns false when all participant arrays are empty', () => {
      const m = getMission('osvobozhdenie')!;
      expect(missionHasAnyParticipants({ ...m, participants: { polaris: [], protectorate: [] } })).toBe(false);
    });
  });

  describe('classic campaign / zahvat_tochek', () => {
    it('exposes the classic campaign', () => {
      const c = getCampaign('classic');
      expect(c).toBeDefined();
      expect(c!.name).toBe('Классические сценарии');
    });

    it('zahvat_tochek exists in the classic campaign with symmetric objectives', () => {
      const m = getMission('zahvat_tochek');
      expect(m).toBeDefined();
      expect(m!.campaign).toBe('classic');
      expect(m!.parameters.turnCount).toBe(6);
      expect(missionHasAnyParticipants(m!)).toBe(false);
      // symmetric: both sides share the same objective text
      expect(getObjectiveForFaction('zahvat_tochek', 'polaris')!.text)
        .toBe(getObjectiveForFaction('zahvat_tochek', 'protectorate')!.text);
    });

    it('getMissionsForCampaign returns zahvat_tochek for classic', () => {
      const ids = getMissionsForCampaign('classic').map((m) => m.id);
      expect(ids).toContain('zahvat_tochek');
    });
  });

  describe('skrytyj_vrag mission', () => {
    it('exists in the ruthenium campaign as mercenaries vs protectorate', () => {
      const m = getMission('skrytyj_vrag');
      expect(m).toBeDefined();
      expect(m!.campaign).toBe('ruthenium');
      expect(m!.factions).toContain('mercenaries');
      expect(m!.factions).toContain('protectorate');
      expect(m!.objectives.mercenaries).toBeTruthy();
      expect(m!.objectives.protectorate).toBeTruthy();
    });

    it('has the correct participant roster', () => {
      const m = getMission('skrytyj_vrag');
      // mercenaries: Банда Маркуса + Рейдеры + имперские багги (Хантер)
      expect(m!.participants?.mercenaries?.some((u) => u.unitId === 'hunter')).toBe(true);
      // protectorate: only Рутенийская гвардия + рота «Валькирия» (Felicia spetsnaz)
      const prot = m!.participants?.protectorate ?? [];
      expect(prot.length).toBe(2);
      expect(prot.some((u) => u.unitId === 'rutenia_ruteniyskaya_gvardiya')).toBe(true);
      expect(prot.some((u) => u.unitId === 'protectorate_spetsnaz_planety_felitsiya')).toBe(true);
      expect(prot.some((u) => u.unitId === 'salamander')).toBe(false);
      expect(prot.some((u) => u.unitId === 'puma')).toBe(false);
    });

    it('exposes the ruthenium campaign', () => {
      expect(getAllCampaigns().some((c) => c.id === 'ruthenium')).toBe(true);
    });

    it('carries provenance: null — источник сюжета не установлен, строка источника не рендерится', () => {
      // Честность атрибуции: миссия написана in-app по кампании с неустановленным
      // источником — резолвер обязан вернуть null (никакого дефолтного «Технолога»).
      const m = getMission('skrytyj_vrag')!;
      expect(m.provenance).toBeNull();
      expect(resolveMissionProvenance(m)).toBeNull();
    });

    it('cerber-миссии без override остаются на дефолте tehnolog', () => {
      const m = getMission('osvobozhdenie')!;
      expect(m.provenance).toBeUndefined();
      expect(resolveMissionProvenance(m)).toEqual({ origin: 'tehnolog', loreAuthor: 'tehnolog' });
    });
  });

  describe('starsys_events & robogear campaigns', () => {
    const NEW_IDS = [
      'osada_pesok', 'regana',
      'stremitelnaya_ataka', 'zahvat_flaga', 'zapretnaya_zona', 'zvezdnaya_pyl',
    ];

    it('exposes both new scenario sets', () => {
      const events = getCampaign('starsys_events');
      expect(events).toBeDefined();
      expect(events!.name).toBe('События ИС «СтарСис»');

      const robogear = getCampaign('robogear');
      expect(robogear).toBeDefined();
      expect(robogear!.name).toBe('Миссии ИС Robogear');
    });

    it('places the 2 СтарСис events in starsys_events and the 4 Robogear sheets in robogear', () => {
      const events = getMissionsForCampaign('starsys_events').map((m) => m.id);
      expect(events).toEqual(['osada_pesok', 'regana']);

      const robogear = getMissionsForCampaign('robogear').map((m) => m.id);
      expect(robogear).toEqual([
        'stremitelnaya_ataka', 'zahvat_flaga', 'zapretnaya_zona', 'zvezdnaya_pyl',
      ]);
    });

    it('every new mission carries objectives for both of its factions', () => {
      for (const id of NEW_IDS) {
        const m = getMissionOrThrow(id);
        expect(m.factions.length).toBe(2);
        for (const f of m.factions) {
          const obj = m.objectives[f];
          expect(obj).toBeTruthy(); // missing objective for ${id}/${f}
          expect(obj.text).toBeTruthy();
          expect(obj.text.length).toBeGreaterThan(10);
        }
      }
    });

    it('robogear mission participants link only to real encyclopedia machines', () => {
      const robogearIds = getMissionsForCampaign('robogear').map((m) => m.id);
      expect(robogearIds).toEqual(NEW_IDS.slice(2));

      for (const id of robogearIds) {
        const m = getMissionOrThrow(id);
        const rosters = Object.values(m.participants ?? {});
        expect(rosters.length).toBeGreaterThanOrEqual(2);
        for (const roster of rosters) {
          expect(roster.length).toBeGreaterThanOrEqual(3);
          for (const p of roster) {
            if (p.unitId !== undefined) {
              // ${id}: ${p.name} must link to a real encyclopedia machine —
              // live lookup instead of a hardcoded id mirror (covers all factions,
              // zero maintenance when machines.json grows).
              expect(getEncyclopediaUnit(p.unitId)).toBeDefined();
            }
          }
        }
      }

      // Concrete source rosters survived the import
      const flag = getMission('zahvat_flaga')!;
      expect(flag.participants?.polaris?.map((u) => u.unitId)).toContain('locust');
      expect(flag.participants?.polaris?.map((u) => u.unitId)).toContain('raptor');
      expect(flag.participants?.protectorate?.map((u) => u.unitId)).toContain('trex');
      expect(flag.participants?.protectorate?.map((u) => u.unitId)).toContain('salamander');

      const pyl = getMission('zvezdnaya_pyl')!;
      expect(pyl.participants?.polaris?.map((u) => u.unitId)).toEqual(
        expect.arrayContaining(['spider', 'locust', 'helix']),
      );
      expect(pyl.participants?.protectorate?.map((u) => u.unitId)).toEqual(
        expect.arrayContaining(['condor', 'trex', 'salamander']),
      );
    });

    it('keeps global order ascending with the 6 new missions numbered after the old ones', () => {
      const all = getAllMissions();
      const orders = all.map((m) => m.order);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThan(orders[i - 1]);
      }

      const ordersById = Object.fromEntries(all.map((m) => [m.id, m.order]));
      // Previous max (skrytyj_vrag = 8) must stay below every new mission
      const newOrders = NEW_IDS.map((id) => ordersById[id]);
      expect(Math.max(...newOrders)).toBe(Math.max(...orders));
      expect(newOrders).toEqual([...newOrders].sort((a, b) => a - b));
    });
  });
});
