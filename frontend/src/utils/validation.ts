import { z } from 'zod'
import { validateEmail } from './emailList'

export const composeSchema = z.object({
  to: z.string().min(1).refine(validateEmail, 'Invalid email'),
  subject: z.string().min(1),
  body: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  replyTo: z.string().optional(),
})

export type ComposeFormValues = z.infer<typeof composeSchema>

export const inboxCheckSchema = z.object({
  domain: z.string().min(1),
  template: z.string().min(1),
  proxy: z.string().min(1),
  smtp: z.string().min(1),
  imap: z.string().min(1),
})

export type InboxCheckValues = z.infer<typeof inboxCheckSchema>
