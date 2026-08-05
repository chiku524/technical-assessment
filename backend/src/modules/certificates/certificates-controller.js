const asyncHandler = require("express-async-handler");
const {
  uploadMetadata,
  getMetadata,
  recordCertificate,
  getCertificate,
  getStudentCertificates,
  verifyOffChain,
} = require("./certificates-service");

const handleUploadMetadata = asyncHandler(async (req, res) => {
  const result = await uploadMetadata(req.body);
  res.status(201).json(result);
});

const handleGetMetadata = asyncHandler(async (req, res) => {
  const metadata = await getMetadata(req.params.cid);
  res.json(metadata);
});

const handleRecordCertificate = asyncHandler(async (req, res) => {
  const { id: issuedBy } = req.user;
  const certificate = await recordCertificate({ ...req.body, issuedBy });
  res.status(201).json(certificate);
});

const handleGetCertificate = asyncHandler(async (req, res) => {
  const certificate = await getCertificate(req.params.id);
  res.json(certificate);
});

const handleGetStudentCertificates = asyncHandler(async (req, res) => {
  const certificates = await getStudentCertificates(req.params.studentId);
  res.json({ certificates });
});

const handleVerifyOffChain = asyncHandler(async (req, res) => {
  const result = await verifyOffChain(req.params.certificateId);
  res.json(result);
});

module.exports = {
  handleUploadMetadata,
  handleGetMetadata,
  handleRecordCertificate,
  handleGetCertificate,
  handleGetStudentCertificates,
  handleVerifyOffChain,
};
