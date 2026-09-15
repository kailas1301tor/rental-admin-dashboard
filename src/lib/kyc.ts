import type { KycDocumentType } from '@/types';

const TYPE_LABELS: Record<KycDocumentType, string> = {
  gst: 'GST registration',
  pan: 'PAN card',
  id_proof: 'Owner ID proof',
  address_proof: 'Address proof',
  business_registration: 'Business registration',
};

export function kycTypeLabel(type: KycDocumentType): string {
  return TYPE_LABELS[type] ?? type;
}
