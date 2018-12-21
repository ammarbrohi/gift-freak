const StableToken = artifacts.require("./StableToken.sol");
const GiftCertificate = artifacts.require("./GiftCertificate.sol");

module.exports = async function(deployer) {
  await deployer.deploy(GiftCertificate, "GiftCertificate", "GFT", 10, StableToken.address)
  const giftcertificate_addr = await GiftCertificate.deployed()
};
