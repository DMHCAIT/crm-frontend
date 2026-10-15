const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'callSchedule.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, context);
const { dueCalls, nextCallDelay, toLocalCallTime } = context.exports;
const now = Date.parse('2099-01-01T12:00:00Z');
const lead = {
  id: 'lead', fullName: 'Test Lead', scheduledCallAt: '2099-01-01T12:00:00Z',
  updatedAt: '2099-01-01T11:00:00Z'
};

test('call popup becomes due exactly at the saved timestamp, not before', () => {
  assert.equal(dueCalls([lead], now - 1).length, 0);
  assert.equal(nextCallDelay([lead], now - 1), 1);
  assert.equal(dueCalls([lead], now).length, 1);
  assert.equal(dueCalls([lead], now + 86400000).length, 1);
});

test('timers select the earliest future call and support distant schedules safely', () => {
  assert.equal(nextCallDelay([lead], now), null);
  assert.equal(nextCallDelay([
    { ...lead, scheduledCallAt: new Date(now + 5000).toISOString() },
    { ...lead, scheduledCallAt: new Date(now + 2000).toISOString() }
  ], now), 2000);
  assert.equal(nextCallDelay([{ ...lead, scheduledCallAt: '2100-01-01T12:00:00Z' }], now), 2147483647);
});

test('dismissed, updated and cancelled schedules do not show a popup or start a timer', () => {
  for (const changes of [
    { scheduledCallDismissedAt: '2099-01-01T12:01:00Z' },
    { updatedAt: lead.scheduledCallAt },
    { scheduledCallAt: null },
    { scheduledCallAt: 'invalid' }
  ]) {
    assert.equal(dueCalls([{ ...lead, ...changes }], now + 1000).length, 0);
    assert.equal(nextCallDelay([{ ...lead, ...changes }], now - 1000), null);
  }
});

test('local datetime inputs preserve the scheduled instant, including IST', () => {
  process.env.TZ = 'Asia/Kolkata';
  assert.equal(toLocalCallTime(lead.scheduledCallAt), '2099-01-01T17:30');
  assert.equal(new Date(toLocalCallTime(lead.scheduledCallAt)).toISOString(), '2099-01-01T12:00:00.000Z');
  assert.equal(toLocalCallTime(null), '');
});
