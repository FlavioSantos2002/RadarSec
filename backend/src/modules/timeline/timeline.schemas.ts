import { z } from 'zod';

export const timelineMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode ser vazia.'),
});

export type TimelineMessageInput = z.infer<typeof timelineMessageSchema>;
