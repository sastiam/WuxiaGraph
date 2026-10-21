import type { IDreamingRepository } from '../domain/dreaming/repository.js';
import type { IWipGovernanceRepository } from '../domain/governance/repository.js';
import type { IContextRepository } from '../domain/context/types.js';
import type { IGraphRepository } from '../domain/graph/repository.js';
import type { GraphService } from '../domain/graph/graphService.js';

/**
 * Dependencias necesarias para la ejecución de herramientas MCP.
 * Regla de Arquitectura: Solo depende de puertos del dominio.
 */
export interface McpServerDependencies {
  dreamingRepo: IDreamingRepository;
  govRepo: IWipGovernanceRepository;
  contextRepo?: IContextRepository;
  graphRepo?: IGraphRepository;
  graphService?: GraphService;
}

/**
 * Esquema de definición de una herramienta MCP según especificación v1.x.
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

/**
 * Contenido textual retornado por una herramienta MCP.
 */
export interface McpTextContent {
  type: 'text';
  text: string;
}

export type McpContent = McpTextContent;

/**
 * Resultado estándar de ejecución de una herramienta MCP.
 */
export interface McpToolResult {
  content: McpContent[];
  isError?: boolean;
}

/**
 * Firma del manejador de una herramienta MCP.
 */
export type McpToolHandler = (
  args: unknown,
  deps: McpServerDependencies
) => Promise<McpToolResult>;

/**
 * Petición JSON-RPC 2.0 estándar para MCP.
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * Error JSON-RPC 2.0 estándar.
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * Respuesta JSON-RPC 2.0 estándar para MCP.
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}
