import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptedCopper, contrastRatio, evaluateAshAccessibility } from '../../themes/ash/scripts/ash-accessibility.mjs';

test('Copper exceptions stay scoped and retain their measured failure', async () => {
  assert.equal(acceptedCopper('#C4521E', '#302B27', 'accent-text'), true);
  assert.equal(acceptedCopper('#C4521E', '#302B27', 'body-text'), false);
  assert.equal(acceptedCopper('#D97343', '#302B27', 'accent-text'), false);
  assert.equal(acceptedCopper('#C4521E', '#000000', 'accent-text'), false);
  assert.ok(contrastRatio('#C4521E', '#302B27') < 4.5);
  assert.ok(contrastRatio('#FFFFFF', '#C4521E') >= 4.5);

  const node = {
    target: ['a'], html: '<a>Accent</a>', all: [], none: [],
    any: [{ id: 'color-contrast', data: { fgColor: '#c4521e', bgColor: '#302b27', expectedContrastRatio: 4.5 } }],
  };
  const page = { locator: () => ({ evaluate: async () => true }) };
  const assessment = await evaluateAshAccessibility(page, { violations: [
    { id: 'color-contrast', nodes: [node] },
    { id: 'link-name', nodes: [node] },
  ] });
  assert.equal(assessment.exceptions.length, 1);
  assert.equal(assessment.exceptions[0].result, 'FAIL');
  assert.equal(assessment.exceptions[0].disposition, 'ACCEPTED DESIGN EXCEPTION');
  assert.equal(assessment.violations.length, 1);
  assert.equal(assessment.violations[0].id, 'link-name');
});
