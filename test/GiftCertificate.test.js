var StableToken = artifacts.require("StableToken")
var GiftCertificate = artifacts.require("GiftCertificate")

contract('GiftCertificate', function(accounts) {

  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]
  const emptyAddress = '0x0000000000000000000000000000000000000000'
  var stableToken
  var giftCertificate
  var decimals

  before(async() => {
    stableToken = await StableToken.deployed()
    decimals =  web3.utils.toBN(10).pow(await stableToken.decimals.call())
    giftCertificate  = await GiftCertificate.deployed()
    //console.log(web3.version)
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

  it("Owner funds GFT with STBL", async() => {
    const amount = web3.utils.toBN(100).mul(decimals)
    const balance_start = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_start.toString(), '0', 'the GiftCertificate contract\'s balance before funding should be 0')
    const result = await stableToken.approve(giftCertificate.address, amount, {from: owner})

    await giftCertificate.fund(amount, {from: owner})
    const balance_funded = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_funded.toString(), amount.toString(), 'the GiftCertificate contract\'s balance after funding should be 100')

  })
  it("Alice buys some GFT", async() => {
    //const stableToken  = await StableToken.deployed()
    //const decimals = await stableToken.decimals()
    const amount = web3.utils.toBN(100).mul(decimals)

    //const giftCertificate  = await GiftCertificate.deployed()
    const result = await giftCertificate.totalSupply.call()
    assert.equal(result.toString(), '0', 'the totalSupply of GFT tokens at the start is not 0')

    await stableToken.approve(giftCertificate.address, amount, {from: alice})
    await giftCertificate.issue(amount, {from: alice})
    const stbl_balance_alice = await stableToken.balanceOf(alice)
    assert.equal(stbl_balance_alice.toString(), '0', 'alice\'s STBL balance should now be 0.')
    const balance_after_issuance = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_after_issuance.toString(), (2*amount).toString(), 'the GiftCertificate contract\'s STBL balance after alice buys one GFT for 100 STBL should be 200')
    const gft_total_supply_after_issuance = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply_after_issuance.toString(), '1', 'The total supply of GFT should be 1 after issuance.')
  })

  it("Alice spends GFT with Bob", async() => {
    //const stableToken  = await StableToken.deployed()
    //const giftCertificate  = await GiftCertificate.deployed()
    const id = await giftCertificate.tokenOfOwnerByIndex.call(alice, 0)
    await giftCertificate.approve(bob, id, {from: alice})
    //const tx2 = await giftCertificate.safeTransferFrom(alice, bob, id, {from: bob})
    await giftCertificate.safeTransferFrom(alice, bob, id, {from: alice})
    const gft_balance_alice = await giftCertificate.balanceOf.call(alice)
    const gft_balance_bob = await giftCertificate.balanceOf.call(bob)
    assert.equal(gft_balance_alice.toString(), '0', 'Alice should not have any GFT anymore.')
    assert.equal(gft_balance_bob.toString(), '1', 'Bob should now have 1 GFT.')
  })

  it("Bob redeems GFT", async() => {
    //const stableToken  = await StableToken.deployed()
    //const giftCertificate  = await GiftCertificate.deployed()
    //const decimals = await stableToken.decimals()
    const amount1 = web3.utils.toBN(110).mul(decimals)
    const amount2 = web3.utils.toBN(90).mul(decimals)

    await giftCertificate.addShop(bob, {from: owner})
    const id = await giftCertificate.tokenOfOwnerByIndex.call(bob, 0)
    giftCertificate.redeem(id, {from: bob})
    const gft_total_supply = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply.toString(), '0', 'The total supply of GFT should be 0 after redeem.')
    const stbl_balance_bob = await stableToken.balanceOf(bob)
    assert.equal(stbl_balance_bob.toString(), amount1.toString(), 'Bob\'s STBL balance should now be 110.')
    const stbl_balance_gft_contract = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(stbl_balance_gft_contract.toString(), amount2.toString(), 'the GiftCertificate contract\'s STBL balance after Bob redeems the GFT for 110 STBL should be 90')
  })



});
