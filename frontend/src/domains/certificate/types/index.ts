export type CertificateFormProps = {
  studentId: number;
  title: string;
  description?: string;
  achievementDate?: string;
  ipfsCid: string;
  contentHash: string;
  onChainId?: string;
  txHash?: string;
  issuerAddress?: string;
};

export type CertificateRecord = CertificateFormProps & {
  id: number;
  studentName?: string;
  revoked: boolean;
  createdAt: string;
};

export type IpfsUploadResult = {
  cid: string;
  contentHash: string;
  gatewayUrl: string;
};

export type VerifyCertificateResult = {
  valid: boolean;
  certificate: CertificateRecord;
  metadata: Record<string, unknown> | null;
};
