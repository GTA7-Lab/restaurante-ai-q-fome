import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../src/mcp/create-server";

// MCP sobre HTTP em modo stateless: cada request cria seu próprio server e
// transport, porque numa função serverless não há processo vivo entre chamadas
// para guardar sessão. Sem sessionIdGenerator o transport não exige session id,
// e enableJsonResponse faz ele responder JSON em vez de abrir um stream SSE.
export default async function handler(req: any, res: any) {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Erro interno no servidor MCP" },
        id: null,
      });
    }
  }
}
