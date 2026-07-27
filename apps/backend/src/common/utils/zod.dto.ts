import { ZodType } from 'zod';

export interface ZodDto<T> {
  new (): T;
  zodSchema: ZodType;
}

export function createZodDto<T>(schema: ZodType<T>): ZodDto<T> {
  class AugmentedZodDto {
    public static zodSchema = schema;
  }
  return AugmentedZodDto as unknown as ZodDto<T>;
}
