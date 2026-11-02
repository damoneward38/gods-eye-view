import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTrafficAfterStatus } from './trafficActivation.js';

test('traffic activation waits for the provider probe before installing render hooks', async () => {
  const calls = [];
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const activation = activateTrafficAfterStatus({
    waitForStatus: () => pending,
    isCurrent: () => true,
    isAvailable: () => true,
    onUnavailable: () => calls.push('unavailable'),
    onReady: () => calls.push('ready'),
  });
  assert.deepEqual(calls, []);
  release();
  assert.equal(await activation, true);
  assert.deepEqual(calls, ['ready']);
});

test('keyless traffic completes lifecycle without installing render hooks', async () => {
  const calls = [];
  const result = await activateTrafficAfterStatus({
    waitForStatus: async () => {},
    isCurrent: () => true,
    isAvailable: () => false,
    onUnavailable: () => calls.push('unavailable'),
    onReady: () => calls.push('ready'),
  });
  assert.equal(result, true);
  assert.deepEqual(calls, ['unavailable']);
});

test('a superseded enable cannot resurrect render hooks after disable or re-enable', async () => {
  const calls = [];
  let currentGeneration = 1;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const activation = activateTrafficAfterStatus({
    waitForStatus: () => pending,
    isCurrent: () => currentGeneration === 1,
    isAvailable: () => true,
    onUnavailable: () => calls.push('unavailable'),
    onReady: () => calls.push('ready'),
  });
  currentGeneration = 2;
  release();
  assert.equal(await activation, false);
  assert.deepEqual(calls, []);
});

test('an abort during the provider probe leaves the layer inactive', async () => {
  const calls = [];
  let aborted = false;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const activation = activateTrafficAfterStatus({
    waitForStatus: () => pending,
    isCurrent: () => !aborted,
    isAvailable: () => true,
    onUnavailable: () => calls.push('unavailable'),
    onReady: () => calls.push('ready'),
  });
  aborted = true;
  release();
  assert.equal(await activation, false);
  assert.deepEqual(calls, []);
});
