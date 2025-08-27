import type { ToolDefinition } from "./configTypes.js";
import {
  executeProcess,
  ProcessState,
  normalizeLineEndings,
} from "./processExecutor.js";
import type { IOutputExtractor, ExtractionResult } from "./outputExtractor.js";
import { OutputExtractor } from "./outputExtractor.js";

export interface ToolResult {
  [key: string]: unknown;
  content: Array<{
    type: "text";
    text: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

export interface ToolOutput {
  output: string;
}

export class ToolExecutor {
  private config: ToolDefinition;
  private cwd: string;
  private outputExtractorFactory: (
    config: ToolDefinition["outputProcessing"],
  ) => IOutputExtractor;

  constructor(
    config: ToolDefinition,
    cwd: string,
    outputExtractorFactory: (
      config: ToolDefinition["outputProcessing"],
    ) => IOutputExtractor = (config) => new OutputExtractor(config),
  ) {
    this.config = config;
    this.cwd = cwd;
    this.outputExtractorFactory = outputExtractorFactory;
  }

  public async execute(
    parameters: Record<string, unknown> = {},
  ): Promise<ToolResult> {
    // Process template variables
    const processedCommand = this.processTemplate(
      this.config.command,
      parameters,
    );
    const processedCwd = this.processTemplate(this.config.cwd, parameters);

    // Execute the command
    const result = await executeProcess(
      processedCommand,
      processedCwd,
      this.config.streamOutput,
      this.config.timeout.inactive,
      this.config.timeout.total,
    );

    if (result.error) {
      const toolOutput: ToolOutput = {
        output: result.error,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(toolOutput, null, 2),
          },
        ],
        isError: true,
      };
    }

    const fullOutput = result.output;
    const isError = result.state !== ProcessState.NORMAL;

    // Handle special cases (like timeout as warning)
    const isSpecialCase = this.handleSpecialCases(result.state);

    // Process output if needed
    if (this.config.outputProcessing.formatOutput) {
      const extractor = this.outputExtractorFactory(
        this.config.outputProcessing,
      );
      const extractedLogs = extractor.extract(fullOutput);
      const toolOutput = this.createFormattedOutput(
        extractedLogs,
        fullOutput,
        isError || isSpecialCase,
        parameters,
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(toolOutput, null, 2),
          },
        ],
        isError: isError && !isSpecialCase, // Don't mark as error if it's a special case
      };
    }

    // Simple output without formatting
    const toolOutput: ToolOutput = {
      output: this.determineSimpleOutput(
        fullOutput,
        isError,
        isSpecialCase,
        result.error,
      ),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(toolOutput, null, 2),
        },
      ],
      isError: isError && !isSpecialCase,
    };
  }

  private processTemplate(
    template: string,
    parameters: Record<string, unknown>,
  ): string {
    let result = template;

    // Replace {{cwd}} with actual working directory
    result = result.replace(/\{\{cwd\}\}/g, this.cwd);

    // Replace parameter placeholders
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, "g"), String(value));
    }

    return result;
  }

  private handleSpecialCases(state: ProcessState): boolean {
    if (!this.config.specialHandling) {
      return false;
    }

    // Handle timeout as warning
    if (
      this.config.specialHandling.timeoutAsWarning &&
      (state === ProcessState.TIMEOUT_INACTIVE ||
        state === ProcessState.TIMEOUT_TOTAL)
    ) {
      return true;
    }

    return false;
  }

  private createFormattedOutput(
    extractedLogs: ExtractionResult,
    fullOutput: string,
    isError: boolean,
    parameters: Record<string, unknown>,
  ): ToolOutput {
    const resultText: string[] = [];

    if (extractedLogs.errors.length > 0) {
      resultText.push("=== ERRORS ===");
      resultText.push(...extractedLogs.errors);
    }

    if (extractedLogs.warnings.length > 0) {
      if (resultText.length > 0) resultText.push("");
      resultText.push("=== WARNINGS ===");
      resultText.push(...extractedLogs.warnings);
    }

    // Handle logLines parameter for tools like launch
    const logLines = this.config.outputProcessing.logLines
      ? parseInt(
          this.processTemplate(
            this.config.outputProcessing.logLines,
            parameters,
          ),
        )
      : undefined;

    if (isError && extractedLogs.errors.length === 0) {
      const outputLines = normalizeLineEndings(fullOutput)
        .split("\n")
        .filter((line) => line.trim() !== "");
      const lastLines = logLines
        ? outputLines.slice(-logLines)
        : outputLines.slice(-10);
      if (resultText.length > 0) resultText.push("");
      resultText.push(...lastLines);
    }

    const outputText = this.determineFormattedOutput(
      extractedLogs,
      isError,
      resultText,
    );

    return {
      output: outputText,
    };
  }

  private determineFormattedOutput(
    extractedLogs: ExtractionResult,
    isError: boolean,
    resultText: string[],
  ): string {
    if (extractedLogs.errors.length > 0 || isError) {
      const errorText =
        resultText.length > 0
          ? resultText.join("\n")
          : "Operation failed with no specific error details";
      return `${this.config.resultFormat.errorMessage}: ${errorText}`;
    }

    if (resultText.length > 0) {
      return `${this.config.resultFormat.successMessage} with WARNING: ${resultText.join("\n")}`;
    }

    return this.config.resultFormat.successMessage;
  }

  private determineSimpleOutput(
    fullOutput: string,
    isError: boolean,
    isSpecialCase: boolean,
    errorMessage?: string,
  ): string {
    let outputText = isError
      ? this.config.resultFormat.errorMessage
      : this.config.resultFormat.successMessage;

    if (isError || isSpecialCase) {
      const outputLines = normalizeLineEndings(fullOutput)
        .split("\n")
        .filter((line) => line.trim() !== "");

      // Handle logLines parameter for tools like launch
      const logLines = this.config.outputProcessing.logLines
        ? parseInt(
            this.processTemplate(this.config.outputProcessing.logLines, {}),
          )
        : undefined;

      const lastLines = logLines
        ? outputLines.slice(-logLines)
        : outputLines.slice(-10);

      if (lastLines.length > 0) {
        outputText += `: ${lastLines.join("\n")}`;
      }
    }

    // Always include error message if present
    if (errorMessage) {
      outputText += `\n\nERROR: ${errorMessage}`;
    }

    return outputText;
  }

  public getParameters(): ToolDefinition["parameters"] {
    return this.config.parameters;
  }

  public getDescription(): string {
    return this.config.description;
  }
}
