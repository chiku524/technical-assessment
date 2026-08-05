import { api } from '@/api/api';
import { Tag } from '@/api/tag-types';
import {
  CertificateFormProps,
  CertificateRecord,
  IpfsUploadResult,
  VerifyCertificateResult
} from '../types';

export const certificateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadCertificateMetadata: builder.mutation<IpfsUploadResult, Record<string, unknown>>({
      query: (body) => ({
        url: '/certificates/ipfs',
        method: 'POST',
        body
      })
    }),
    recordCertificate: builder.mutation<CertificateRecord, CertificateFormProps>({
      query: (body) => ({
        url: '/certificates',
        method: 'POST',
        body
      }),
      invalidatesTags: [Tag.CERTIFICATES]
    }),
    getStudentCertificates: builder.query<{ certificates: CertificateRecord[] }, string | number>({
      query: (studentId) => `/certificates/student/${studentId}`,
      providesTags: [Tag.CERTIFICATES]
    }),
    verifyCertificate: builder.query<VerifyCertificateResult, string>({
      query: (certificateId) => `/certificates/verify/${certificateId}`
    }),
    getCertificateMetadata: builder.query<Record<string, unknown>, string>({
      query: (cid) => `/certificates/ipfs/${cid}`
    })
  })
});

export const {
  useUploadCertificateMetadataMutation,
  useRecordCertificateMutation,
  useGetStudentCertificatesQuery,
  useLazyVerifyCertificateQuery,
  useGetCertificateMetadataQuery
} = certificateApi;
