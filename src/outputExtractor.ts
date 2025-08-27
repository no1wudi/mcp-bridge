import type { ToolDefinition } from "./configTypes.js";
import { normalizeLineEndings } from "./processExecutor.js";

export interface ExtractionResult {
  errors: string[];
  warnings: string[];
}

export interface IOutputExtractor {
  extract(output: string): ExtractionResult;
}

export class OutputExtractor implements IOutputExtractor {
  private config: ToolDefinition["outputProcessing"];

  constructor(config: ToolDefinition["outputProcessing"]) {
    this.config = config;
  }

  public extract(output: string): ExtractionResult {
    const lines = normalizeLineEndings(output).split("\n");
    const result: ExtractionResult = {
      errors: [],
      warnings: [],
    };

    const patterns = this.config.extractor.patterns!;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for errors
      for (const pattern of patterns.errors) {
        if (this.matchesPattern(trimmedLine, pattern)) {
          result.errors.push(trimmedLine);
          break;
        }
      }

      // Check for warnings
      for (const pattern of patterns.warnings) {
        if (this.matchesPattern(trimmedLine, pattern)) {
          result.warnings.push(trimmedLine);
          break;
        }
      }
    }

    return result;
  }

  private matchesPattern(line: string, pattern: string): boolean {
    const regex = new RegExp(pattern);
    return regex.test(line);
  }
}
