import type { KycDocument, KycDocumentType } from '@/types';
import { mockRbos } from '@/mocks/marketplace';

const TYPE_LABELS: Record<KycDocumentType, string> = {
  gst: 'GST registration',
  pan: 'PAN card',
  id_proof: 'Owner ID proof',
  address_proof: 'Address proof',
  business_registration: 'Business registration',
};

export function kycTypeLabel(type: KycDocumentType): string {
  return TYPE_LABELS[type];
}

/** Mock KYC docs aligned with rental-rbo-portal fixture pattern */
export function buildKycDocumentsForVendor(
  vendorId: string,
  kycStatus: 'verified' | 'pending' | 'rejected',
): KycDocument[] {
  if (kycStatus === 'verified' && vendorId.startsWith('rbo-')) {
    const base = `https://picsum.photos/seed/${vendorId}`;
    const types: KycDocumentType[] = [
      'gst',
      'pan',
      'id_proof',
      'address_proof',
    ];
    return types.map((type, i) => ({
      id: `kyc-${vendorId}-${type}`,
      type,
      fileUrl: `${base}-${type}/400/300`,
      fileName: `${type}.pdf`,
      status: 'verified' as const,
      uploadedAt: new Date(2026, 6, 1 + i).toISOString(),
    }));
  }

  if (kycStatus === 'pending' || kycStatus === 'rejected') {
    const base = `https://picsum.photos/seed/${vendorId}`;
    return [
      {
        id: `kyc-${vendorId}-gst`,
        type: 'gst',
        fileUrl: `${base}-gst/400/300`,
        fileName: 'gst-certificate.pdf',
        status: kycStatus === 'rejected' ? 'rejected' : 'pending',
        rejectionReason:
          kycStatus === 'rejected' ? 'GST certificate invalid' : undefined,
        uploadedAt: '2026-07-01T10:00:00.000Z',
      },
      {
        id: `kyc-${vendorId}-pan`,
        type: 'pan',
        fileUrl: `${base}-pan/400/300`,
        fileName: 'pan-card.jpg',
        status: 'pending',
        uploadedAt: '2026-07-01T10:01:00.000Z',
      },
      {
        id: `kyc-${vendorId}-id`,
        type: 'id_proof',
        fileUrl: `${base}-id/400/300`,
        fileName: 'aadhaar.jpg',
        status: 'pending',
        uploadedAt: '2026-07-01T10:02:00.000Z',
      },
      {
        id: `kyc-${vendorId}-addr`,
        type: 'address_proof',
        fileUrl: `${base}-addr/400/300`,
        fileName: 'utility-bill.pdf',
        status: 'pending',
        uploadedAt: '2026-07-01T10:03:00.000Z',
      },
    ];
  }

  return [];
}

interface RboPortalMockState {
  vendors: Array<{ id: string; status: string }>;
  applications: Record<string, { rejectionReason?: string; submittedAt?: string }>;
  passwords: Record<string, string>;
}

function buildDefaultRboPortalState(): RboPortalMockState {
  return {
    vendors: mockRbos.map((v) => ({ ...v })),
    applications: {},
    passwords: {},
  };
}

/** Sync vendor status to rental-rbo-portal mock state in localStorage */
export function syncRboPortalMockState(
  vendorId: string,
  status: 'active' | 'rejected' | 'frozen' | 'onboarding',
  rejectionReason?: string,
): void {
  try {
    let parsed: RboPortalMockState;
    const raw = localStorage.getItem('rental_rbo_mock_state');
    if (raw) {
      parsed = JSON.parse(raw) as RboPortalMockState;
    } else {
      parsed = buildDefaultRboPortalState();
    }

    const vendors = parsed.vendors ?? [];
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx < 0) {
      const adminVendor = mockRbos.find((v) => v.id === vendorId);
      if (adminVendor) {
        vendors.push({ ...adminVendor, status });
      }
    } else {
      vendors[idx] = { ...vendors[idx], status };
    }
    parsed.vendors = vendors;

    if (!parsed.applications) {
      parsed.applications = {};
    }
    const app = parsed.applications[vendorId] ?? {};
    if (status === 'rejected' && rejectionReason) {
      app.rejectionReason = rejectionReason;
    }
    if (status === 'active') {
      app.rejectionReason = undefined;
    }
    parsed.applications[vendorId] = app;

    localStorage.setItem('rental_rbo_mock_state', JSON.stringify(parsed));

    const overridesRaw = localStorage.getItem('rental_rbo_status_overrides');
    const overrides: Record<string, string> = overridesRaw
      ? (JSON.parse(overridesRaw) as Record<string, string>)
      : {};
    overrides[vendorId] = status;
    localStorage.setItem(
      'rental_rbo_status_overrides',
      JSON.stringify(overrides),
    );
  } catch {
    /* cross-app sync is best-effort in mock mode */
  }
}
