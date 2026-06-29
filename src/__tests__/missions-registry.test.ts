import {
  getAllMissions,
  getMission,
  getMissionOrThrow,
  getMissionsForCampaign,
  getCampaign,
  isValidMission,
  isFreePlay,
  FREE_PLAY_MISSION_ID,
} from '@/lib/missions-registry';

describe('missions-registry', () => {
  it('getAllMissions returns a non-empty, order-sorted list', () => {
    const missions = getAllMissions();
    expect(missions.length).toBeGreaterThan(0);
    for (let i = 1; i < missions.length; i++) {
      expect(missions[i].order).toBeGreaterThanOrEqual(missions[i - 1].order);
    }
  });

  it('getMission returns the mission for a known id, undefined for missing', () => {
    expect(getMission('osvobozhdenie')?.id).toBe('osvobozhdenie');
    expect(getMission('does-not-exist')).toBeUndefined();
  });

  it('getMissionOrThrow throws for a missing id', () => {
    expect(() => getMissionOrThrow('nope')).toThrow(/Mission not found/);
    expect(getMissionOrThrow('osvobozhdenie').id).toBe('osvobozhdenie');
  });

  it('getMissionsForCampaign returns missions for a known campaign, [] for missing', () => {
    const cerber = getMissionsForCampaign('cerber');
    expect(cerber.length).toBeGreaterThan(0);
    expect(cerber.every((m) => m.campaign === 'cerber')).toBe(true);
    expect(getMissionsForCampaign('no-campaign')).toEqual([]);
  });

  it('getCampaign returns known campaign, undefined for missing', () => {
    expect(getCampaign('cerber')?.id).toBe('cerber');
    expect(getCampaign('nope')).toBeUndefined();
  });

  it('isValidMission / isFreePlay', () => {
    expect(isValidMission('osvobozhdenie')).toBe(true);
    expect(isValidMission('nope')).toBe(false);
    expect(isValidMission(null)).toBe(false);
    expect(isValidMission(FREE_PLAY_MISSION_ID)).toBe(false);

    expect(isFreePlay(FREE_PLAY_MISSION_ID)).toBe(true);
    expect(isFreePlay(null)).toBe(true);
    expect(isFreePlay(undefined)).toBe(true);
    expect(isFreePlay('osvobozhdenie')).toBe(false);
  });
});
