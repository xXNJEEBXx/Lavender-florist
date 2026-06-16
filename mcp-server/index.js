import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api/internal";

const server = new Server(
  {
    name: "lavender-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Fetch tools schema from Laravel
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const response = await fetch(`${LARAVEL_API_URL}/tools`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Map the Laravel schema to MCP schema format
    const tools = data.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters || { type: "object", properties: {} },
    }));

    return { tools };
  } catch (error) {
    console.error("Error fetching tools from Laravel:", error);
    return { tools: [] };
  }
});

// Execute tool in Laravel
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const response = await fetch(`${LARAVEL_API_URL}/tools/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: request.params.name,
        arguments: request.params.arguments,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: `Execution failed: ${errorText}`,
          },
        ],
        isError: true,
      };
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data.result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error calling tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lavender MCP Server running on stdio");
}

main().catch(console.error);
