import { normalizeLineEndings } from "../../src/processExecutor.js";

export const testNormalizeLineEndings = () => {
  console.log("Testing normalizeLineEndings function...\n");

  // Test 1: Unix line endings (\n)
  console.log("=== Test 1: Unix line endings (\\n) ===");
  const input1 = "Line 1\nLine 2\nLine 3";
  const expected1 = "Line 1\nLine 2\nLine 3";
  const result1 = normalizeLineEndings(input1);
  console.log("Input:", JSON.stringify(input1));
  console.log("Result:", JSON.stringify(result1));
  console.log("Expected:", JSON.stringify(expected1));
  const success1 = result1 === expected1;
  console.log("Test 1:", success1 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 2: Windows line endings (\r\n)
  console.log("=== Test 2: Windows line endings (\\r\\n) ===");
  const input2 = "Line 1\r\nLine 2\r\nLine 3";
  const expected2 = "Line 1\nLine 2\nLine 3";
  const result2 = normalizeLineEndings(input2);
  console.log("Input:", JSON.stringify(input2));
  console.log("Result:", JSON.stringify(result2));
  console.log("Expected:", JSON.stringify(expected2));
  const success2 = result2 === expected2;
  console.log("Test 2:", success2 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 3: Old Mac line endings (\r)
  console.log("=== Test 3: Old Mac line endings (\\r) ===");
  const input3 = "Line 1\rLine 2\rLine 3";
  const expected3 = "Line 1\nLine 2\nLine 3";
  const result3 = normalizeLineEndings(input3);
  console.log("Input:", JSON.stringify(input3));
  console.log("Result:", JSON.stringify(result3));
  console.log("Expected:", JSON.stringify(expected3));
  const success3 = result3 === expected3;
  console.log("Test 3:", success3 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 4: Mixed line endings
  console.log("=== Test 4: Mixed line endings ===");
  const input4 = "Line 1\nLine 2\r\nLine 3\rLine 4\nLine 5";
  const expected4 = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
  const result4 = normalizeLineEndings(input4);
  console.log("Input:", JSON.stringify(input4));
  console.log("Result:", JSON.stringify(result4));
  console.log("Expected:", JSON.stringify(expected4));
  const success4 = result4 === expected4;
  console.log("Test 4:", success4 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 5: Empty string
  console.log("=== Test 5: Empty string ===");
  const input5 = "";
  const expected5 = "";
  const result5 = normalizeLineEndings(input5);
  console.log("Input:", JSON.stringify(input5));
  console.log("Result:", JSON.stringify(result5));
  console.log("Expected:", JSON.stringify(expected5));
  const success5 = result5 === expected5;
  console.log("Test 5:", success5 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 6: String with no line endings
  console.log("=== Test 6: String with no line endings ===");
  const input6 = "Single line of text";
  const expected6 = "Single line of text";
  const result6 = normalizeLineEndings(input6);
  console.log("Input:", JSON.stringify(input6));
  console.log("Result:", JSON.stringify(result6));
  console.log("Expected:", JSON.stringify(expected6));
  const success6 = result6 === expected6;
  console.log("Test 6:", success6 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 7: Multiple consecutive line endings
  console.log("=== Test 7: Multiple consecutive line endings ===");
  const input7 = "Line 1\r\r\nLine 2\n\nLine 3\r\r";
  const expected7 = "Line 1\n\nLine 2\n\nLine 3\n\n";
  const result7 = normalizeLineEndings(input7);
  console.log("Input:", JSON.stringify(input7));
  console.log("Result:", JSON.stringify(result7));
  console.log("Expected:", JSON.stringify(expected7));
  const success7 = result7 === expected7;
  console.log("Test 7:", success7 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 8: Line endings at start and end
  console.log("=== Test 8: Line endings at start and end ===");
  const input8 = "\nLine 1\r\nLine 2\r";
  const expected8 = "\nLine 1\nLine 2\n";
  const result8 = normalizeLineEndings(input8);
  console.log("Input:", JSON.stringify(input8));
  console.log("Result:", JSON.stringify(result8));
  console.log("Expected:", JSON.stringify(expected8));
  const success8 = result8 === expected8;
  console.log("Test 8:", success8 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  return {
    success1,
    success2,
    success3,
    success4,
    success5,
    success6,
    success7,
    success8,
  };
};
