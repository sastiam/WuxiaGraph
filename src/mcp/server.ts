import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpServerDependencies,
  McpToolDefinition,
  McpToolResult,
} from './types.js';
import { executeTool, getAllToolDefinitions } from './tools/index.js';

export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const MCP_SERVER_INFO = {
  name: 'wuxiagraph-mcp-server',
  version: '0.1.0',
};

/**
 * Servidor Model Context Protocol (MCP) para WuxiaGraph.
 * Expone herramientas canónicas para interacción de agentes inteligentes mediante JSON-RPC 2.0.
 */
export class McpServer {
  constructor(private readonly deps: McpServerDependencies) {}

  get dependencies(): McpServerDependencies {
    return this.deps;
  }

  /**
   * Lista las herramientas disponibles en el servidor MCP conforme al protocolo tools/list.
   */
  listTools(): McpToolDefinition[] {
    return getAllToolDefinitions();
  }

  /**
   * Invoca una herramienta MCP por nombre y formatea el resultado en JSON estricto.
   */
  async callTool(name: string, args?: unknown): Promise<McpToolResult> {
    return executeTool(name, args, this.deps);
  }

  /**
   * Procesa un mensaje JSON-RPC 2.0 entrante y retorna la respuesta correspondiente.
   * Si el mensaje es una notificación (sin `id` o método de notificación), retorna `null`.
   */
  async handleMessage(message: unknown): Promise<JsonRpcResponse | null> {
    if (
      typeof message !== 'object' ||
      message === null ||
      Array.isArray(message)
    ) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Petición inválida: Se esperaba un objeto JSON.',
        },
      };
    }

    const req = message as Partial<JsonRpcRequest>;

    if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      return {
        jsonrpc: '2.0',
        id: req.id ?? null,
        error: {
          code: -32600,
          message: 'Petición inválida: Campos "jsonrpc" ("2.0") y "method" son obligatorios.',
        },
      };
    }

    const messageId = req.id ?? null;

    switch (req.method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id: messageId,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: {},
            },
            serverInfo: MCP_SERVER_INFO,
          },
        };
      }

      case 'notifications/initialized': {
        // Las notificaciones no devuelven respuesta según JSON-RPC 2.0
        return null;
      }

      case 'ping': {
        return {
          jsonrpc: '2.0',
          id: messageId,
          result: {},
        };
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id: messageId,
          result: {
            tools: this.listTools(),
          },
        };
      }

      case 'tools/call': {
        const params = req.params;
        if (typeof params !== 'object' || params === null) {
          return {
            jsonrpc: '2.0',
            id: messageId,
            error: {
              code: -32602,
              message: 'Parámetros inválidos: Se requiere un objeto "params".',
            },
          };
        }

        const toolName = (params as Record<string, unknown>).name;
        if (typeof toolName !== 'string' || toolName.trim().length === 0) {
          return {
            jsonrpc: '2.0',
            id: messageId,
            error: {
              code: -32602,
              message: 'Parámetros inválidos: El parámetro "name" de la herramienta es requerido.',
            },
          };
        }

        const toolArgs = (params as Record<string, unknown>).arguments;
        const result = await this.callTool(toolName, toolArgs);

        return {
          jsonrpc: '2.0',
          id: messageId,
          result,
        };
      }

      default: {
        return {
          jsonrpc: '2.0',
          id: messageId,
          error: {
            code: -32601,
            message: `Método no encontrado: "${req.method}".`,
          },
        };
      }
    }
  }

  /**
   * Recibe un string JSON serializado, lo procesa como JSON-RPC y retorna el resultado serializado.
   */
  async handleJsonRpc(rawJson: string): Promise<string | null> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Error de parseo: JSON inválido.',
        },
      });
    }

    const response = await this.handleMessage(parsed);
    if (response === null) {
      return null;
    }

    return JSON.stringify(response);
  }
}

/**
 * Fábrica para instanciar el servidor Model Context Protocol.
 */
export function createMcpServer(deps: McpServerDependencies): McpServer {
  return new McpServer(deps);
}
