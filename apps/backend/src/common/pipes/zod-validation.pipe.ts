import { PipeTransform, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { messages } from '@ahansk/shared';

// Minimal structural type compatible with any Zod v4 schema.
// Zod v4 uses PropertyKey[] (string | number | symbol) for issue paths.
interface ZodLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  safeParse(value: unknown): { success: boolean; data?: any; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } };
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodLike) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formattedErrors = (result.error?.issues ?? []).reduce<Record<string, string[]>>(
        (acc, issue) => {
          const field = issue.path.map(String).join('.') || '_root';
          if (!acc[field]) acc[field] = [];
          acc[field].push(issue.message);
          return acc;
        },
        {},
      );
      throw new UnprocessableEntityException({
        message: messages.common.validationError,
        error: formattedErrors,
      });
    }
    return result.data;
  }
}
