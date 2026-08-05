const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { ApiError } = require("../../utils");
const {
  insertCertificate,
  findCertificateById,
  findCertificatesByStudent,
  findCertificateByOnChainId,
} = require("./certificates-repository");

const IPFS_DIR = path.join(__dirname, "../../../ipfs-storage");

const ensureIpfsDir = () => {
  if (!fs.existsSync(IPFS_DIR)) {
    fs.mkdirSync(IPFS_DIR, { recursive: true });
  }
};

const toCid = (content) => {
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `bafy${hash.slice(0, 46)}`;
};

const uploadMetadata = async (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    throw new ApiError(400, "Metadata object is required");
  }

  ensureIpfsDir();
  const payload = {
    ...metadata,
    uploadedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);
  const cid = toCid(serialized);
  const contentHash = `0x${crypto.createHash("sha256").update(serialized).digest("hex")}`;

  fs.writeFileSync(path.join(IPFS_DIR, `${cid}.json`), serialized, "utf8");

  return { cid, contentHash, gatewayUrl: `/api/v1/certificates/ipfs/${cid}` };
};

const getMetadata = async (cid) => {
  ensureIpfsDir();
  const filePath = path.join(IPFS_DIR, `${cid}.json`);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "IPFS metadata not found");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const recordCertificate = async (payload) => {
  const {
    studentId,
    title,
    description,
    achievementDate,
    ipfsCid,
    contentHash,
    onChainId,
    txHash,
    issuerAddress,
    issuedBy,
  } = payload;

  if (!studentId || !title || !ipfsCid || !contentHash) {
    throw new ApiError(400, "studentId, title, ipfsCid, and contentHash are required");
  }

  const certificate = await insertCertificate({
    studentId,
    title,
    description: description || null,
    achievementDate: achievementDate || null,
    ipfsCid,
    contentHash,
    onChainId: onChainId || null,
    txHash: txHash || null,
    issuerAddress: issuerAddress || null,
    issuedBy,
  });

  return certificate;
};

const getCertificate = async (id) => {
  const certificate = await findCertificateById(id);
  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }
  return certificate;
};

const getStudentCertificates = async (studentId) => {
  return findCertificatesByStudent(studentId);
};

const verifyOffChain = async (certificateId) => {
  const certificate =
    (await findCertificateByOnChainId(certificateId)) ||
    (await findCertificateById(certificateId));

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  let metadata = null;
  try {
    metadata = await getMetadata(certificate.ipfsCid);
  } catch (error) {
    metadata = null;
  }

  return {
    valid: !certificate.revoked,
    certificate,
    metadata,
  };
};

module.exports = {
  uploadMetadata,
  getMetadata,
  recordCertificate,
  getCertificate,
  getStudentCertificates,
  verifyOffChain,
};
