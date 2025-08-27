import { testExtractFunction } from "./unit/extract.test.js";
import { testExecuteCommand } from "./unit/processExecutor.test.js";
import { testStripAnsi } from "./unit/outputExtractor.test.js";
import { testConfigLoader } from "./unit/configLoader.test.js";
import { testDefaults } from "./test_defaults.js";
import { testNormalizeLineEndings } from "./unit/normalizeLineEndings.test.js";

console.log("Running all tests...\n");

// Run extract function tests
await testExtractFunction();

// Run execute command tests
await testExecuteCommand();

// Run stripAnsi tests
testStripAnsi();

// Run normalizeLineEndings tests
testNormalizeLineEndings();

// Run config loader tests
await testConfigLoader();

// Run default values tests
await testDefaults();

console.log("All tests completed!");
