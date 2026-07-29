import { createZodDto } from '../../common/utils/zod.dto';
import {
  CreateHelpCategorySchema, UpdateHelpCategorySchema,
  CreateHelpArticleSchema, UpdateHelpArticleSchema,
  VoteHelpfulSchema
} from '@ahanesk/shared';

export class CreateHelpCategoryDto extends createZodDto(CreateHelpCategorySchema) {}
export class UpdateHelpCategoryDto extends createZodDto(UpdateHelpCategorySchema) {}
export class CreateHelpArticleDto extends createZodDto(CreateHelpArticleSchema) {}
export class UpdateHelpArticleDto extends createZodDto(UpdateHelpArticleSchema) {}
export class VoteHelpfulDto extends createZodDto(VoteHelpfulSchema) {}
