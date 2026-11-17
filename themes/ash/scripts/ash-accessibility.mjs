import policy from './contrast-policy.json' with { type: 'json' };

export { policy };
export function acceptedCopper(foreground, background, role) {
  return foreground.toUpperCase() === policy.foreground && policy.backgrounds.includes(background.toUpperCase()) && policy.roles.includes(role);
}

export function contrastRatio(foreground, background) {
  const luminance = hex => hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    .reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
  const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (high + .05) / (low + .05);
}

// Keep axe enabled. Accept only measured Copper contrast failures on listed accent applications.
export async function evaluateAshAccessibility(page, result) {
  const violations = [], exceptions = [];
  for (const violation of result.violations) {
    const remaining = [];
    for (const node of violation.nodes) {
      const checks = [...node.any, ...node.all, ...node.none];
      const data = checks.find(check => check.id === 'color-contrast')?.data;
      const target = node.target.length === 1 && typeof node.target[0] === 'string' ? node.target[0] : null;
      let approved = false;
      if (violation.id === 'color-contrast' && target && data?.fgColor && data?.bgColor) {
        const intended = await page.locator(target).evaluate((element, selector) =>
          element.matches(selector) && getComputedStyle(element).color === 'rgb(196, 82, 30)', policy.selectors);
        approved = intended && acceptedCopper(data.fgColor, data.bgColor, 'accent-text');
      }
      if (approved) {
        exceptions.push({ decision: policy.id, target, foreground: data.fgColor.toUpperCase(), background: data.bgColor.toUpperCase(),
          role: 'standard Copper accent text', ratio: contrastRatio(data.fgColor, data.bgColor),
          threshold: data.expectedContrastRatio, result: 'FAIL', disposition: 'ACCEPTED DESIGN EXCEPTION', html: node.html });
      } else remaining.push(node);
    }
    if (remaining.length) violations.push({ ...violation, nodes: remaining });
  }
  return { violations, exceptions };
}
