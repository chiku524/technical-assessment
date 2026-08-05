const { processDBRequest } = require("../../utils");

const insertCertificate = async (payload) => {
  const query = `
    INSERT INTO certificates (
      student_id,
      title,
      description,
      achievement_date,
      ipfs_cid,
      content_hash,
      on_chain_id,
      tx_hash,
      issuer_address,
      issued_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id,
      student_id AS "studentId",
      title,
      description,
      achievement_date AS "achievementDate",
      ipfs_cid AS "ipfsCid",
      content_hash AS "contentHash",
      on_chain_id AS "onChainId",
      tx_hash AS "txHash",
      issuer_address AS "issuerAddress",
      issued_by AS "issuedBy",
      revoked,
      created_dt AS "createdAt"
  `;
  const queryParams = [
    payload.studentId,
    payload.title,
    payload.description,
    payload.achievementDate,
    payload.ipfsCid,
    payload.contentHash,
    payload.onChainId,
    payload.txHash,
    payload.issuerAddress,
    payload.issuedBy,
  ];
  const { rows } = await processDBRequest({ query, queryParams });
  return rows[0];
};

const findCertificateById = async (id) => {
  const query = `
    SELECT
      c.id,
      c.student_id AS "studentId",
      u.name AS "studentName",
      c.title,
      c.description,
      c.achievement_date AS "achievementDate",
      c.ipfs_cid AS "ipfsCid",
      c.content_hash AS "contentHash",
      c.on_chain_id AS "onChainId",
      c.tx_hash AS "txHash",
      c.issuer_address AS "issuerAddress",
      c.issued_by AS "issuedBy",
      c.revoked,
      c.created_dt AS "createdAt"
    FROM certificates c
    LEFT JOIN users u ON u.id = c.student_id
    WHERE c.id = $1
  `;
  const { rows } = await processDBRequest({ query, queryParams: [id] });
  return rows[0];
};

const findCertificateByOnChainId = async (onChainId) => {
  const query = `
    SELECT
      c.id,
      c.student_id AS "studentId",
      u.name AS "studentName",
      c.title,
      c.description,
      c.achievement_date AS "achievementDate",
      c.ipfs_cid AS "ipfsCid",
      c.content_hash AS "contentHash",
      c.on_chain_id AS "onChainId",
      c.tx_hash AS "txHash",
      c.issuer_address AS "issuerAddress",
      c.issued_by AS "issuedBy",
      c.revoked,
      c.created_dt AS "createdAt"
    FROM certificates c
    LEFT JOIN users u ON u.id = c.student_id
    WHERE c.on_chain_id = $1
  `;
  const { rows } = await processDBRequest({ query, queryParams: [onChainId] });
  return rows[0];
};

const findCertificatesByStudent = async (studentId) => {
  const query = `
    SELECT
      c.id,
      c.student_id AS "studentId",
      c.title,
      c.description,
      c.achievement_date AS "achievementDate",
      c.ipfs_cid AS "ipfsCid",
      c.content_hash AS "contentHash",
      c.on_chain_id AS "onChainId",
      c.tx_hash AS "txHash",
      c.issuer_address AS "issuerAddress",
      c.issued_by AS "issuedBy",
      c.revoked,
      c.created_dt AS "createdAt"
    FROM certificates c
    WHERE c.student_id = $1
    ORDER BY c.created_dt DESC
  `;
  const { rows } = await processDBRequest({ query, queryParams: [studentId] });
  return rows;
};

module.exports = {
  insertCertificate,
  findCertificateById,
  findCertificateByOnChainId,
  findCertificatesByStudent,
};
