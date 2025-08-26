import { ConfigLoader } from "../../src/configLoader.js";
import { ToolExecutor } from "../../src/toolExecutor.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.substring(0, __filename.lastIndexOf("/"));
const testDataPath = join(__dirname, "../fixtures");

/**
 * Test suite for ConfigLoader class
 * Tests both valid configurations and various error conditions
 */
export const testConfigLoader = async () => {
  console.log("Testing ConfigLoader class...\n");

  // Check if test data files exist
  if (!existsSync(testDataPath)) {
    throw new Error(`Test data directory not found: ${testDataPath}`);
  }

  let passedTests = 0;
  const totalTests = 11;

  // Test 1: Valid config loading
  console.log("=== Test 1: Valid config loading ===");
  console.log(
    "Description: Should successfully load and parse a valid configuration file",
  );
  try {
    const configPath = join(testDataPath, "valid_config.json");
    const loader = new ConfigLoader(configPath);
    const toolsConfig = loader.getToolsConfig();
    const toolNames = loader.getToolNames();
    const toolConfig = loader.getToolConfig("compile");

    const success =
      toolsConfig.tools &&
      toolNames.includes("compile") &&
      toolConfig.description === "Compile source code" &&
      toolConfig.command === "gcc" &&
      toolConfig.timeout.total === 30000;

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 2: Invalid config - missing tools object
  console.log("=== Test 2: Invalid config - missing tools object ===");
  console.log(
    "Description: Should throw an error when config is missing the required 'tools' object",
  );
  try {
    const configPath = join(testDataPath, "invalid_missing_tools.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes("Invalid config: 'tools' object is required");
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 3: Invalid tool config - missing description
  console.log("=== Test 3: Invalid tool config - missing description ===");
  console.log(
    "Description: Should throw an error when a tool config is missing the required 'description' field",
  );
  try {
    const configPath = join(testDataPath, "invalid_tool_config.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes(
        "Invalid config for tool 'compile': 'description' is required",
      );
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 4: Invalid parameters - wrong type
  console.log("=== Test 4: Invalid parameters - wrong type ===");
  console.log(
    "Description: Should throw an error when 'parameters' field is not an array",
  );
  try {
    const configPath = join(testDataPath, "invalid_parameters.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes(
        "Invalid config for tool 'compile': 'parameters' must be an array",
      );
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 5: Invalid output processing - wrong extractor type
  console.log(
    "=== Test 5: Invalid output processing - wrong extractor type ===",
  );
  console.log(
    "Description: Should throw an error when extractor type is not 'gcc' or 'custom'",
  );
  try {
    const configPath = join(testDataPath, "invalid_output_processing.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes(
        "Invalid config for tool 'compile': 'outputProcessing.extractor.type' must be 'gcc' or 'custom'",
      );
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 6: Invalid timeout - negative values
  console.log("=== Test 6: Invalid timeout - negative values ===");
  console.log(
    "Description: Should throw an error when timeout values are negative",
  );
  try {
    const configPath = join(testDataPath, "invalid_timeout.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes(
        "Invalid config for tool 'compile': 'timeout.total' must be a non-negative number",
      );
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 7: Valid config with partial result format (defaults applied)
  console.log(
    "=== Test 7: Valid config with partial result format (defaults applied) ===",
  );
  console.log(
    "Description: Should apply default successMessage when resultFormat is missing it",
  );
  try {
    const configPath = join(testDataPath, "invalid_result_format.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("compile");

    const success =
      toolConfig.resultFormat.errorMessage === "Compilation failed" && // provided value
      toolConfig.resultFormat.successMessage ===
        "Operation completed successfully"; // default value

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 8: Non-existent file
  console.log("=== Test 8: Non-existent file ===");
  console.log(
    "Description: Should throw an error when trying to load a non-existent config file",
  );
  try {
    const configPath = join(testDataPath, "non_existent_file.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: string }).code === "ENOENT";
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 9: Invalid JSON
  console.log("=== Test 9: Invalid JSON ===");
  console.log(
    "Description: Should throw a SyntaxError when config file contains invalid JSON",
  );
  try {
    const configPath = join(testDataPath, "invalid_json.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success = error instanceof SyntaxError;
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 10: Get non-existent tool config
  console.log("=== Test 10: Get non-existent tool config ===");
  console.log(
    "Description: Should throw an error when requesting configuration for a non-existent tool",
  );
  try {
    const configPath = join(testDataPath, "valid_config.json");
    const loader = new ConfigLoader(configPath);
    loader.getToolConfig("non_existent_tool");
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success =
      error instanceof Error &&
      error.message.includes(
        "Tool 'non_existent_tool' not found in configuration",
      );
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 11: Broken JSON with trailing content
  console.log("=== Test 11: Broken JSON with trailing content ===");
  console.log(
    "Description: Should throw a SyntaxError when config file contains broken JSON with trailing content",
  );
  try {
    const configPath = join(testDataPath, "broken_json.json");
    new ConfigLoader(configPath);
    console.log("Result: ✗ FAIL - Should have thrown error");
  } catch (error) {
    const success = error instanceof SyntaxError;
    console.log(
      "Result:",
      success ? "✓ PASS" : "✗ FAIL -",
      error instanceof Error ? error.message : error,
    );
    if (success) passedTests++;
  }
  console.log("");

  // Test 12: Test cwd functionality from JSON config - current directory
  console.log(
    "=== Test 12: Test cwd functionality from JSON config - current directory ===",
  );
  console.log(
    "Description: Should execute ls command in current directory using cwd from JSON config",
  );
  try {
    const configPath = join(testDataPath, "cwd_test_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("list_current_dir");
    const executor = new ToolExecutor(toolConfig, __dirname);
    const result = await executor.execute();

    const success =
      result.content[0]?.text?.includes("Directory listing successful") ??
      false;

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 13: Test cwd functionality from JSON config - /tmp directory
  console.log(
    "=== Test 13: Test cwd functionality from JSON config - /tmp directory ===",
  );
  console.log(
    "Description: Should execute ls command in /tmp directory using cwd from JSON config",
  );
  try {
    const configPath = join(testDataPath, "cwd_test_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("list_tmp_dir");
    const executor = new ToolExecutor(toolConfig, __dirname);
    const result = await executor.execute();

    const success =
      result.content[0]?.text?.includes("Directory listing successful") ??
      false;

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test 14: Test cwd template functionality
  console.log("=== Test 14: Test cwd template functionality ===");
  console.log(
    "Description: Should replace {{cwd}} template with actual working directory",
  );
  try {
    const configPath = join(testDataPath, "cwd_test_config.json");
    const loader = new ConfigLoader(configPath);
    const toolConfig = loader.getToolConfig("list_current_dir");
    const executor = new ToolExecutor(toolConfig, __dirname);
    const result = await executor.execute();

    const success =
      result.content[0]?.text?.includes("Directory listing successful") ??
      false;

    console.log("Result:", success ? "✓ PASS" : "✗ FAIL");
    if (success) passedTests++;
  } catch (error) {
    console.log("Result: ✗ FAIL -", error);
  }
  console.log("");

  // Test Summary
  console.log(`=== Test Summary ===`);
  console.log(`Passed: ${passedTests}/${totalTests + 3} tests`);
  if (passedTests === totalTests + 3) {
    console.log("🎉 All tests passed!");
  } else {
    console.log(`❌ ${totalTests + 3 - passedTests} test(s) failed`);
  }
  console.log("");
};
