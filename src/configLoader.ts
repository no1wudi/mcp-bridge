import fs from "fs";
import type {
  ToolsRegistry,
  ToolDefinition,
  ToolParameter,
  OutputProcessing,
} from "./configTypes.js";
import { getGccPatterns } from "./patterns.js";

// Default configuration values
const DEFAULTS = {
  cwd: process.cwd(),
  timeout: {
    total: 30000,
    inactive: 10000,
  },
  streamOutput: false,
  outputProcessing: {
    extractor: {
      type: "gcc" as const,
      patterns: { errors: [], warnings: [] },
    },
    formatOutput: false,
  },
  resultFormat: {
    successMessage: "Operation completed successfully",
    errorMessage: "Operation failed",
  },
};

// Configuration validation service
export class ConfigValidator {
  static validatePartialConfig(config: ToolsRegistry): void {
    if (!config.tools || typeof config.tools !== "object") {
      throw new Error("Invalid config: 'tools' object is required");
    }

    for (const [toolName, toolConfig] of Object.entries(config.tools)) {
      // Only validate essential fields
      if (
        !toolConfig.description ||
        typeof toolConfig.description !== "string"
      ) {
        throw new Error(
          `Invalid config for tool '${toolName}': 'description' is required and must be a string`,
        );
      }

      if (!toolConfig.command || typeof toolConfig.command !== "string") {
        throw new Error(
          `Invalid config for tool '${toolName}': 'command' is required and must be a string`,
        );
      }
    }
  }

  static validateConfig(config: ToolsRegistry): void {
    if (!config.tools || typeof config.tools !== "object") {
      throw new Error("Invalid config: 'tools' object is required");
    }

    for (const [toolName, toolConfig] of Object.entries(config.tools)) {
      this.validateToolConfig(toolName, toolConfig);
    }
  }

  private static validateToolConfig(
    toolName: string,
    config: ToolDefinition,
  ): void {
    if (!config.description || typeof config.description !== "string") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'description' is required and must be a string`,
      );
    }

    if (!config.command || typeof config.command !== "string") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'command' is required and must be a string`,
      );
    }

    if (!config.cwd || typeof config.cwd !== "string") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'cwd' is required and must be a string`,
      );
    }

    if (!config.timeout || typeof config.timeout !== "object") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'timeout' object is required`,
      );
    }

    if (typeof config.timeout.total !== "number" || config.timeout.total < 0) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'timeout.total' must be a non-negative number`,
      );
    }

    if (
      typeof config.timeout.inactive !== "number" ||
      config.timeout.inactive < 0
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'timeout.inactive' must be a non-negative number`,
      );
    }

    if (typeof config.streamOutput !== "boolean") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'streamOutput' must be a boolean`,
      );
    }

    if (
      !config.outputProcessing ||
      typeof config.outputProcessing !== "object"
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing' object is required`,
      );
    }

    this.validateOutputProcessing(toolName, config.outputProcessing);

    if (!config.resultFormat || typeof config.resultFormat !== "object") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'resultFormat' object is required`,
      );
    }

    if (
      !config.resultFormat.successMessage ||
      typeof config.resultFormat.successMessage !== "string"
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'resultFormat.successMessage' is required and must be a string`,
      );
    }

    if (
      !config.resultFormat.errorMessage ||
      typeof config.resultFormat.errorMessage !== "string"
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'resultFormat.errorMessage' is required and must be a string`,
      );
    }

    if (config.parameters) {
      if (!Array.isArray(config.parameters)) {
        throw new Error(
          `Invalid config for tool '${toolName}': 'parameters' must be an array`,
        );
      }

      for (const param of config.parameters) {
        this.validateParameter(toolName, param);
      }
    }
  }

  private static validateOutputProcessing(
    toolName: string,
    outputProcessing: unknown,
  ): void {
    const processing = outputProcessing as OutputProcessing;
    if (!processing.extractor || typeof processing.extractor !== "object") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing.extractor' object is required`,
      );
    }

    if (
      processing.extractor.type !== "gcc" &&
      processing.extractor.type !== "custom"
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing.extractor.type' must be 'gcc' or 'custom'`,
      );
    }

    // Patterns are required for custom type, optional for known types like gcc
    if (
      processing.extractor.type === "custom" &&
      (!processing.extractor.patterns ||
        typeof processing.extractor.patterns !== "object")
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing.extractor.patterns' object is required for custom type`,
      );
    }

    // Validate patterns structure if provided
    if (processing.extractor.patterns) {
      if (!Array.isArray(processing.extractor.patterns.errors)) {
        throw new Error(
          `Invalid config for tool '${toolName}': 'outputProcessing.extractor.patterns.errors' must be an array`,
        );
      }

      if (!Array.isArray(processing.extractor.patterns.warnings)) {
        throw new Error(
          `Invalid config for tool '${toolName}': 'outputProcessing.extractor.patterns.warnings' must be an array`,
        );
      }
    } else if (processing.extractor.type === "custom") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing.extractor.patterns' object is required for custom type`,
      );
    }

    if (typeof processing.formatOutput !== "boolean") {
      throw new Error(
        `Invalid config for tool '${toolName}': 'outputProcessing.formatOutput' must be a boolean`,
      );
    }
  }

  private static validateParameter(
    toolName: string,
    param: ToolParameter,
  ): void {
    if (!param.name || typeof param.name !== "string") {
      throw new Error(
        `Invalid config for tool '${toolName}': parameter 'name' is required and must be a string`,
      );
    }

    if (
      param.type !== "number" &&
      param.type !== "string" &&
      param.type !== "boolean"
    ) {
      throw new Error(
        `Invalid config for tool '${toolName}': parameter 'type' must be 'number', 'string', or 'boolean'`,
      );
    }

    if (param.default !== undefined) {
      if (typeof param.default !== param.type) {
        throw new Error(
          `Invalid config for tool '${toolName}': parameter 'default' must be of type '${param.type}'`,
        );
      }
    }

    if (!param.description || typeof param.description !== "string") {
      throw new Error(
        `Invalid config for tool '${toolName}': parameter 'description' is required and must be a string`,
      );
    }
  }
}

// Configuration defaults applier service
export class ConfigDefaultsApplier {
  static applyDefaults(config: ToolsRegistry): void {
    for (const toolConfig of Object.values(config.tools)) {
      // Apply defaults for missing required fields
      if (!toolConfig.cwd) {
        toolConfig.cwd = DEFAULTS.cwd;
      }

      if (!toolConfig.timeout) {
        toolConfig.timeout = { ...DEFAULTS.timeout };
      } else {
        // Apply partial timeout defaults
        if (toolConfig.timeout.total === undefined) {
          toolConfig.timeout.total = DEFAULTS.timeout.total;
        }
        if (toolConfig.timeout.inactive === undefined) {
          toolConfig.timeout.inactive = DEFAULTS.timeout.inactive;
        }
      }

      if (toolConfig.streamOutput === undefined) {
        toolConfig.streamOutput = DEFAULTS.streamOutput;
      }

      if (!toolConfig.outputProcessing) {
        toolConfig.outputProcessing = { ...DEFAULTS.outputProcessing };
      } else {
        // Apply partial outputProcessing defaults
        if (!toolConfig.outputProcessing.extractor) {
          toolConfig.outputProcessing.extractor = {
            ...DEFAULTS.outputProcessing.extractor,
          };
        } else {
          if (!toolConfig.outputProcessing.extractor.type) {
            toolConfig.outputProcessing.extractor.type =
              DEFAULTS.outputProcessing.extractor.type;
          }
          if (!toolConfig.outputProcessing.extractor.patterns) {
            toolConfig.outputProcessing.extractor.patterns = {
              ...DEFAULTS.outputProcessing.extractor.patterns,
            };
          }
        }
        if (toolConfig.outputProcessing.formatOutput === undefined) {
          toolConfig.outputProcessing.formatOutput =
            DEFAULTS.outputProcessing.formatOutput;
        }
      }

      if (!toolConfig.resultFormat) {
        toolConfig.resultFormat = { ...DEFAULTS.resultFormat };
      } else {
        // Apply partial resultFormat defaults
        if (!toolConfig.resultFormat.successMessage) {
          toolConfig.resultFormat.successMessage =
            DEFAULTS.resultFormat.successMessage;
        }
        if (!toolConfig.resultFormat.errorMessage) {
          toolConfig.resultFormat.errorMessage =
            DEFAULTS.resultFormat.errorMessage;
        }
      }
    }
  }

  static applyDefaultPatterns(config: ToolsRegistry): void {
    for (const toolConfig of Object.values(config.tools)) {
      const { extractor } = toolConfig.outputProcessing;

      if (extractor.type === "gcc" && !extractor.patterns) {
        extractor.patterns = getGccPatterns();
      } else if (extractor.type === "custom" && !extractor.patterns) {
        extractor.patterns = { errors: [], warnings: [] };
      }
    }
  }
}

// Main configuration loader
export class ConfigLoader {
  private config: ToolsRegistry;

  constructor(configPath: string) {
    const configData = fs.readFileSync(configPath, "utf-8");
    this.config = JSON.parse(configData) as ToolsRegistry;

    // Validate, apply defaults, and validate again
    ConfigValidator.validatePartialConfig(this.config);
    ConfigDefaultsApplier.applyDefaults(this.config);
    ConfigValidator.validateConfig(this.config);
    ConfigDefaultsApplier.applyDefaultPatterns(this.config);
  }

  public getToolsConfig(): ToolsRegistry {
    return this.config;
  }

  public getToolConfig(toolName: string): ToolDefinition {
    const toolConfig = this.config.tools[toolName];
    if (!toolConfig) {
      throw new Error(`Tool '${toolName}' not found in configuration`);
    }
    return toolConfig;
  }

  public getToolNames(): string[] {
    return Object.keys(this.config.tools);
  }
}
