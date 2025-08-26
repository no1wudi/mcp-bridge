import { executeProcess, ProcessState } from "../../src/processExecutor.js";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || join(__filename, "..");

export const testExecuteCommand = async () => {
  console.log("Testing executeProcess function...\n");

  // Test 1: Successful command with streaming
  console.log("=== Test 1: Successful command with streaming ===");
  try {
    const result1 = await executeProcess('echo "Hello World"', __dirname, true);
    console.log("Result:", result1);
    const success1 =
      result1.state === ProcessState.NORMAL &&
      result1.output.includes("Hello World");
    console.log("Test 1:", success1 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 1: ✗ FAIL -", error);
  }
  console.log("");

  // Test 2: Successful command without streaming
  console.log("=== Test 2: Successful command without streaming ===");
  try {
    const result2 = await executeProcess('echo "No Stream"', __dirname, false);
    console.log("Result:", result2);
    const success2 =
      result2.state === ProcessState.NORMAL &&
      result2.output.includes("No Stream");
    console.log("Test 2:", success2 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 2: ✗ FAIL -", error);
  }
  console.log("");

  // Test 3: Command that produces stderr
  console.log("=== Test 3: Command with stderr output ===");
  try {
    const result3 = await executeProcess(
      'echo "Error message" >&2',
      __dirname,
      false,
    );
    console.log("Result:", result3);
    const success3 =
      result3.state === ProcessState.NORMAL &&
      result3.output.includes("Error message");
    console.log("Test 3:", success3 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 3: ✗ FAIL -", error);
  }
  console.log("");

  // Test 4: Non-existent command (should handle error)
  console.log("=== Test 4: Non-existent command ===");
  try {
    const result4 = await executeProcess(
      "nonexistent_command_12345",
      __dirname,
      false,
    );
    console.log("Result:", result4);
    const success4 =
      result4.state === ProcessState.FAIL &&
      result4.output.includes("command not found");
    console.log("Test 4:", success4 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 4: ✗ FAIL -", error);
  }
  console.log("");

  // Test 5: Command with non-zero exit code
  console.log("=== Test 5: Command with non-zero exit code ===");
  try {
    const result5 = await executeProcess("exit 1", __dirname, false);
    console.log("Result:", result5);
    const success5 = result5.state === ProcessState.FAIL;
    console.log("Test 5:", success5 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 5: ✗ FAIL -", error);
  }
  console.log("");

  // Test 6: List test_data directory
  console.log("=== Test 6: List test_data directory ===");
  try {
    const testDataPath = join(__dirname, "test_data");
    const result6 = await executeProcess("ls", testDataPath, false);
    console.log("Result:", result6);
    const success6 =
      result6.state === ProcessState.NORMAL &&
      result6.output.includes("compile_pass.log") &&
      result6.output.includes("compile_warning.log") &&
      result6.output.includes("compile_error.log") &&
      result6.output.includes("compile_complex.log");
    console.log("Test 6:", success6 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 6: ✗ FAIL -", error);
  }
  console.log("");

  // Test 7: Command with inactive timeout
  console.log("=== Test 7: Command with inactive timeout ===");
  try {
    const result7 = await executeProcess("sleep 10", __dirname, false, 2);
    console.log("Result:", result7);
    const success7 =
      result7.state === ProcessState.TIMEOUT_INACTIVE &&
      result7.error === "Command killed due to inactivity timeout";
    console.log("Test 7:", success7 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 7: ✗ FAIL -", error);
  }
  console.log("");

  // Test 8: Command that produces output regularly (should not timeout)
  console.log("=== Test 8: Command with regular output (no timeout) ===");
  try {
    const result8 = await executeProcess(
      'for i in {1..5}; do echo "Output $i"; sleep 1; done',
      __dirname,
      false,
      2,
    );
    console.log("Result:", result8);
    const success8 =
      result8.state === ProcessState.NORMAL &&
      result8.output.includes("Output 5");
    console.log("Test 8:", success8 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 8: ✗ FAIL -", error);
  }
  console.log("");

  // Test 9: Test cwd functionality with ls command
  console.log("=== Test 9: Test cwd functionality with ls command ===");
  try {
    const result9 = await executeProcess("ls", "/tmp", false);
    console.log("Result:", result9);
    const success9 =
      result9.state === ProcessState.NORMAL && result9.output.length > 0;
    console.log("Test 9:", success9 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 9: ✗ FAIL -", error);
  }
  console.log("");

  // Test 10: Test cwd functionality with ls command in current directory
  console.log(
    "=== Test 10: Test cwd functionality with ls command in current directory ===",
  );
  try {
    const result10 = await executeProcess("ls", __dirname, false);
    console.log("Result:", result10);
    const success10 =
      result10.state === ProcessState.NORMAL &&
      result10.output.includes("processExecutor.test.ts");
    console.log("Test 10:", success10 ? "✓ PASS" : "✗ FAIL");
  } catch (error) {
    console.log("Test 10: ✗ FAIL -", error);
  }
  console.log("");
};
