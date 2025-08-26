import type { ExtractorPatterns } from "./configTypes.js";

/**
 * Predefined patterns for GCC compiler output extraction
 */
export const gccPatterns: ExtractorPatterns = {
  errors: ["^[^:]+:\\d+:\\d+:\\s+error:"],
  warnings: ["^[^:]+:\\d+:\\d+:\\s+warning:"],
};

/**
 * Get GCC patterns for error and warning extraction
 * @returns GCC patterns object with error and warning regex patterns
 */
export function getGccPatterns(): ExtractorPatterns {
  return gccPatterns;
}
