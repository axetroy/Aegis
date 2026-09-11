/**
 * Aegis Network Capability
 *
 * 提供受控的网络访问能力
 */

import { type PermissionManager, isNetworkAllowed } from '@aegis/security';
import { type CapabilityPolicy } from '@aegis/protocol';

// 网络请求选项
export interface NetworkRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// 网络响应
export interface NetworkResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

// 网络错误
export interface NetworkError {
  code: string;
  message: string;
  url?: string;
}

// 拦截器函数类型
export type RequestInterceptor = (options: NetworkRequestOptions) => NetworkRequestOptions | Promise<NetworkRequestOptions>;
export type ResponseInterceptor = (response: NetworkResponse) => NetworkResponse | Promise<NetworkResponse>;
export type ErrorInterceptor = (error: NetworkError) => NetworkError | Promise<NetworkError>;

// 网络能力类
export class NetworkCapability {
  private permissionManager: PermissionManager;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private defaultPolicy?: CapabilityPolicy;

  constructor(permissionManager: PermissionManager, defaultPolicy?: CapabilityPolicy) {
    this.permissionManager = permissionManager;
    this.defaultPolicy = defaultPolicy;
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 添加错误拦截器
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * 发送网络请求
   */
  async request(options: NetworkRequestOptions): Promise<NetworkResponse> {
    // 检查权限
    const allowed = await this.permissionManager.requestCapability('network' as any);
    if (!allowed) {
      throw new Error('Network access denied');
    }

    // 应用请求拦截器
    let processedOptions = options;
    for (const interceptor of this.requestInterceptors) {
      processedOptions = await interceptor(processedOptions);
    }

    // 验证 URL
    let url: URL;
    try {
      url = new URL(processedOptions.url);
    } catch {
      throw new Error('Invalid URL');
    }

    // 检查网络策略
    const policy = this.defaultPolicy?.network;
    if (policy && !isNetworkAllowed(url.href, policy)) {
      throw new Error(`Network request to "${url.href}" is blocked by policy`);
    }

    // 执行请求
    try {
      const response = await this.executeRequest(processedOptions);

      // 应用响应拦截器
      for (const interceptor of this.responseInterceptors) {
        return await interceptor(response);
      }

      return response;
    } catch (error) {
      const networkError: NetworkError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : String(error),
        url: processedOptions.url,
      };

      // 应用错误拦截器
      for (const interceptor of this.errorInterceptors) {
        throw await interceptor(networkError);
      }

      throw networkError;
    }
  }

  /**
   * 执行底层网络请求
   */
  private async executeRequest(options: NetworkRequestOptions): Promise<NetworkResponse> {
    // 在真实环境中，这里会通过宿主的安全网络代理执行请求
    // 在测试环境中，我们模拟一个响应
    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  }

  /**
   * GET 请求便捷方法
   */
  async get(url: string, headers?: Record<string, string>): Promise<NetworkResponse> {
    return this.request({ url, method: 'GET', headers });
  }

  /**
   * POST 请求便捷方法
   */
  async post(url: string, body?: string, headers?: Record<string, string>): Promise<NetworkResponse> {
    return this.request({ url, method: 'POST', headers, body });
  }

  /**
   * 清除所有拦截器
   */
  clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }
}

// 创建网络能力实例
export function createNetworkCapability(
  permissionManager: PermissionManager,
  defaultPolicy?: CapabilityPolicy,
): NetworkCapability {
  return new NetworkCapability(permissionManager, defaultPolicy);
}
