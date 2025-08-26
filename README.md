# MCP Bridge

A Model Context Protocol (MCP) server that bridges command-line tools with AI assistants. This server exposes configurable build and development tools as MCP tools that can be called by AI agents.

## Features

- **Minimal Configuration**: Only `description` and `command` required - all other options have sensible defaults
- **Configurable Tools**: Define custom tools via JSON configuration
- **Command Execution**: Run shell commands with timeout handling
- **Output Processing**: Parse and format command output with extractors
- **Stream Output**: Real-time output streaming for long-running processes
- **Error Handling**: Comprehensive error handling and reporting
- **Backward Compatibility**: Existing full configurations continue to work unchanged

## Installation

```bash
npm install -g mcp-bridge
```

Or for development:

```bash
git clone <repository>
cd mcp-bridge
npm install
npm run build
```

## Usage

### Starting the Server

```bash
# Start with default configuration
mcp-bridge

# Start with custom port
mcp-bridge --port 8080

# Start with verbose logging
mcp-bridge --verbose

# Start with custom working directory
mcp-bridge --cwd /path/to/project

# Start with custom config file
mcp-bridge --config /path/to/config.json
```

### Configuration

Create a `tools.json` file in your project directory to define available tools. Most configuration options are optional and will use sensible defaults if not provided.

#### Minimal Configuration

Only `description` and `command` are required:

```json
{
  "tools": {
    "echo": {
      "description": "Echo input text",
      "command": "echo"
    }
  }
}
```

#### Complete Configuration

```json
{
  "tools": {
    "compile": {
      "description": "Compile source code",
      "command": "gcc",
      "cwd": "{{cwd}}",
      "timeout": {
        "total": 30,
        "inactive": 10
      },
      "streamOutput": true,
      "outputProcessing": {
        "extractor": {
          "type": "gcc",
          "patterns": {
            "errors": ["error:"],
            "warnings": ["warning:"]
          }
        },
        "formatOutput": true
      },
      "resultFormat": {
        "successMessage": "Compilation successful",
        "errorMessage": "Compilation failed"
      },
      "parameters": [
        {
          "name": "source",
          "type": "string",
          "description": "Source file to compile"
        },
        {
          "name": "optimization",
          "type": "number",
          "default": 2,
          "description": "Optimization level"
        }
      ]
    }
  }
}
```

### Tool Configuration Schema

Each tool definition supports the following properties. **Only `description` and `command` are required** - all other options have sensible defaults:

#### Required Fields
- `description`: Tool description for the MCP server
- `command`: Shell command to execute

#### Optional Fields with Defaults
- `cwd`: Working directory (default: current working directory, supports `{{cwd}}` template variable)
- `parameters`: Array of parameter definitions (default: none)
- `timeout`: Timeout configuration (default: `{ total: 30, inactive: 10 }` seconds)
  - `total`: Total timeout in seconds (default: 30)
  - `inactive`: Inactivity timeout in seconds (default: 10)
- `streamOutput`: Whether to stream output in real-time (default: `false`)
- `outputProcessing`: Output processing configuration (default: gcc extractor with no patterns, formatOutput: false)
  - `extractor`: Output extractor type and patterns (default: `{ type: "gcc", patterns: { errors: [], warnings: [] } }`)
  - `formatOutput`: Whether to format the output (default: `false`)
  - `logLines`: Number of log lines to return on timeout or error (default: 10, can be overridden)
- `resultFormat`: Success and error messages (default: generic success/error messages)
  - `successMessage`: Success message (default: "Operation completed successfully")
  - `errorMessage`: Error message (default: "Operation failed")
- `specialHandling`: Special handling options (e.g., `timeoutAsWarning`) (default: none)

#### Partial Configuration Example

```json
{
  "tools": {
    "custom-build": {
      "description": "Custom build tool",
      "command": "make",
      "timeout": {
        "total": 60  // Only override total timeout, use default for inactive
      },
      "outputProcessing": {
        "logLines": "20"  // Return last 20 lines of output on timeout or error
      },
      "resultFormat": {
        "successMessage": "Build completed successfully"  // Custom success, default error
      }
    }
  }
}
```

### Parameter Definition

Parameters can be defined with the following properties:

```json
{
  "parameters": [
    {
      "name": "logLines",
      "type": "number",
      "default": 15,
      "description": "Number of log lines to return on failure"
    }
  ]
}
```

### Configuration Benefits

The new optional configuration system provides several benefits:

#### 1. **Quick Start**
Get running immediately with minimal configuration:

```json
{
  "tools": {
    "build": {
      "description": "Build the project",
      "command": "make"
    }
  }
}
```

#### 2. **Gradual Customization**
Start simple and add configuration as needed:

```json
{
  "tools": {
    "build": {
      "description": "Build the project",
      "command": "make",
      // Add timeout later
      "timeout": {
        "total": 60
      },
      // Add custom success message
      "resultFormat": {
        "successMessage": "Build completed successfully!"
      }
    }
  }
}
```

#### 3. **Sensible Defaults**
The system provides intelligent defaults for common use cases:
- **Timeout**: 30 seconds total, 10 seconds inactive
- **Working Directory**: Current directory where the server is running
- **Output Processing**: GCC-compatible error/warning extraction
- **Streaming**: Disabled by default for simpler tools
- **Messages**: Generic success/failure messages

#### 4. **Backward Compatibility**
Existing configurations continue to work without any changes, making upgrades seamless.

## Development

### Prerequisites

- Node.js 18+
- TypeScript

### Setup

```bash
npm install
```

### Available Scripts

```bash
# Start the server in development mode
npm run dev

# Run all tests
npm test

# Run integration tests
npm run test:integration

# Build the project
npm run build

# Lint the code
npm run lint

# Format the code
npm run format
```

### Testing

The project includes comprehensive tests:

- Unit tests for individual components
- Integration tests with MCP Inspector CLI
- Configuration validation tests
- Error handling tests

Run tests with:

```bash
# All tests
npm test

# Specific test file
tsx tests/test_configLoader.ts

# Integration tests
npm run test:integration
```

## API

### HTTP Endpoint

The server exposes an MCP HTTP endpoint at `/mcp` that accepts POST requests with MCP protocol messages.

### MCP Tools

Tools defined in the configuration are exposed as MCP tools with the same names. Parameters are automatically converted to the appropriate schema format.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## Support

For issues and questions, please open an issue on the GitHub repository.