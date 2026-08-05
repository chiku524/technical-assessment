import {
  BrowserProvider,
  Contract,
  Eip1193Provider,
  id as ethersId
} from 'ethers';
import certificateAbi from '../abi/CertificateRegistry.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS as string | undefined;

const getEthereumProvider = (): Eip1193Provider => {
  const provider = window.ethereum as Eip1193Provider | undefined;
  if (!provider) {
    throw new Error('MetaMask (or another Web3 wallet) is required');
  }
  return provider;
};

export const isWalletAvailable = () =>
  typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

export const connectWallet = async (): Promise<string> => {
  const ethereum = getEthereumProvider();
  const provider = new BrowserProvider(ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts?.length) {
    throw new Error('No wallet account found');
  }
  return accounts[0] as string;
};

export const getCertificateContract = async (withSigner = false) => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_CERTIFICATE_CONTRACT_ADDRESS is not configured');
  }

  const ethereum = getEthereumProvider();
  const provider = new BrowserProvider(ethereum);
  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, certificateAbi, signer);
  }
  return new Contract(CONTRACT_ADDRESS, certificateAbi, provider);
};

export const issueOnChainCertificate = async ({
  studentId,
  contentHash,
  ipfsCid,
  title
}: {
  studentId: number;
  contentHash: string;
  ipfsCid: string;
  title: string;
}) => {
  const contract = await getCertificateContract(true);
  const hashBytes32 =
    contentHash.startsWith('0x') && contentHash.length === 66 ? contentHash : ethersId(contentHash);

  const tx = await contract.issueCertificate(studentId, hashBytes32, ipfsCid, title);
  const receipt = await tx.wait();

  let onChainId: string | undefined;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'CertificateIssued') {
        onChainId = parsed.args.certificateId as string;
        break;
      }
    } catch {
      // ignore unrelated logs
    }
  }

  const signer = await new BrowserProvider(getEthereumProvider()).getSigner();
  return {
    onChainId,
    txHash: receipt.hash as string,
    issuerAddress: await signer.getAddress()
  };
};

export const verifyOnChainCertificate = async (certificateId: string) => {
  const contract = await getCertificateContract(false);
  const result = await contract.verifyCertificate(certificateId);
  return {
    valid: Boolean(result[0]),
    studentId: Number(result[1]),
    contentHash: result[2] as string,
    ipfsCid: result[3] as string,
    title: result[4] as string,
    issuer: result[5] as string,
    issuedAt: Number(result[6]),
    revoked: Boolean(result[7])
  };
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: Eip1193Provider & Record<string, any>;
  }
}
