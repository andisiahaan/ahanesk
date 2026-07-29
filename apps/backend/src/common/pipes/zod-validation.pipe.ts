import { PipeTransform, Injectable, UnprocessableEntityException, ArgumentMetadata, Optional } from '@nestjs/common';
import { messages } from '@ahanesk/shared';
import type { ZodType } from 'zod';

// Minimal structural type compatible with any Zod v4 schema.
// Zod v4 uses PropertyKey[] (string | number | symbol) for issue paths.
interface ZodLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  safeParse(value: unknown): { success: boolean; data?: any; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } };
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly schema?: ZodLike) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schemaToUse = this.schema || (metadata.metatype as any)?.zodSchema;
    
    if (!schemaToUse) {
      return value;
    }

    const result = schemaToUse.safeParse(value);
    if (!result.success) {
      const formattedErrors = (result.error?.issues ?? []).reduce(
        (acc: Record<string, string[]>, issue: { path: PropertyKey[]; message: string }) => {
          const field = issue.path.map(String).join('.') || '_root';
          if (!acc[field]) acc[field] = [];
          acc[field].push(issue.message);
          return acc;
        },
        {} as Record<string, string[]>,
      );
      throw new UnprocessableEntityException({
        message: messages.common.validationError,
        error: formattedErrors,
      });
    }
    return result.data;
  }
}
