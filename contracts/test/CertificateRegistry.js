const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  it("issues and verifies a certificate", async function () {
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const [issuer] = await ethers.getSigners();
    const contentHash = ethers.id("sample-metadata");
    const tx = await registry.issueCertificate(42, contentHash, "bafySampleCid", "Honor Roll");
    const receipt = await tx.wait();

    const event = receipt.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "CertificateIssued");

    expect(event).to.not.equal(undefined);
    const certificateId = event.args.certificateId;

    const result = await registry.verifyCertificate(certificateId);
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(42n);
    expect(result[4]).to.equal("Honor Roll");
    expect(result[5]).to.equal(issuer.address);
  });
});
