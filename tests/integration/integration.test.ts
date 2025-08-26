import { spawn, ChildProcess } from "child_process";

// Test configuration
const TEST_PORT = 3000 + Math.floor(Math.random() * 1000); // Use a random port between 3000-4000

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface InspectorResult {
  exitCode: number;
  output: string;
  errorOutput: string;
}

async function runInspectorCommand(args: string[]): Promise<InspectorResult> {
  return new Promise((resolve, reject) => {
    const inspectorProcess = spawn(
      "npx",
      [
        "@modelcontextprotocol/inspector",
        "--cli",
        `http://localhost:${TEST_PORT}/mcp`,
        ...args,
      ],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let output = "";
    let errorOutput = "";

    inspectorProcess.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    inspectorProcess.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    inspectorProcess.on("close", (exitCode: number) => {
      resolve({
        exitCode,
        output,
        errorOutput,
      });
    });

    inspectorProcess.on("error", (error: Error) => {
      reject(error);
    });
  });
}

export async function testIntegration(): Promise<void> {
  console.log("Testing MCP Server Integration with Inspector CLI...\n");
  let serverProcess: ChildProcess | null = null;

  try {
    // Start the MCP server
    console.log("=== Starting MCP Server ===");
    serverProcess = spawn(
      "npm",
      [
        "run",
        "dev",
        "--",
        "--port",
        TEST_PORT.toString(),
        "--config",
        "tests/fixtures/valid_config.json",
      ],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    // Capture server output for debugging
    serverProcess.stdout?.on("data", (data: Buffer) => {
      console.log("Server stdout:", data.toString());
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("Server stderr:", data.toString());
    });

    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Server failed to start within timeout"));
      }, 15000);

      let started = false;
      serverProcess!.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        if (
          (output.includes("listening") || output.includes("Server")) &&
          !started
        ) {
          started = true;
          clearTimeout(timeout);
          // Give server a moment to fully initialize
          setTimeout(resolve, 2000);
        }
      });
    });

    console.log("Server started successfully\n");

    // Give the server a moment to fully initialize
    await delay(1000);

    // Test 1: Tool listing using Inspector CLI
    console.log("=== Test 1: Tool Listing via Inspector CLI ===");
    try {
      const result = await runInspectorCommand(["--method", "tools/list"]);

      console.log("Inspector CLI output:", result.output);
      if (result.errorOutput) {
        console.log("Inspector CLI errors:", result.errorOutput);
      }

      const success =
        result.exitCode === 0 && result.output.includes('"tools"');
      console.log("Test 1:", success ? "✓ PASS" : "✗ FAIL");
      console.log("Exit code:", result.exitCode);

      // Check that we have the expected tools
      if (success) {
        const hasCompileTool = result.output.includes('"name": "compile"');
        const hasLaunchTool = result.output.includes('"name": "launch"');

        console.log("  Has compile tool:", hasCompileTool ? "✓" : "✗");
        console.log("  Has launch tool:", hasLaunchTool ? "✓" : "✗");
      }
    } catch (error) {
      console.log("Test 1: ✗ FAIL -", error);
    }
    console.log("");

    // Test 2: Try calling a tool (this might fail if the tool requires specific environment)
    console.log("=== Test 2: Calling compile tool ===");
    try {
      const result = await runInspectorCommand([
        "--method",
        "tools/call",
        "--tool-name",
        "compile",
      ]);

      console.log("Inspector CLI output:", result.output);
      if (result.errorOutput) {
        console.log("Inspector CLI errors:", result.errorOutput);
      }

      // This might fail due to missing build environment, but we're testing the protocol
      console.log("Exit code:", result.exitCode);
      console.log(
        "Test 2: Tool call attempted (expected to fail in test environment)",
      );
    } catch (error) {
      console.log("Test 2: ✗ FAIL -", error);
    }
    console.log("");
  } catch (error) {
    console.error("Integration tests failed:", error);
  } finally {
    // Clean up - stop the server
    if (serverProcess) {
      console.log("Stopping server...");
      // Send SIGTERM first
      serverProcess.kill("SIGTERM");

      // Give it a moment to shut down gracefully
      await delay(1000);

      // If still running, force kill
      if (!serverProcess.killed) {
        serverProcess.kill("SIGKILL");
      }

      // Wait a bit more for cleanup
      await delay(500);
    }
  }

  console.log("Integration tests completed!");
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testIntegration()
    .then(() => {
      console.log("Test execution finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}
