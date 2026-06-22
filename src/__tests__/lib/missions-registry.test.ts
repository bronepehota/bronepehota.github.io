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
});
