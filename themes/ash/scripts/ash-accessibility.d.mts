import type { Page } from '@playwright/test';
import type { AxeResults } from 'axe-core';

export const policy: { id: string; foreground: string; backgrounds: string[]; roles: string[]; selectors: string };
export function acceptedCopper(foreground: string, background: string, role: string): boolean;
export function contrastRatio(foreground: string, background: string): number;
export function evaluateAshAccessibility(page: Page, result: AxeResults): Promise<{
  violations: AxeResults['violations'];
  exceptions: Record<string, unknown>[];
}>;
