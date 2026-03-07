import { z } from 'zod';

export const createBoardSchema = z.object({
  title: z.string().min(1).max(100),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(100),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const createColumnSchema = z.object({
  title: z.string().min(1).max(100),
  position: z.number().int().min(0).optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export const createCardSchema = z.object({
  title: z.string().min(1).max(255),
  position: z.number().int().min(0).optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  position: z.number().int().min(0).optional(),
  columnId: z.number().int().optional(),
});
