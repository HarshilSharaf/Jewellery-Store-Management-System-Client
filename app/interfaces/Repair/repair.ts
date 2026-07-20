export type RepairStatus = 'received' | 'in_progress' | 'ready' | 'delivered' | 'declined';
export type RepairPaymentMode = 'cash' | 'cheque' | 'online';

export interface RepairTicket {
  id?: number;
  ticketGuid: string;
  ticketNumber: string;
  customerId: number;
  customerGuid?: string;
  customerName?: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  receivedAt: string;
  receivedByUserId?: number | null;
  receivedByUserName?: string | null;
  itemDescription: string;
  itemPhotoPath?: string | null;
  weight?: number | null;
  estimatedCharge?: number | null;
  estimatedReturnDate?: string | null;
  status: RepairStatus;
  actualCharge?: number | null;
  paymentMode?: RepairPaymentMode | null;
  paymentRef?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  karigarId?: number | null;
  karigarGuid?: string | null;
  karigarName?: string | null;
  karigarPhone?: string | null;
  karigarJobId?: number | null;
  karigarJobGuid?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRepairTicketPayload {
  customerGuid: string;
  receivedByUserId?: number | null;
  itemDescription: string;
  itemPhotoPath?: string | null;
  weight?: number | null;
  estimatedCharge?: number | null;
  estimatedReturnDate?: string | null;
  notes?: string | null;
  karigarGuid?: string | null;
}

export interface UpdateRepairStatusPayload {
  ticketGuid: string;
  newStatus: RepairStatus;
  actorUserId?: number | null;
  actualCharge?: number | null;
  paymentMode?: RepairPaymentMode | null;
  paymentRef?: string | null;
}

export interface SettleRepairTicketPayload {
  ticketGuid: string;
  actualCharge: number;
  paymentMode: RepairPaymentMode;
  paymentRef?: string | null;
  actorUserId?: number | null;
}

export interface LinkRepairToKarigarPayload {
  ticketGuid: string;
  karigarGuid: string;
  karigarJobGuid?: string | null;
  actorUserId?: number | null;
}

export interface GetAllRepairTicketsArgs {
  status?: RepairStatus | null;
  customerSearch?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  pageSize?: number;
  page?: number;
}
