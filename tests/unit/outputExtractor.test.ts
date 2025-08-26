import { stripAnsi } from "../../src/processExecutor.js";

export const testStripAnsi = () => {
  console.log("Testing stripAnsi function...\n");

  // Test 1: Strip ANSI color codes
  console.log("=== Test 1: Strip ANSI color codes ===");
  const input1 =
    "\u001b[0;32mI (1256) s3 ll_cam: node_size: 3168, nodes_per_line: 1, lines_per_node: 9\u001b[0m\r\r\n\u001b[0;32mI (1256) s3 ll_cam: dma_half_buffer_min:  3168, dma_half_buffer: 12672, lines_per_half_buffer: 36, dma_buffer_size: 50688\u001b[0m\r\r\n";
  const expected1 =
    "I (1256) s3 ll_cam: node_size: 3168, nodes_per_line: 1, lines_per_node: 9\r\r\nI (1256) s3 ll_cam: dma_half_buffer_min:  3168, dma_half_buffer: 12672, lines_per_half_buffer: 36, dma_buffer_size: 50688\r\r\n";
  const result1 = stripAnsi(input1);
  console.log("Input:", JSON.stringify(input1));
  console.log("Result:", JSON.stringify(result1));
  console.log("Expected:", JSON.stringify(expected1));
  const success1 = result1 === expected1;
  console.log("Test 1:", success1 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 2: Strip ANSI cursor codes (K codes)
  console.log("=== Test 2: Strip ANSI cursor codes (K codes) ===");
  const input2 =
    "Build FAIL: \u001b[K/home/huang/Work/meow/main/main.c:51:76:\u001b[K \u001b[Kerror: \u001b[Kexpected '\u001b[K;\u001b[K' before '\u001b[Kesp_camera_fb_return\u001b[K'";
  const expected2 =
    "Build FAIL: /home/huang/Work/meow/main/main.c:51:76:  error:  expected ' ; ' before ' esp_camera_fb_return '";
  const result2 = stripAnsi(input2);
  console.log("Input:", JSON.stringify(input2));
  console.log("Result:", JSON.stringify(result2));
  console.log("Expected:", JSON.stringify(expected2));

  // Check that all ANSI codes are removed
  const success2 = !result2.includes("\u001b[");
  console.log("Test 2:", success2 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 3: No ANSI codes
  console.log("=== Test 3: No ANSI codes ===");
  const input3 = "Plain text without ANSI codes";
  const expected3 = "Plain text without ANSI codes";
  const result3 = stripAnsi(input3);
  console.log("Input:", JSON.stringify(input3));
  console.log("Result:", JSON.stringify(result3));
  console.log("Expected:", JSON.stringify(expected3));
  const success3 = result3 === expected3;
  console.log("Test 3:", success3 ? "✓ PASS" : "✗ FAIL");
  console.log("");

  // Test 4: Mixed ANSI codes
  console.log("=== Test 4: Mixed ANSI codes ===");
  const input4 =
    "\u001b[0;32mGreen text\u001b[0m and \u001b[Kcursor codes\u001b[K";
  const expected4 = "Green text and cursor codes";
  const result4 = stripAnsi(input4);
  console.log("Input:", JSON.stringify(input4));
  console.log("Result:", JSON.stringify(result4));
  console.log("Expected:", JSON.stringify(expected4));
  const success4 = result4 === expected4;
  console.log("Test 4:", success4 ? "✓ PASS" : "✗ FAIL");
  console.log("");
};
