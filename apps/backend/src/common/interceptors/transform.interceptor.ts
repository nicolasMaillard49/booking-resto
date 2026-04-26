import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Intercepteur qui ne modifie pas la réponse (les contrôleurs retournent déjà le bon format)
// Pourrait être utilisé pour ajouter des métadonnées globales si nécessaire
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, T> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(map((data) => data));
  }
}
