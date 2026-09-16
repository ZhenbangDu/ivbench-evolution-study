import { describe, expect, it } from 'vitest';
import source from './Code.gs?raw';

class Sheet {
  rows: unknown[][] = [];
  getLastRow() { return this.rows.length; }
  appendRow(values: unknown[]) { this.rows.push([...values]); }
  getRange(row: number, column: number, height = 1, width = 1) {
    const set = (values: unknown[][]) => {
      values.forEach((line, r) => line.forEach((value, c) => {
        this.rows[row - 1 + r] ??= [];
        this.rows[row - 1 + r][column - 1 + c] = value;
      }));
    };
    return {
      getValues: () => Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? '')),
      getValue: () => this.rows[row - 1]?.[column - 1],
      setValues: set,
      setValue: (value: unknown) => set([[value]]),
    };
  }
}

function receiver() {
  const sheets = new Map<string, Sheet>();
  const spreadsheet = {
    getSheetByName: (name: string) => sheets.get(name),
    insertSheet: (name: string) => { const sheet = new Sheet(); sheets.set(name, sheet); return sheet; },
  };
  const backend = Function('SpreadsheetApp', 'PropertiesService', 'LockService', 'ContentService',
    `${source}\nreturn { doPost, setupSheet };`)(
    { openById: () => spreadsheet },
    { getScriptProperties: () => ({ getProperty: () => 'test-only-sheet' }) },
    { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    { MimeType: { JSON: 'json' }, createTextOutput: (body: string) => ({ setMimeType: () => JSON.parse(body) }) },
  );
  backend.setupSheet();
  const send = (type: string, payload: Record<string, unknown>) => backend.doPost({
    parameter: { payload: JSON.stringify({ type, requestId: payload.requestId ?? `session:${payload.sessionId}`, payload }) },
  });
  return { sheets, send };
}

const session = (version: string) => ({ sessionId: 'same-session-id', participantCode: 'Test', nickname: '', studyVersion: version, status: 'in_progress', startedAt: '2026-09-16T00:00:00Z' });
function response(version: string, number: number) {
  const n = String(number).padStart(3, '0');
  return { sessionId: 'same-session-id', studyVersion: version, requestId: `response:same-session-id:trial_${n}`, trialId: `trial_${n}`, itemId: `sample_${n}`, trialIndex: number - 1, firstPositionVideoCode: `v${n}a`, secondPositionVideoCode: `v${n}b`, informationChoice: `v${n}a`, placementChoice: 'same', overallChoice: `v${n}b`, deviceLayout: 'desktop' };
}

describe('separate study collection', () => {
  it('keeps new sessions and responses out of the original tabs, even with identical IDs', () => {
    const { sheets, send } = receiver();
    expect(send('session', session('act-h3-v1')).ok).toBe(true);
    expect(send('response', response('act-h3-v1', 1)).ok).toBe(true);
    const oldSessions = structuredClone(sheets.get('Sessions')!.rows);
    const oldResponses = structuredClone(sheets.get('Responses')!.rows);
    expect(send('session', session('act-evolution-polished-v1')).ok).toBe(true);
    expect(send('response', response('act-evolution-polished-v1', 1)).ok).toBe(true);
    expect(sheets.get('Evolution_Sessions')?.rows).toHaveLength(2);
    expect(sheets.get('Evolution_Responses')?.rows).toHaveLength(2);
    expect(sheets.get('Sessions')!.rows).toEqual(oldSessions);
    expect(sheets.get('Responses')!.rows).toEqual(oldResponses);
  });

  it('rejects unconfigured study versions before accessing any new tab', () => {
    const { sheets, send } = receiver();
    for (const version of ['unknown-study', '__proto__', 'constructor']) {
      expect(send('session', session(version))).toEqual({ ok: false, error: 'invalid_study_version' });
    }
    expect([...sheets.keys()]).toEqual(['Sessions', 'Responses', 'MethodMap']);
  });

  it('requires all 22 new trials, rejects trial 23, and upserts retries', () => {
    const { sheets, send } = receiver();
    const version = 'act-evolution-polished-v1';
    send('session', session(version));
    for (let i = 1; i <= 21; i++) send('response', response(version, i));
    send('session', { ...session(version), status: 'completed', completionCode: 'TEST' });
    expect(sheets.get('Evolution_Sessions')!.rows[1][7]).toBe('in_progress');
    expect(send('response', response(version, 23)).ok).toBe(false);
    send('response', response(version, 22));
    send('response', { ...response(version, 22), overallChoice: 'same', edited: true });
    send('session', { ...session(version), status: 'completed', completionCode: 'TEST' });
    expect(sheets.get('Evolution_Responses')!.rows).toHaveLength(23);
    expect(sheets.get('Evolution_Responses')!.rows[22][10]).toBe('same');
    expect(sheets.get('Evolution_Sessions')!.rows[1][6]).toBe(22);
    expect(sheets.get('Evolution_Sessions')!.rows[1][7]).toBe('completed');
  });

  it('retains 30-trial completion for the original study', () => {
    const { sheets, send } = receiver();
    send('session', session('act-h3-v1'));
    for (let i = 1; i <= 30; i++) send('response', response('act-h3-v1', i));
    send('session', { ...session('act-h3-v1'), status: 'completed', completionCode: 'TEST' });
    expect(sheets.get('Sessions')!.rows[1][6]).toBe(30);
    expect(sheets.get('Sessions')!.rows[1][7]).toBe('completed');
  });
});
