import type { CompletionRequest, CompletionResponse } from '../schemas';
import type { AIProvider, AIProviderConfig } from './provider.interface';
import { v4 as uuid } from 'uuid';

export class GeminiProvider implements AIProvider {
  readonly type = 'gemini' as const;
  readonly name = 'Google Gemini';
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = request.model || this.getDefaultModel();

    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = request.messages.find((m) => m.role === 'system');

    const body = {
      contents,
      ...(systemInstruction && {
        systemInstruction: { parts: [{ text: systemInstruction.content }] },
      }),
      generationConfig: {
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.maxTokens && { maxOutputTokens: request.maxTokens }),
        ...(request.topP !== undefined && { topP: request.topP }),
        ...(request.stop && { stopSequences: request.stop }),
        ...(request.responseFormat === 'json' && { responseMimeType: 'application/json' }),
      },
    };

    const url = `${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';

    return {
      id: uuid(),
      content: text,
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: candidate?.finishReason === 'STOP' ? 'stop' : 'stop',
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'gemini-2.0-flash';
  }

  listModels(): string[] {
    return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }
}
