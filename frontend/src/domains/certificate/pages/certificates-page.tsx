import * as React from 'react';
import { Alert, Box, Paper, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

import { PageContentHeader } from '@/components/page-content-header';
import { getErrorMsg } from '@/utils/helpers/get-error-message';
import { useLazyVerifyCertificateQuery } from '../api';
import { connectWallet, isWalletAvailable, verifyOnChainCertificate } from '../utils/web3';

export const CertificatesPage = () => {
  const [certificateId, setCertificateId] = React.useState('');
  const [wallet, setWallet] = React.useState('');
  const [onChainResult, setOnChainResult] = React.useState<Record<string, unknown> | null>(null);
  const [verifyOffChain, { data, isFetching }] = useLazyVerifyCertificateQuery();

  const onConnect = async () => {
    try {
      const address = await connectWallet();
      setWallet(address);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onVerify = async () => {
    try {
      if (!certificateId.trim()) {
        toast.error('Enter a certificate id');
        return;
      }

      await verifyOffChain(certificateId.trim()).unwrap();

      if (
        isWalletAvailable() &&
        import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS &&
        certificateId.startsWith('0x')
      ) {
        if (!wallet) {
          await onConnect();
        }
        const chain = await verifyOnChainCertificate(certificateId.trim());
        setOnChainResult(chain);
      } else {
        setOnChainResult(null);
      }
    } catch (error) {
      setOnChainResult(null);
      toast.error(getErrorMsg(error as FetchBaseQueryError | SerializedError).message);
    }
  };

  return (
    <>
      <PageContentHeader heading='Certificate Verification' />
      <Box component={Paper} sx={{ p: 3 }}>
        <Typography sx={{ mb: 2 }}>
          Verify student achievement certificates using off-chain records and optional on-chain
          proof.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label='Certificate ID / On-chain ID'
            size='small'
            fullWidth
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
          />
          <LoadingButton loading={isFetching} variant='contained' onClick={onVerify}>
            Verify
          </LoadingButton>
          <LoadingButton variant='outlined' onClick={onConnect}>
            {wallet ? 'Wallet Connected' : 'Connect Wallet'}
          </LoadingButton>
        </Stack>

        {data && (
          <Alert severity={data.valid ? 'success' : 'warning'} sx={{ mb: 2 }}>
            Off-chain status: {data.valid ? 'Valid' : 'Revoked / Invalid'} —{' '}
            {data.certificate.title} (Student #{data.certificate.studentId})
          </Alert>
        )}

        {data?.metadata && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='subtitle1'>IPFS Metadata</Typography>
            <Box
              component='pre'
              sx={{ bgcolor: 'grey.100', p: 2, overflow: 'auto', borderRadius: 1 }}
            >
              {JSON.stringify(data.metadata, null, 2)}
            </Box>
          </Box>
        )}

        {onChainResult && (
          <Box>
            <Typography variant='subtitle1'>On-chain Verification</Typography>
            <Box
              component='pre'
              sx={{ bgcolor: 'grey.100', p: 2, overflow: 'auto', borderRadius: 1 }}
            >
              {JSON.stringify(onChainResult, null, 2)}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};
