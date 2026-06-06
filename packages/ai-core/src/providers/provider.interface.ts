import type { CompletionRequest, CompletionResponse, AIProviderType } from '../schemas';

export interface AIProvider {
  readonly type: AIProviderType;
  readonly name: string;

  complete(request: CompletionRequest): Promise<CompletionResponse>;

  isAvailable(): Promise<boolean>;

  getDefaultModel(): string;

  listModels(): string[];
}

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
  organizationId?: string;
}
