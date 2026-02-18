import { z } from "zod";

const UserStatusSchema = z.enum(["active", "inactive"]);

export const SignUpSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  password: z.string().min(6).max(200)
});

export const SignInSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  password: z.string().min(6).max(200)
});

export const CreateUserSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  status: UserStatusSchema.optional(),
  password: z.string().min(6).max(200)
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  status: UserStatusSchema.optional()
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50)
});
