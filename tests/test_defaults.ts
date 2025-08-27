import { ConfigLoader } from "../src/configLoader.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { existsSync, writeFileSync, unlinkSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || join(__filename, "..");
const testDataPath = join(__dirname, "fixtures");

/**
 * Test suite for ConfigLoader default values
 * Tests that default values are applied correctly for minimal configurations
 */
export const testDefaults = async () => {
  console.log("Testing ConfigLoader default values...\n");

  // Check if test data files exist
  if (!existsSync(testDataPath)) {
    throw new Error(`Test data directory not found: ${testDataPath}`);
  }

  let passedTests = 0;
  const totalTests = 4;

  // Test 1: Minimal config with defaults
  console.log("=== Test 1: Minimal config with defaults ===");
  console.log(
    "Description: Should apply default values for minimal configuration",
  );
  try {
    const configPath = join(testDataPath, "minimal_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("simple-tool");

    const success =
      toolConfig.description === "A simple tool" &&
      toolConfig.command === "echo" &&
      toolConfig.cwd === process.cwd() &&
      toolConfig.timeout.total === 30000 &&
      toolConfig.timeout.inactive === 10000 &&
      toolConfig.streamOutput === false &&
      toolConfig.outputProcessing.extractor.type === "gcc" &&
      JSON.stringify(toolConfig.outputProcessing.extractor.patterns) ===
        JSON.stringify({ errors: [], warnings: [] }) &&
      toolConfig.outputProcessing.formatOutput === false &&
      toolConfig.resultFormat.successMessage ===
        "Operation completed successfully" &&
      toolConfig.resultFormat.errorMessage === "Operation failed";

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 2: Partial config with some defaults
  console.log("=== Test 2: Partial config with some defaults ===");
  console.log(
    "Description: Should preserve provided values and apply defaults for missing ones",
  );
  try {
    const partialConfig = {
      tools: {
        "partial-tool": {
          description: "A tool with some config",
          command: "ls",
          timeout: {
            total: 60000,
          },
          resultFormat: {
            successMessage: "Custom success message",
          },
        },
      },
    };

    const tempPath = join(testDataPath, "temp_partial_config.json");
    writeFileSync(tempPath, JSON.stringify(partialConfig, null, 2));

    const loader = new ConfigLoader(tempPath);
    const toolConfig = loader.getToolConfig("partial-tool");

    const success =
      toolConfig.description === "A tool with some config" &&
      toolConfig.command === "ls" &&
      toolConfig.timeout.total === 60000 &&
      toolConfig.timeout.inactive === 10000 && // default applied
      toolConfig.resultFormat.successMessage === "Custom success message" &&
      toolConfig.resultFormat.errorMessage === "Operation failed" && // default applied
      toolConfig.cwd === process.cwd() && // default applied
      toolConfig.streamOutput === false; // default applied

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;

    // Clean up
    unlinkSync(tempPath);
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 3: Full config still works
  console.log("=== Test 3: Full config still works ===");
  console.log("Description: Should still work with full configuration");
  try {
    const configPath = join(testDataPath, "valid_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("compile");

    const success =
      toolConfig.description === "Compile source code" &&
      toolConfig.command === "gcc" &&
      toolConfig.cwd === "/tmp" &&
      toolConfig.timeout.total === 30000 &&
      toolConfig.timeout.inactive === 10000 &&
      toolConfig.streamOutput === true &&
      toolConfig.outputProcessing.extractor.type === "gcc" &&
      JSON.stringify(toolConfig.outputProcessing.extractor.patterns) ===
        JSON.stringify({ errors: ["error:"], warnings: ["warning:"] }) &&
      toolConfig.outputProcessing.formatOutput === true &&
      toolConfig.resultFormat.successMessage === "Compilation successful" &&
      toolConfig.resultFormat.errorMessage === "Compilation failed";

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 4: Config with logLines property
  console.log("=== Test 4: Config with logLines property ===");
  console.log(
    "Description: Should correctly load config with logLines property",
  );
  try {
    const configPath = join(testDataPath, "loglines_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("tool-with-loglines");

    const success =
      toolConfig.description === "A tool with logLines configuration" &&
      toolConfig.command === "echo" &&
      toolConfig.outputProcessing.logLines === "15";

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  console.log(`=== Test Summary ===`);
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  if (passedTests < totalTests) {
    console.log("❌ " + (totalTests - passedTests) + " test(s) failed");
  } else {
    console.log("✅ All tests passed!");
  }
  console.log("");
};

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await testDefaults();
}
