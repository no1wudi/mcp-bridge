import { spawn } from "node-pty";

const ansiRegex = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*[mK]", "g");

export function stripAnsi(str: string): string {
  return str.replace(ansiRegex, "");
}

export function normalizeLineEndings(output: string): string {
  return output.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Command execution states
 */
export enum ProcessState {
  NORMAL = 0,
  FAIL = 1,
  TIMEOUT_TOTAL = 2,
  TIMEOUT_INACTIVE = 3,
}

/**
 * Result interface for command execution
 * @example
 * const result: ProcessResult = {
 *   output: "Build output...",
 *   state: ProcessState.NORMAL,
 *   exitCode: 0
 * };
 */
export interface ProcessResult {
  output: string;
  state: ProcessState;
  error?: string;
}

export interface IProcessExecutor {
  execute(
    command: string,
    cwd: string,
    streamOutput?: boolean,
    inactiveTimeout?: number,
    totalTimeout?: number,
  ): Promise<ProcessResult>;
}

/**
 * Execute a shell command and capture its output
 * @param command - The command to execute (may include parameters)
 * @param cwd - Working directory for command execution
 * @param streamOutput - Whether to stream output to console in real-time (default: true)
 * @param inactiveTimeout - Timeout in seconds without output before killing the command (default: 5)
 * @param totalTimeout - Timeout in seconds for total command execution before killing (default: 300)
 * @returns Promise resolving to command execution result
 * @example
 * const result = await executeProcess('make -j4', '/path/to/project', false);
 * console.log(result.output); // Captured output
 */
export const executeProcess = async (
  command: string,
  cwd: string,
  streamOutput: boolean = true,
  inactiveTimeout: number = 5,
  totalTimeout: number = 300,
): Promise<ProcessResult> => {
  return new Promise((resolve) => {
    const ptyProcess = spawn("bash", ["-c", command], {
      cwd,
      name: "xterm-color",
      env: {
        ...process.env,
      },
    });

    let output = "";
    let inactiveTimeoutId: NodeJS.Timeout;
    let totalTimeoutId: NodeJS.Timeout;

    const resetInactiveTimeout = () => {
      if (inactiveTimeoutId) clearTimeout(inactiveTimeoutId);
      inactiveTimeoutId = setTimeout(() => {
        ptyProcess.kill("SIGKILL");
        resolve({
          output: stripAnsi(output),
          state: ProcessState.TIMEOUT_INACTIVE,
          error: "Command killed due to inactivity timeout",
        });
      }, inactiveTimeout * 1000);
    };

    const startTotalTimeout = () => {
      // Only set total timeout if it's greater than 0
      if (totalTimeout > 0) {
        totalTimeoutId = setTimeout(() => {
          ptyProcess.kill("SIGKILL");
          resolve({
            output: stripAnsi(output),
            state: ProcessState.TIMEOUT_TOTAL,
            error: "Command killed due to total timeout",
          });
        }, totalTimeout * 1000);
      }
    };

    resetInactiveTimeout();
    startTotalTimeout();

    ptyProcess.onData((data) => {
      const text = data.toString();
      output += text;
      if (streamOutput) {
        process.stdout.write(text);
      }
      resetInactiveTimeout();
    });

    ptyProcess.onExit((event) => {
      if (inactiveTimeoutId) clearTimeout(inactiveTimeoutId);
      if (totalTimeoutId) clearTimeout(totalTimeoutId);
      const state =
        event.exitCode === 0 ? ProcessState.NORMAL : ProcessState.FAIL;
      resolve({
        output: stripAnsi(output),
        state,
      });
    });
  });
};

export class ProcessExecutor implements IProcessExecutor {
  async execute(
    command: string,
    cwd: string,
    streamOutput: boolean = true,
    inactiveTimeout: number = 5,
    totalTimeout: number = 300,
  ): Promise<ProcessResult> {
    return executeProcess(
      command,
      cwd,
      streamOutput,
      inactiveTimeout,
      totalTimeout,
    );
  }
}
