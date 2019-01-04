var StableToken = artifacts.require("StableToken")

contract('StableToken', function(accounts) {
  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]

  before(async() => {
    stableToken = await StableToken.deployed()
    decimals =  web3.utils.toBN(10).pow(await stableToken.decimals.call())
  })

  it("TotalSupply of STBL at the start should be 0", async() => {
    const result = await stableToken.totalSupply()
    assert.equal(result.toString(), '0', 'the totalSupply of STBL tokens at the start is not 0')
  })

  it("owner prints some STBL", async() => {
    const amount = web3.utils.toBN(100).mul(decimals)
    const tx = await stableToken.mint(owner, amount)
    const result = (await stableToken.balanceOf.call(owner))
    const total = await stableToken.totalSupply.call()
    assert.equal(total.toString(), amount.toString(), 'the totalSupply of STBL tokens after issuance to owner should be 100')
  })

  it("Alice prints some STBL", async() => {
    const amount = web3.utils.toBN(100).mul(decimals)
    const tx = await stableToken.mint(alice, amount, {from: owner})
    const result = await stableToken.balanceOf.call(alice)
    assert.equal(result.toString(), amount.toString(), 'the balanceOf alice does not match the requested STBL tokens:')
  })

  it("TotalSupply of STBL should be 200", async() => {
    const amount = web3.utils.toBN(200).mul(decimals)
    const result = await stableToken.totalSupply.call()
    assert.equal(result.toString(), amount.toString(), 'the totalSupply of STBL tokens after distribution should be 200 : ')
  })

  it("Alice sends owner's STBL to Bob", async() => {
    //this makes sense if you think of Alice as the GiftCertificate contract
    const amount = web3.utils.toBN(100).mul(decimals)
    const zero = web3.utils.toBN(0)
    const balance_start = await stableToken.balanceOf.call(bob)
    assert.equal(balance_start.toString(), '0', 'Bob\'s balance bshould be 0')
    const result = await stableToken.approve(alice, amount, {from: owner})
    await stableToken.transferFrom(owner, bob, amount, {from: alice})
    const balance_owner = await stableToken.balanceOf.call(owner)
    const balance_alice = await stableToken.balanceOf.call(alice)
    const balance_bob = await stableToken.balanceOf.call(bob)
    assert.equal(balance_owner.toString(), zero.toString(), 'the Owner\'s balance should be 0')
    assert.equal(balance_alice.toString(), amount.toString(), 'Alice\'s balance should be 100')
    assert.equal(balance_bob.toString(), amount.toString(), 'Bob\'s balance should be 100')
  })


});
