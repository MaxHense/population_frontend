import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// tags can be moved to other code, a full commit SHA cannot
const dir = '.github/workflows';
const actions = readdirSync(dir)
  .filter((f) => f.endsWith('.yml'))
  .flatMap((f) => [...readFileSync(`${dir}/${f}`, 'utf8').matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]));

test('there are actions to check', () => {
  expect(actions.length).toBeGreaterThan(0);
});

test.each(actions)('%s is pinned to a commit SHA', (action) => {
  expect(action).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
});
