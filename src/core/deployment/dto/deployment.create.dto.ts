import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const deploymentCreateSchema = z.object({
  userId: z.number().positive(),
  folderPath: z.string(),
  deploymentId: z.number().positive(),
});

export class DeploymentCreateDto extends createZodDto(deploymentCreateSchema) {}
