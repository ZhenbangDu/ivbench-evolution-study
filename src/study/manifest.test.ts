import { describe, expect, it } from 'vitest';
import { studyManifest, validateManifest } from './manifest';

describe('study manifest', () => {
  it('contains 22 fixed, unique formal trials', () => {
    expect(studyManifest.trials).toHaveLength(22);
    expect(new Set(studyManifest.trials.map((trial) => trial.id)).size).toBe(22);
    expect(validateManifest(studyManifest)).toEqual([]);
  });

  it('contains anonymous candidate codes with neutral formal-study media paths', () => {
    for (const [index, trial] of studyManifest.trials.entries()) {
      const item = String(index + 1).padStart(3, '0');
      expect(trial.first.code).toBe(`v${item}a`);
      expect(trial.second.code).toBe(`v${item}b`);
      expect(trial.first.src).toBe(`media/trial_${item}_a.mp4`);
      expect(trial.second.src).toBe(`media/trial_${item}_b.mp4`);
    }
  });

  it('keeps each per-video reference with its actual candidate', () => {
    const trial = studyManifest.trials.find((item) => item.first.groundTruth);
    expect(trial).toBeDefined();
    const texts = [trial!.first.groundTruth!, trial!.second.groundTruth!].map((gt) => gt.events[0].text);
    expect(texts.sort()).toEqual(['Bounce Into Lunge', 'Standing Side Bend']);
    expect(studyManifest.trials.filter((item) => item.first.groundTruth)).toHaveLength(1);
  });

  it('rejects malformed event timing and regions', () => {
    const broken = structuredClone(studyManifest);
    broken.trials[0].groundTruth.events[0].timeEnd = 9;
    const subjectRegion = broken.trials[0].groundTruth.subjectRegion;
    if (!subjectRegion) throw new Error('Expected the fixture to have a subject region');
    subjectRegion.x = -0.1;

    expect(validateManifest(broken)).toEqual([
      'trial_001: subjectRegion must stay inside the normalized canvas',
      'trial_001: event headline ends after the trial duration',

    ]);
  });
});
