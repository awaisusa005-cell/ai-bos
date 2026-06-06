import type { CompletionRequest, CompletionResponse } from '../schemas';
import type { AIProvider, AIProviderConfig } from './provider.interface';
import { v4 as uuid } from 'uuid';

export class AnthropicProvider implements AIProvider {
  readonly type = 'anthropic' as const;
  readonly name = 'Anthropic';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const model = request.model || this.getDefaultModel();

    const systemMessage = request.messages.find((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');

    const body = {
      model,
      max_tokens: request.maxTokens || 4096,
      ...(systemMessage && { system: systemMessage.content }),
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      })),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      ...(request.topP !== undefined && { top_p: request.topP }),
      ...(request.stop && { stop_sequences: request.stop }),
    };

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data: any = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');

    return {
      id: data.id || uuid(),
      content: textBlock?.text || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'stop',
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'claude-sonnet-4-20250514';
  }

  listModels(): string[] {
    return ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
  }
}
