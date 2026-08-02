import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { anonClient } from '@/lib/mcp/rpc'
import { createMcpServer } from '@/lib/mcp/server'

export async function POST(request: Request) {
  const server = createMcpServer(anonClient())
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}
