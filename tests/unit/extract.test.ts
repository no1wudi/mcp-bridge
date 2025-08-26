import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { getGccPatterns } from "../../src/patterns.js";

/**
 * Helper function to construct output text from extraction result
 * Used for testing the extraction function output format
 * @param result - Extraction result from extractWarningsAndErrorsForGCC
 * @returns Formatted output text string
 * @example
 * const text = constructOutputText(result);
 * console.log(text); // "Build Pass" or "Build FAIL: ..."
 */
const constructOutputText = (result: {
  warningCount: number;
  errorCount: number;
  warnings: string[];
  errors: string[];
}) => {
  const resultText: string[] = [];

  if (result.errors.length > 0) {
    resultText.push("=== ERRORS ===");
    resultText.push(...result.errors);
  }

  if (result.warnings.length > 0) {
    if (result.errors.length > 0) resultText.push("");
    resultText.push("=== WARNINGS ===");
    resultText.push(...result.warnings);
  }

  return result.errors.length > 0
    ? `Build FAIL: ${resultText.join("\n")}`
    : resultText.length > 0
      ? `Build Pass with WARNING: ${resultText.join("\n")}`
      : "Build Pass";
};

/**
 * Current file path for ES modules
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * Current directory path for ES modules
 * @type {string}
 */
const __dirname = import.meta.dirname || join(__filename, "..");

/**
 * Extract warnings and errors using GCC patterns from ConfigLoader
 * @param log - Raw build log output from GCC compiler
 * @returns Structured result with counts, arrays, and text
 */
const extractWarningsAndErrorsForGCC = (log: string) => {
  const lines = log.split("\n");
  const warnings: string[] = [];
  const errors: string[] = [];

  // Get GCC patterns from patterns module
  const patterns = getGccPatterns();

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Test against error patterns
    for (const errorPattern of patterns.errors) {
      if (new RegExp(errorPattern).test(trimmedLine)) {
        errors.push(trimmedLine);
        break;
      }
    }

    // Test against warning patterns
    for (const warningPattern of patterns.warnings) {
      if (new RegExp(warningPattern).test(trimmedLine)) {
        warnings.push(trimmedLine);
        break;
      }
    }
  }

  return {
    warningCount: warnings.length,
    errorCount: errors.length,
    warnings,
    errors,
  };
};
/**
 * Test the extractWarningsAndErrorsForGCC function with sample logs
 * Runs multiple test cases and outputs results to console
 * @example
 * testExtractFunction();
 * // Output: Test results for pass, warning, error, and complex logs
 */
export const testExtractFunction = () => {
  console.log("Testing extractWarningsAndErrorsForGCC function...\n");

  // Test 1: Pass log
  console.log("=== Test 1: Build Pass ===");
  const passLog = readFileSync(
    join(__dirname, "../fixtures/compile_pass.log"),
    "utf8",
  );
  const passResult = extractWarningsAndErrorsForGCC(passLog);
  console.log("Result:", passResult);
  console.log("Expected: Build Pass");
  const passOutputText = constructOutputText(passResult);
  console.log(
    "Test 1:",
    passOutputText === "Build Pass" &&
      passResult.warningCount === 0 &&
      passResult.errorCount === 0
      ? "✓ PASS"
      : "✗ FAIL",
  );
  console.log("");

  // Test 2: Warning log
  console.log("=== Test 2: Build with Warnings ===");
  const warningLog = readFileSync(
    join(__dirname, "../fixtures/compile_warning.log"),
    "utf8",
  );
  const warningResult = extractWarningsAndErrorsForGCC(warningLog);
  console.log("Result:");
  console.log(warningResult);
  console.log("");
  const warningOutputText = constructOutputText(warningResult);
  const hasWarning =
    warningOutputText.includes("warning:") &&
    warningOutputText.includes("lv_image_set_src") &&
    warningResult.warningCount > 0;
  console.log("Test 2:", hasWarning ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 3: Error log
  console.log("=== Test 3: Build with Errors ===");
  const errorLog = readFileSync(
    join(__dirname, "../fixtures/compile_error.log"),
    "utf8",
  );
  const errorResult = extractWarningsAndErrorsForGCC(errorLog);
  console.log("Result:");
  console.log(errorResult);
  console.log("");
  const errorOutputText = constructOutputText(errorResult);
  const hasError =
    errorOutputText.includes("error:") &&
    errorOutputText.includes("expected ';' before 'lv_image_set_src'") &&
    errorResult.errorCount > 0;
  console.log("Test 3:", hasError ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 4: Complex log (both warning and error)
  console.log("=== Test 4: Complex Build (Warning + Error) ===");
  const complexLog = readFileSync(
    join(__dirname, "../fixtures/compile_complex.log"),
    "utf8",
  );
  const complexResult = extractWarningsAndErrorsForGCC(complexLog);
  console.log("Result:");
  console.log(complexResult);
  console.log("");
  const complexOutputText = constructOutputText(complexResult);
  const hasBoth =
    complexOutputText.includes("warning:") &&
    complexOutputText.includes("error:") &&
    complexOutputText.includes("lv_image_set_src") &&
    complexOutputText.includes("expected ';' before 'return'") &&
    complexResult.warningCount > 0 &&
    complexResult.errorCount > 0;
  console.log("Test 4:", hasBoth ? "✓ PASS" : "✗ FAIL");
  console.log("");
};
