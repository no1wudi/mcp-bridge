import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import fs from "fs";
import path from "path";
import { ConfigLoader } from "./configLoader.js";
import { ToolExecutor } from "./toolExecutor.js";

export interface ServerConfig {
  port: number;
  cwd: string;
  verbose?: boolean;
  configPath?: string | undefined;
}

// Tool registration service
export class ToolRegistrar {
  static registerTools(
    server: McpServer,
    configLoader: ConfigLoader,
    cwd: string,
  ) {
    const toolNames = configLoader.getToolNames();

    for (const toolName of toolNames) {
      const toolConfig = configLoader.getToolConfig(toolName);
      const toolExecutor = new ToolExecutor(toolConfig, cwd);

      // Build tool schema - convert to Zod schema format
      const schema: Record<string, unknown> = {};

      if (toolConfig.parameters) {
        for (const param of toolConfig.parameters) {
          const paramSchema: Record<string, unknown> = {};

          switch (param.type) {
            case "number":
              paramSchema.type = "number";
              break;
            case "string":
              paramSchema.type = "string";
              break;
            case "boolean":
              paramSchema.type = "boolean";
              break;
          }

          if (param.default !== undefined) {
            paramSchema.default = param.default;
          }

          schema[param.name] = paramSchema;
        }
      }

      // Register tool using server.tool() method
      server.tool(toolName, toolConfig.description, schema, async (args) => {
        try {
          const result = await toolExecutor.execute(args || {});
          return {
            content: result.content,
            isError: result.isError,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { output: `Error executing ${toolName}: ${error}` },
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }
      });
    }
  }
}

/**
 * Create and configure MCP server with tools from JSON config
 * @param configLoader - Configuration loader instance
 * @param cwd - Working directory for tool execution
 * @returns Configured MCP server instance
 * @example
 * const server = createMcpServer(configLoader, '/path/to/project');
 * await server.connect(transport);
 */
const createMcpServer = (configLoader: ConfigLoader, cwd: string) => {
  const server = new McpServer({
    name: "mcp-bridge-server",
    version: "1.0.0",
  });

  // Register tools from configuration
  ToolRegistrar.registerTools(server, configLoader, cwd);

  return server;
};

/**
 * Start the MCP HTTP server with configuration
 * @param config - Server configuration options
 * @returns Promise that resolves when server is started
 * @example
 * await startServer({ port: 3000, cwd: '/path/to/project' });
 */
export const startServer = async (config: ServerConfig): Promise<void> => {
  // Validate working directory exists
  if (!fs.existsSync(config.cwd)) {
    throw new Error(`Working directory does not exist: ${config.cwd}`);
  }

  // Load configuration
  const configPath = config.configPath || path.join(config.cwd, "tools.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configLoader = new ConfigLoader(configPath);

  // Change working directory if different from current
  if (config.cwd !== process.cwd()) {
    process.chdir(config.cwd);
    if (config.verbose) {
      console.log(`Changed working directory to: ${config.cwd}`);
    }
  }

  if (config.verbose) {
    console.log(`Loaded configuration from: ${configPath}`);
    console.log(`Available tools: ${configLoader.getToolNames().join(", ")}`);
  }

  /**
   * Express application instance for MCP HTTP server
   * Configured with JSON parsing and CORS support
   */
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: "*",
      exposedHeaders: ["Mcp-Session-Id"],
    }),
  );

  if (config.verbose) {
    console.log(`Starting MCP Build Project Server on port ${config.port}`);
    console.log(`Working directory: ${config.cwd}`);
  }

  /**
   * Handle POST requests to MCP endpoint
   * Processes MCP tool calls and returns responses
   * @param req - Express request object
   * @param res - Express response object
   * @example
   * app.post('/mcp', async (req, res) => {
   *   // Process MCP request
   * });
   */
  app.post("/mcp", async (req, res) => {
    const server = createMcpServer(configLoader, config.cwd);

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error: unknown) {
      console.error("Error handling MCP request:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.listen(config.port, (error?: Error) => {
    if (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }

    if (!config.verbose) {
      console.log(`MCP Build Project Server listening on port ${config.port}`);
    }
  });
};
