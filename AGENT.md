# MCP Bridge Development

## Commands
- `npm start` - Start MCP server
- `npm test` - Run all tests
- `npm run test:integration` - Run integration tests with MCP Inspector CLI
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `tsx tests/test.ts` - Run specific test file
- `tsx tests/test_*.ts` - Run individual test files

## Code Style
- TypeScript with strict mode enabled
- ES modules (`import/export`)
- Verbatim module syntax
- No unused variables (error)
- Explicit function return types optional
- `any` type discouraged (warning)
- Use JSDoc comments for functions
- Prefer const over let
- Use async/await for promises
- Error handling with try/catch blocks
- Interface definitions for complex types