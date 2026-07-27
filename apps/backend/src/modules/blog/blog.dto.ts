import { z } from 'zod';

const slug = /^[a-z0-9-]+$/;

export const CreatePostSchema = z.object({
  title:            z.string().min(3).max(255),
  slug:             z.string().min(3).max(255).regex(slug, 'Slug: lowercase, numbers, hyphens only'),
  excerpt:          z.string().max(500).optional().nullable(),
  content:          z.string().min(1),
  status:           z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).default('DRAFT'),
  published_at:     z.coerce.date().optional().nullable(),
  is_featured:      z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  allow_comments:   z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
  meta_title:       z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  meta_keywords:    z.string().max(255).optional().nullable(),
  categories:       z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), z.array(z.string()).default([])),
  tags:             z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), z.array(z.string()).default([])),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const CreateCategorySchema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().min(2).max(100).regex(slug),
  description: z.string().optional().nullable(),
  parent_id:   z.string().uuid().optional().nullable(),
  order:       z.coerce.number().int().default(0),
  is_active:   z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(true),
});
export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateTagSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(slug),
});
export const UpdateTagSchema = CreateTagSchema.partial();

export const ListPostsQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(10),
  status:   z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  category: z.string().optional(),
  tag:      z.string().optional(),
  featured: z.preprocess((v) => v === 'true', z.boolean()).optional(),
  search:   z.string().optional(),
});

import { createZodDto } from '../../common/utils/zod.dto';

export class CreatePostDto extends createZodDto(CreatePostSchema) {}
export class UpdatePostDto extends createZodDto(UpdatePostSchema) {}
export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
export class CreateTagDto extends createZodDto(CreateTagSchema) {}
export class UpdateTagDto extends createZodDto(UpdateTagSchema) {}
export class ListPostsQueryDto extends createZodDto(ListPostsQuerySchema) {}
