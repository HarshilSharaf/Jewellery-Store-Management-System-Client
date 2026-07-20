export type WhatsappStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsappTemplateComponent {
  type: string;
  parameters?: Array<{ type: string; text?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface WhatsappSendLogRow {
  id?: number;
  sendGuid: string;
  invoiceId?: number | null;
  invoiceGuid?: string | null;
  invoiceNumber?: string | null;
  customerId: number;
  customerGuid?: string;
  customerName?: string;
  phoneNumber: string;
  templateName: string;
  templateLanguage: string;
  templateVariables?: unknown;
  attachmentUrl?: string | null;
  metaMessageId?: string | null;
  status: WhatsappStatus;
  errorMessage?: string | null;
  sentByUserId?: number | null;
  sentByUserName?: string | null;
  queuedAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export interface SendWhatsappPayload {
  invoiceGuid?: string | null;
  customerGuid: string;
  templateName: string;
  templateLanguage?: string;
  templateVariables?: unknown;
  attachmentUrl?: string | null;
  phoneNumber: string;
  sentByUserId?: number | null;
  components?: WhatsappTemplateComponent[];
}

export interface UpdateWhatsappStatusPayload {
  sendGuid: string;
  newStatus: WhatsappStatus;
  metaMessageId?: string | null;
  errorMessage?: string | null;
  actorUserId?: number | null;
}

export interface GetWhatsappLogArgs {
  customerGuid?: string | null;
  status?: WhatsappStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  pageSize?: number;
  page?: number;
}

/**
 * Shape returned by the main-process `whatsapp:send` orchestrator.
 * The orchestrator always inserts a queued row (returning sendGuid), then
 * calls the Meta Cloud API and flips the row to `sent` or `failed`.
 */
export interface SendWhatsappResult {
  ok: boolean;
  sendGuid?: string | null;
  messageId?: string | null;
  error?: string | null;
  status?: WhatsappStatus;
}
