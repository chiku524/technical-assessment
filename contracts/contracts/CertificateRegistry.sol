// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @notice Issues and verifies student achievement certificates on-chain.
 *         Certificate metadata is stored on IPFS; this contract stores the CID + content hash.
 */
contract CertificateRegistry {
    struct Certificate {
        uint256 studentId;
        bytes32 contentHash;
        string ipfsCid;
        string title;
        address issuer;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(uint256 => bytes32[]) private studentCertificateIds;

    event CertificateIssued(
        bytes32 indexed certificateId,
        uint256 indexed studentId,
        string ipfsCid,
        address indexed issuer
    );
    event CertificateRevoked(bytes32 indexed certificateId, address indexed revokedBy);

    function issueCertificate(
        uint256 studentId,
        bytes32 contentHash,
        string calldata ipfsCid,
        string calldata title
    ) external returns (bytes32 certificateId) {
        require(studentId > 0, "Invalid student id");
        require(contentHash != bytes32(0), "Invalid content hash");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(bytes(title).length > 0, "Title required");

        certificateId = keccak256(
            abi.encodePacked(studentId, contentHash, ipfsCid, msg.sender, block.timestamp)
        );
        require(!certificates[certificateId].exists, "Certificate already exists");

        certificates[certificateId] = Certificate({
            studentId: studentId,
            contentHash: contentHash,
            ipfsCid: ipfsCid,
            title: title,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            exists: true
        });
        studentCertificateIds[studentId].push(certificateId);

        emit CertificateIssued(certificateId, studentId, ipfsCid, msg.sender);
    }

    function verifyCertificate(
        bytes32 certificateId
    )
        external
        view
        returns (
            bool valid,
            uint256 studentId,
            bytes32 contentHash,
            string memory ipfsCid,
            string memory title,
            address issuer,
            uint256 issuedAt,
            bool revoked
        )
    {
        Certificate memory cert = certificates[certificateId];
        require(cert.exists, "Certificate not found");

        return (
            !cert.revoked,
            cert.studentId,
            cert.contentHash,
            cert.ipfsCid,
            cert.title,
            cert.issuer,
            cert.issuedAt,
            cert.revoked
        );
    }

    function getCertificate(bytes32 certificateId) external view returns (Certificate memory) {
        require(certificates[certificateId].exists, "Certificate not found");
        return certificates[certificateId];
    }

    function getStudentCertificates(uint256 studentId) external view returns (bytes32[] memory) {
        return studentCertificateIds[studentId];
    }

    function revokeCertificate(bytes32 certificateId) external {
        Certificate storage cert = certificates[certificateId];
        require(cert.exists, "Certificate not found");
        require(cert.issuer == msg.sender, "Only issuer can revoke");
        require(!cert.revoked, "Already revoked");

        cert.revoked = true;
        emit CertificateRevoked(certificateId, msg.sender);
    }
}
