import type { CompletionRequest, CompletionResponse } from '../schemas';
import type { AIProvider, AIProviderConfig } from './provider.interface';
import { v4 as uuid } from 'uuid';

/**
 * Provider for local/self-hosted models (Ollama, vLLM, text-generation-webui)
 * that expose an OpenAI-compatible API.
 */
export class LocalProvider implements AIProvider {
  readonly type = 'local' as const;
  readonly name = 'Local Model';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434/v1';
    const model = request.model || this.getDefaultModel();

    const body = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      ...(request.maxTokens && { max_tokens: request.maxTokens }),
      ...(request.topP !== undefined && { top_p: request.topP }),
      ...(request.stop && { stop: request.stop }),
      stream: false,
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 120000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local model API error (${response.status}): ${error}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];

    return {
      id: data.id || uuid(),
      content: choice?.message?.content || '',
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason || 'stop',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const baseUrl = this.config.baseUrl || 'http://localhost:11434/v1';
      const response = await fetch(`${baseUrl}/models`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'llama3';
  }

  listModels(): string[] {
    return ['llama3', 'mixtral', 'codellama', 'phi-3'];
  }
}
