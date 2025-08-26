export interface ToolParameter {
  name: string;
  type: "number" | "string" | "boolean";
  default?: number | string | boolean;
  description: string;
}

export interface TimeoutConfig {
  total: number;
  inactive: number;
}

export interface ExtractorPatterns {
  errors: string[];
  warnings: string[];
}

export interface OutputProcessing {
  extractor: {
    type: "gcc" | "custom";
    patterns?: ExtractorPatterns;
  };
  formatOutput: boolean;
  logLines?: string;
}

export interface ResultFormat {
  successMessage: string;
  errorMessage: string;
}

export interface SpecialHandling {
  timeoutAsWarning?: boolean;
}

export interface ToolDefinition {
  description: string;
  command: string;
  cwd: string;
  parameters?: ToolParameter[];
  timeout: TimeoutConfig;
  streamOutput: boolean;
  outputProcessing: OutputProcessing;
  resultFormat: ResultFormat;
  specialHandling?: SpecialHandling;
}

export interface ToolsRegistry {
  tools: Record<string, ToolDefinition>;
}
