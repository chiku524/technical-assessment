import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

import { getErrorMsg } from '@/utils/helpers/get-error-message';
import {
  useGetStudentCertificatesQuery,
  useRecordCertificateMutation,
  useUploadCertificateMetadataMutation
} from '../api';
import { connectWallet, issueOnChainCertificate, isWalletAvailable } from '../utils/web3';

type Props = {
  studentId: string | number;
};

export const StudentCertificatesPanel: React.FC<Props> = ({ studentId }) => {
  const { data, isLoading, refetch } = useGetStudentCertificatesQuery(studentId);
  const [uploadMetadata, { isLoading: uploading }] = useUploadCertificateMetadataMutation();
  const [recordCertificate, { isLoading: recording }] = useRecordCertificateMutation();

  const [wallet, setWallet] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [achievementDate, setAchievementDate] = React.useState('');

  const onConnect = async () => {
    try {
      const address = await connectWallet();
      setWallet(address);
      toast.success('Wallet connected');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onIssue = async () => {
    try {
      if (!title.trim()) {
        toast.error('Title is required');
        return;
      }

      const metadata = {
        studentId: Number(studentId),
        title: title.trim(),
        description: description.trim(),
        achievementDate: achievementDate || null,
        issuedAt: new Date().toISOString()
      };

      const ipfs = await uploadMetadata(metadata).unwrap();

      let onChain: { onChainId?: string; txHash?: string; issuerAddress?: string } = {};
      if (isWalletAvailable() && import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS) {
        if (!wallet) {
          await onConnect();
        }
        onChain = await issueOnChainCertificate({
          studentId: Number(studentId),
          contentHash: ipfs.contentHash,
          ipfsCid: ipfs.cid,
          title: title.trim()
        });
      }

      await recordCertificate({
        studentId: Number(studentId),
        title: title.trim(),
        description: description.trim() || undefined,
        achievementDate: achievementDate || undefined,
        ipfsCid: ipfs.cid,
        contentHash: ipfs.contentHash,
        onChainId: onChain.onChainId,
        txHash: onChain.txHash,
        issuerAddress: onChain.issuerAddress || wallet || undefined
      }).unwrap();

      toast.success('Certificate issued successfully');
      setTitle('');
      setDescription('');
      setAchievementDate('');
      refetch();
    } catch (error) {
      toast.error(getErrorMsg(error as FetchBaseQueryError | SerializedError).message);
    }
  };

  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems='center'>
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Certificates
        </Typography>
        <Button variant='outlined' onClick={onConnect}>
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'Connect Wallet'}
        </Button>
      </Stack>

      {!import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS && (
        <Alert severity='info' sx={{ mb: 2 }}>
          Set `VITE_CERTIFICATE_CONTRACT_ADDRESS` after deploying the smart contract to enable
          on-chain issuance. Certificates can still be stored with IPFS metadata off-chain.
        </Alert>
      )}

      <Stack spacing={2} sx={{ mb: 3, maxWidth: 520 }}>
        <TextField
          label='Certificate Title'
          size='small'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        <TextField
          label='Description'
          size='small'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          label='Achievement Date'
          type='date'
          size='small'
          value={achievementDate}
          onChange={(e) => setAchievementDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <LoadingButton
          variant='contained'
          loading={uploading || recording}
          onClick={onIssue}
          sx={{ alignSelf: 'flex-start' }}
        >
          Issue Certificate
        </LoadingButton>
      </Stack>

      {isLoading ? (
        <Typography>Loading certificates…</Typography>
      ) : (
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>IPFS CID</TableCell>
              <TableCell>On-chain ID</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.certificates || []).map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.title}</TableCell>
                <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.ipfsCid}
                </TableCell>
                <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.onChainId || '—'}
                </TableCell>
                <TableCell>{cert.revoked ? 'Revoked' : 'Valid'}</TableCell>
              </TableRow>
            ))}
            {!data?.certificates?.length && (
              <TableRow>
                <TableCell colSpan={4}>No certificates issued yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};
