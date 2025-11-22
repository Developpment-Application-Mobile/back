import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const http = context.switchToHttp();
        const request = http.getRequest<Request & any>();

        const method = request.method;
        const url = request.originalUrl || request.url;
        const handler = context.getHandler()?.name;
        const controller = context.getClass()?.name;

        const params = request.params || {};
        const query = request.query || {};
        const body = this.sanitizeBody(request.body || {});

        this.logger.log(
            `→ ${method} ${url} | ${controller}.${handler} | params=${JSON.stringify(
                params,
            )} query=${JSON.stringify(query)} body=${JSON.stringify(body)}`,
        );

        return next.handle().pipe(
            tap(() => {
                const response = http.getResponse<Response & any>();
                const statusCode = response?.statusCode ?? 200;
                const ms = Date.now() - now;
                this.logger.log(`← ${method} ${url} ${statusCode} (${ms}ms)`);
            }),
            catchError((err) => {
                const ms = Date.now() - now;
                const statusCode = err?.status ?? err?.statusCode ?? 500;
                this.logger.error(
                    `× ${method} ${url} ${statusCode} (${ms}ms) | error=${err?.message || 'Unknown error'
                    }`,
                );
                throw err;
            }),
        );
    }

    private sanitizeBody(obj: any) {
        try {
            const clone = (globalThis as any).structuredClone
                ? (globalThis as any).structuredClone(obj)
                : obj;
            const redactKeys = new Set([
                'password',
                'confirmPassword',
                'authorization',
                'token',
                'apiKey',
                'apikey',
                'access_token',
                'refresh_token',
            ]);

            const redact = (node: any) => {
                if (!node || typeof node !== 'object') return;
                for (const key of Object.keys(node)) {
                    if (redactKeys.has(key.toLowerCase())) {
                        node[key] = '***REDACTED***';
                    } else if (typeof node[key] === 'object') {
                        redact(node[key]);
                    }
                }
            };
            redact(clone);
            return clone;
        } catch {
            return { notice: 'body not serializable for logging' };
        }
    }
}
