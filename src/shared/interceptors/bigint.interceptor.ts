import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

// Tipo que representa un objeto con BigInts convertidos a string
type BigIntToString<T> = T extends bigint
  ? string
  : T extends (infer U)[]
    ? BigIntToString<U>[]
    : T extends object
      ? { [K in keyof T]: BigIntToString<T[K]> }
      : T;

// Función de transformación con sobrecargas y tipado genérico
function convertBigIntToString(value: bigint): string;
function convertBigIntToString<T>(value: T[]): BigIntToString<T>[];
function convertBigIntToString<T extends object>(value: T): BigIntToString<T>;
function convertBigIntToString<T>(value: T): T; // Catch-all para tipos primitivos no bigint

function convertBigIntToString<T>(value: T): BigIntToString<T> | T {
  if (isBigInt(value)) {
    return value.toString() as BigIntToString<T>;
  }

  if (Array.isArray(value)) {
    // Aseguramos que 'item' es del mismo tipo que los elementos del array 'value'
    // Y luego casteamos el resultado del map a BigIntToString<T>
    return value.map((item: T extends (infer U)[] ? U : never) =>
      convertBigIntToString(item),
    ) as BigIntToString<T>;
  }

  if (typeof value === 'object' && value !== null) {
    const newObj: { [key: string]: any } = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        newObj[key] = convertBigIntToString(value[key]);
      }
    }
    return newObj as BigIntToString<T>;
  }

  return value;
}

@Injectable()
export class BigIntInterceptor<T, R = BigIntToString<T>>
  implements NestInterceptor<T, R>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<R> {
    return next
      .handle()
      .pipe(map((data) => convertBigIntToString(data) as unknown as R));
  }
}
