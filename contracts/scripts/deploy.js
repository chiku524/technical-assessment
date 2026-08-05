const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CertificateRegistry deployed to:", address);

  const deployment = {
    network: hre.network.name,
    address,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${hre.network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );

  // Copy ABI for frontend consumption
  const artifact = await hre.artifacts.readArtifact("CertificateRegistry");
  const frontendAbiDir = path.join(__dirname, "..", "..", "frontend", "src", "domains", "certificate", "abi");
  fs.mkdirSync(frontendAbiDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendAbiDir, "CertificateRegistry.json"),
    JSON.stringify({ address, abi: artifact.abi }, null, 2)
  );

  console.log("Deployment info and ABI written for frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
