var StableToken = artifacts.require("StableToken")
var GiftCertificate = artifacts.require("GiftCertificate")

contract('GiftCertificate', function(accounts) {

  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]
  const emptyAddress = '0x0000000000000000000000000000000000000000'

  it("TotalSupply of STBL at the start should be 0", async() => {
    const stableToken  = await StableToken.deployed()
    const result = await stableToken.totalSupply()
    assert.equal(result, 0, 'the totalSupply of STBL tokens at the start is not 0')
  })

  it("owner prints some STBL", async() => {

    const stableToken  = await StableToken.deployed()
    const ammount = 100
    const tx = await stableToken.mint(owner, ammount)
    const result = await stableToken.balanceOf.call(owner)
    assert.equal(result, ammount, 'the balanceOf the owner does not match the requested STBL tokens')
    const total = await stableToken.totalSupply.call()
    assert.equal(total, 100, 'the totalSupply of STBL tokens after issuance to owner should be 100')
  })

  it("Alice prints some STBL", async() => {
    const stableToken  = await StableToken.deployed()
    const ammount = 100
    const tx = await stableToken.mint(alice, ammount)
    const result = await stableToken.balanceOf.call(alice)
    assert.equal(result, ammount, 'the balanceOf alice does not match the requested STBL tokens:')
  })

  it("TotalSupply of STBL should be 200", async() => {
    const stableToken  = await StableToken.deployed()
    const result = await stableToken.totalSupply()
    assert.equal(result, 200, 'the totalSupply of STBL tokens after distribution should be 200 : ')
  })

  it("Owner funds GFT with STBL", async() => {
    const stableToken  = await StableToken.deployed()
    const giftCertificate  = await GiftCertificate.deployed()
    const ammount = 100

    const balance_start = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_start, 0, 'the GiftCertificate contract\'s balance before funding should be 0')

    const tx1 = await stableToken.approve(giftCertificate.address, ammount, {from: owner})
    await giftCertificate.fund(ammount, {from: owner})
    const balance_funded = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_funded, ammount, 'the GiftCertificate contract\'s balance after funding should be 100')

  })

  it("Alice buys some GFT", async() => {
    const stableToken  = await StableToken.deployed()
    const ammount = 100

    const giftCertificate  = await GiftCertificate.deployed()
    const result = await giftCertificate.totalSupply()
    assert.equal(result, 0, 'the totalSupply of GFT tokens at the start is not 0')

    const tx3 = await stableToken.approve(giftCertificate.address, ammount, {from: alice})
    const tx4 = await giftCertificate.issue(ammount, {from: alice})
    const stbl_balance_alice = await stableToken.balanceOf(alice)
    assert.equal(stbl_balance_alice, 0, 'alice\'s STBL balance should now be 0.')
    const balance_after_issuance = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_after_issuance.toNumber(), 200, 'the GiftCertificate contract\'s STBL balance after alice buys one GFT for 100 STBL should be 200')
    const gft_total_supply_after_issuance = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply_after_issuance.toNumber(), 1, 'The total supply of GFT should be 1 after issuance.')
  })

  it("Alice spends GFT with Bob", async() => {
    const stableToken  = await StableToken.deployed()
    const giftCertificate  = await GiftCertificate.deployed()
    const id = await giftCertificate.tokenOfOwnerByIndex(alice, 0)
    console.log("ID of Alice's GFT token: "+ id)
    const tx1 = await giftCertificate.approve(bob, id, {from: alice})
    //const tx2 = await giftCertificate.safeTransferFrom(alice, bob, id, {from: bob})
    const tx2 = await giftCertificate.safeTransferFrom(alice, bob, id, {from: alice})
    const gft_balance_alice = await giftCertificate.balanceOf(alice)
    const gft_balance_bob = await giftCertificate.balanceOf(bob)
    assert.equal(gft_balance_alice, 0, 'Alice should not have any GFT anymore.')
    assert.equal(gft_balance_bob, 1, 'Bob should now have 1 GFT.')
  })

  it("Bob redeems GFT", async() => {
    const stableToken  = await StableToken.deployed()
    const giftCertificate  = await GiftCertificate.deployed()

    const id = await giftCertificate.tokenOfOwnerByIndex(bob, 0)
    const tx1 = giftCertificate.redeem(id, {from: bob})
    const gft_total_supply = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply, 0, 'The total supply of GFT should be 0 after redeem.')
    const stbl_balance_bob = await stableToken.balanceOf(bob)
    assert.equal(stbl_balance_bob, 110, 'Bob\'s STBL balance should now be 110.')
    const stbl_balance_gft_contract = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(stbl_balance_gft_contract, 90, 'the GiftCertificate contract\'s STBL balance after Bob redeems the GFT for 110 STBL should be 90')
  })

});
