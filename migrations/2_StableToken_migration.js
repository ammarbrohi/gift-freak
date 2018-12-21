const StableToken = artifacts.require("./StableToken.sol");

module.exports = async function(deployer) {
  await deployer.deploy(StableToken, "StableToken", "STBL", 18)
  const stabletoken_addr = await StableToken.deployed()
};
