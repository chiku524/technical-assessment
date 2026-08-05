const express = require("express");
const router = express.Router();
const certificateController = require("./certificates-controller");

router.post("/ipfs", certificateController.handleUploadMetadata);
router.get("/ipfs/:cid", certificateController.handleGetMetadata);
router.get("/verify/:certificateId", certificateController.handleVerifyOffChain);
router.get("/student/:studentId", certificateController.handleGetStudentCertificates);
router.post("/", certificateController.handleRecordCertificate);
router.get("/:id", certificateController.handleGetCertificate);

module.exports = { certificatesRoutes: router };
