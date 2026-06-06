import type { CompletionRequest, CompletionResponse } from '../schemas';
import type { AIProvider, AIProviderConfig } from './provider.interface';
import { v4 as uuid } from 'uuid';

export class OpenAIProvider implements AIProvider {
  readonly type = 'openai' as const;
  readonly name = 'OpenAI';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = request.model || this.getDefaultModel();

    const body = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name }),
        ...(m.toolCallId && { tool_call_id: m.toolCallId }),
      })),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      ...(request.maxTokens && { max_tokens: request.maxTokens }),
      ...(request.topP !== undefined && { top_p: request.topP }),
      ...(request.stop && { stop: request.stop }),
      ...(request.responseFormat === 'json' && {
        response_format: { type: 'json_object' },
      }),
      ...(request.tools && { tools: request.tools }),
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId && {
          'OpenAI-Organization': this.config.organizationId,
        }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data: any = await response.json();
    const choice = data.choices[0];

    return {
      id: data.id || uuid(),
      content: choice.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason || 'stop',
      toolCalls: choice.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      })),
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'gpt-4o';
  }

  listModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }
}
