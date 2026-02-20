#!/usr/bin/env node
/**
 * MCP Client Example
 * 
 * 这是一个 MCP 客户端示例，演示如何连接到 MCP 服务器
 * 并使用 Resources, Tools, Prompts 功能。
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // 创建 MCP 客户端
  const client = new Client(
    {
      name: "example-mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        // 声明客户端支持的 capabilities
        sampling: {},
      },
    }
  );

  // 创建 stdio 传输层，连接到服务器进程
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/server.js"],
  });

  try {
    // 连接到服务器
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    console.log("✓ Connected successfully\n");

    // ============================================================
    // 1. 列出并获取 Resources
    // ============================================================
    console.log("=== RESOURCES ===");
    const resources = await client.listResources();
    console.log("Available resources:");
    for (const resource of resources.resources) {
      console.log(`  - ${resource.name} (${resource.uri})`);
    }

    // 读取特定资源
    const resourceContent = await client.readResource({
      uri: "hello://greeting",
    });
    console.log("\nContent of 'hello://greeting':");
    const content = resourceContent.contents[0];
    if ('text' in content) {
      console.log(content.text);
    }

    // ============================================================
    // 2. 列出并调用 Tools
    // ============================================================
    console.log("\n=== TOOLS ===");
    const tools = await client.listTools();
    console.log("Available tools:");
    for (const tool of tools.tools) {
      console.log(`  - ${tool.name}: ${tool.description}`);
    }

    // 调用 calculator 工具
    console.log("\nCalling 'calculator' tool...");
    const calcResult = await client.callTool({
      name: "calculator",
      arguments: {
        operation: "add",
        a: 10,
        b: 20,
      },
    });
    const calcContent = calcResult.content as Array<{ type: string; text?: string }>;
    console.log("Result:", calcContent[0]?.text);

    // 调用 echo 工具
    console.log("\nCalling 'echo' tool...");
    const echoResult = await client.callTool({
      name: "echo",
      arguments: {
        message: "Hello from MCP client!",
        uppercase: true,
      },
    });
    const echoContent = echoResult.content as Array<{ type: string; text?: string }>;
    console.log("Result:", echoContent[0]?.text);

    // 调用 get_current_time 工具
    console.log("\nCalling 'get_current_time' tool...");
    const timeResult = await client.callTool({
      name: "get_current_time",
      arguments: {
        timezone: "Asia/Shanghai",
      },
    });
    const timeContent = timeResult.content as Array<{ type: string; text?: string }>;
    console.log("Result:", timeContent[0]?.text);

    // ============================================================
    // 3. 列出并获取 Prompts
    // ============================================================
    console.log("\n=== PROMPTS ===");
    const prompts = await client.listPrompts();
    console.log("Available prompts:");
    for (const prompt of prompts.prompts) {
      console.log(`  - ${prompt.name}: ${prompt.description}`);
    }

    // 获取 hello-world 提示
    console.log("\nGetting 'hello-world' prompt...");
    const helloPrompt = await client.getPrompt({
      name: "hello-world",
    });
    console.log("Prompt messages:", JSON.stringify(helloPrompt.messages, null, 2));

    // 获取 code-review 提示（带参数）
    console.log("\nGetting 'code-review' prompt...");
    const codeReviewPrompt = await client.getPrompt({
      name: "code-review",
      arguments: {
        code: "function add(a, b) { return a + b; }",
        language: "javascript",
      },
    });
    console.log("Prompt messages:", JSON.stringify(codeReviewPrompt.messages, null, 2));

    // ============================================================
    // 4. 断开连接
    // ============================================================
    console.log("\n=== DISCONNECTING ===");
    await client.close();
    console.log("✓ Disconnected successfully");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
