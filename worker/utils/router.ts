import type { Env } from '../types/env';

type Handler = (
  request: Request,
  env: Env,
  params: Record<string, string>
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  private addRoute(method: string, path: string, handler: Handler): void {
    const paramNames: string[] = [];
    const pattern = path.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    });
  }

  get(path: string, handler: Handler): Router {
    this.addRoute('GET', path, handler);
    return this;
  }

  post(path: string, handler: Handler): Router {
    this.addRoute('POST', path, handler);
    return this;
  }

  put(path: string, handler: Handler): Router {
    this.addRoute('PUT', path, handler);
    return this;
  }

  patch(path: string, handler: Handler): Router {
    this.addRoute('PATCH', path, handler);
    return this;
  }

  delete(path: string, handler: Handler): Router {
    this.addRoute('DELETE', path, handler);
    return this;
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        try {
          return await route.handler(request, env, params);
        } catch (error) {
          console.error('Route handler error:', error);
          return json({ error: 'Internal server error' }, 500);
        }
      }
    }

    return json({ error: 'Not found' }, 404);
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function cors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, { status: response.status, headers });
}
