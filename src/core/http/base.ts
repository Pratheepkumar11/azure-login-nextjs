interface FetchConfig {
  options?: {
    timeout?: number;
  };
}

interface HttpClient {
  post<T>(url: string, body: string, headers: Record<string, string>, config?: FetchConfig): Promise<T>;
  get<T>(url: string, headers?: Record<string, string>, config?: FetchConfig): Promise<T>;
}

class SimpleFetchClient implements HttpClient {
  private async request<T>(
    url: string, 
    method: string, 
    body?: string, 
    headers?: Record<string, string>, 
    config?: FetchConfig
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = config?.options?.timeout 
      ? setTimeout(() => controller.abort(), config.options.timeout)
      : null;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      throw error;
    }
  }

  async post<T>(
    url: string, 
    body: string, 
    headers: Record<string, string> = {}, 
    config?: FetchConfig
  ): Promise<T> {
    return this.request<T>(url, 'POST', body, headers, config);
  }

  async get<T>(
    url: string, 
    headers: Record<string, string> = {}, 
    config?: FetchConfig
  ): Promise<T> {
    return this.request<T>(url, 'GET', undefined, headers, config);
  }
}

const fetchClient = new SimpleFetchClient();
export default fetchClient;
