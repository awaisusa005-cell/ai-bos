import type { AIProvider, AIProviderConfig } from './provider.interface';
import type { AIProviderType } from '../schemas';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { LocalProvider } from './local.provider';

export class ProviderManager {
  private providers = new Map<string, AIProvider>();
  private defaultProviderId: string | null = null;

  register(id: string, config: AIProviderConfig): void {
    const provider = this.createProvider(config);
    this.providers.set(id, provider);
    if (!this.defaultProviderId) {
      this.defaultProviderId = id;
    }
  }

  setDefault(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider "${id}" not registered`);
    }
    this.defaultProviderId = id;
  }

  get(id?: string): AIProvider {
    const providerId = id || this.defaultProviderId;
    if (!providerId) {
      throw new Error('No AI provider configured');
    }
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found`);
    }
    return provider;
  }

  getDefault(): AIProvider {
    return this.get();
  }

  list(): Array<{ id: string; type: AIProviderType; name: string }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      type: provider.type,
      name: provider.name,
    }));
  }

  async getAvailable(): Promise<Array<{ id: string; type: AIProviderType; name: string }>> {
    const results = [];
    for (const [id, provider] of this.providers) {
      if (await provider.isAvailable()) {
        results.push({ id, type: provider.type, name: provider.name });
      }
    }
    return results;
  }

  private createProvider(config: AIProviderConfig): AIProvider {
    switch (config.type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'local':
        return new LocalProvider(config);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }
}
