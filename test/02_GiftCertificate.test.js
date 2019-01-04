var StableToken = artifacts.require("StableToken")
var GiftCertificate = artifacts.require("GiftCertificate")

contract('GiftCertificate', function(accounts) {

  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]
  var amount80
  var amount90
  var amount100
  var amount110
  var amount200
  var stableToken
  var giftCertificate
  var decimals

  before(async() => {
    stableToken = await StableToken.deployed()
    decimals =  web3.utils.toBN(10).pow(await stableToken.decimals.call())
    //reusable BN representation of some numbers we use in the tests.
    //Note that decimals is set during deployment of STBl contract, so we need to get it from the STBL contract
    amount80 = web3.utils.toBN(80).mul(decimals)
    amount90 = web3.utils.toBN(90).mul(decimals)
    amount100 = web3.utils.toBN(100).mul(decimals)
    amount110 = web3.utils.toBN(110).mul(decimals)
    amount200 = web3.utils.toBN(200).mul(decimals)
    giftCertificate  = await GiftCertificate.deployed()
  })

  it("print some STBL fior participants", async() => {
    //onwer and Alice need some STBL to be able to fund and buy
    const result = await stableToken.totalSupply()
    assert.equal(result.toString(), '0', 'the totalSupply of STBL tokens at the start is not 0')
    //owner gets 100 STBL
    const tx1 = await stableToken.mint(owner, amount100, {from: owner})
    const result1 = (await stableToken.balanceOf.call(owner))
    //assert apparently cannot handle BN type so we need to convert to string to be able to compare.
    assert.equal(result1.toString(), amount100.toString(), 'the balanceOf owner does not match the requested STBL tokens:')
    //Alice gets 100 STBL
    const tx2 = await stableToken.mint(alice, amount100, {from: alice})
    const result2 = await stableToken.balanceOf.call(alice)
    assert.equal(result2.toString(), amount100.toString(), 'the balanceOf alice does not match the requested STBL tokens:')
    //check STBL totalSupply
    const total = await stableToken.totalSupply.call()
    assert.equal(total.toString(), amount200.toString(), 'the totalSupply of STBL tokens after distribution should be 200 : ')
  })

  it("Owner funds GFT with STBL", async() => {
    //GFT contract's STBl balance should be 0 at start
    const balance_start = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_start.toString(), '0', 'the GiftCertificate contract\'s balance before funding should be 0')
    //then owner sned STBL to GFT contract (approve/transferFrom approach)
    const result = await stableToken.approve(giftCertificate.address, amount100, {from: owner})
    await giftCertificate.fund(amount100, {from: owner})
    //and check the STBl balance
    const balance_funded = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_funded.toString(), amount100.toString(), 'the GiftCertificate contract\'s balance after funding should be 100')

  })
  it("Alice buys some GFT", async() => {
    //check GFT total supply at start is O
    const result = await giftCertificate.totalSupply.call()
    assert.equal(result.toString(), '0', 'the totalSupply of GFT tokens at the start is not 0')
    //buy a GFT (approve/transferFrom approach)
    await stableToken.approve(giftCertificate.address, amount100, {from: alice})
    await giftCertificate.issue(amount100, {from: alice})
    //and check the STBL and GFT balances
    const stbl_balance_alice = await stableToken.balanceOf.call(alice)
    assert.equal(stbl_balance_alice.toString(), '0', 'Alice\'s STBL balance should now be 0.')
    const gft_balance_alice = await giftCertificate.balanceOf.call(alice)
    assert.equal(gft_balance_alice.toString(), '1', 'Alice\'s GFT balance should now be 1.')
    const balance_after_issuance = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(balance_after_issuance.toString(), (amount200).toString(), 'the GiftCertificate contract\'s STBL balance after alice buys one GFT for 100 STBL should be 200')
    const gft_total_supply_after_issuance = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply_after_issuance.toString(), '1', 'The total supply of GFT should be 1 after issuance.')
  })

  it("Alice spends GFT with Bob", async() => {
    //first get Alice's GFT id
    const id = await giftCertificate.tokenOfOwnerByIndex.call(alice, 0)
    //then send it to Bob (approve/transferFrom approach)
    await giftCertificate.approve(bob, id, {from: alice})
    await giftCertificate.safeTransferFrom(alice, bob, id, {from: alice})
    //and check the GFT balances
    const gft_balance_alice = await giftCertificate.balanceOf.call(alice)
    const gft_balance_bob = await giftCertificate.balanceOf.call(bob)
    assert.equal(gft_balance_alice.toString(), '0', 'Alice should not have any GFT anymore.')
    assert.equal(gft_balance_bob.toString(), '1', 'Bob should now have 1 GFT.')
  })

  it("Bob redeems GFT", async() => {
    //first the owner adds Bob as a shop to be able to redeem (when the GFT contract is NOT paused)
    await giftCertificate.addShop(bob, {from: owner})
    //get Bob's GFT id
    const id = await giftCertificate.tokenOfOwnerByIndex.call(bob, 0)
    //redeem it
    giftCertificate.redeem(id, {from: bob})
    //and check the STBl balances
    const gft_total_supply = await giftCertificate.totalSupply.call()
    assert.equal(gft_total_supply.toString(), '0', 'The total supply of GFT should be 0 after redeem.')
    const stbl_balance_bob = await stableToken.balanceOf.call(bob)
    assert.equal(stbl_balance_bob.toString(), amount110.toString(), 'Bob\'s STBL balance should now be 110.')
    const stbl_balance_gft_contract = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(stbl_balance_gft_contract.toString(), amount90.toString(), 'the GiftCertificate contract\'s STBL balance after Bob redeems the GFT for 110 STBL should be 90')
  })

  it("Pause contract and redeem", async() => {
    //at this state the GFT contract has 90 STBL and Bob has 110 STBL

    //At the beginning the GFT contract should not be pauses
    const state = await giftCertificate.paused.call()
    assert.equal(state, false, 'the GiftCertificate contract should not be paused at the start.')
    const stbl_balance_gft = await stableToken.balanceOf.call(giftCertificate.address)

    //Alice gets 100 STBL
    //console.log('\tAlice gets 100 STBL')
    const tx1 = await stableToken.mint(alice, amount100, {from: alice})
    const result1 = (await stableToken.balanceOf.call(alice))
    assert.equal(result1.toString(), amount100.toString(), 'the balanceOf Alice should be 100')

    //Alice buys a GFT for 100 STBL
    //console.log('\tAlice buys a GFT for 100 STBL')
    await stableToken.approve(giftCertificate.address, amount100, {from: alice})
    await giftCertificate.issue(amount100, {from: alice})
    const stbl_balance_alice = await stableToken.balanceOf.call(alice)
    assert.equal(stbl_balance_alice.toString(), '0', 'alice\'s STBL balance should now be 0.')
    const stbl_balance_gft_2 = await stableToken.balanceOf.call(giftCertificate.address)
    assert.equal(stbl_balance_gft_2.toString(), stbl_balance_gft.add(amount100).toString(), 'the GiftCertificate contract\'s STBL balance after Alice buys a GFT for 100 STBL should be 100 higher')

    //Owner pauses GFT contract
    //console.log('\tOwner pauses GFT contract')
    await giftCertificate.pause({from: owner})
    const state2 = await giftCertificate.paused.call()
    assert.equal(state2, true, 'the GiftCertificate contract should be paused.')
    //const stbl_balance_gft_3 = await stableToken.balanceOf.call(giftCertificate.address)

    //Alice should be able to withdraw 110 STBL
    //console.log('\tAlice should be able to withdraw 110 STBL')
    const ID = await giftCertificate.tokenOfOwnerByIndex(alice, 0)
    await giftCertificate.redeemPaused(ID, {from: alice})
    const stbl_balance_alice2 = await stableToken.balanceOf.call(alice)
    assert.equal(stbl_balance_alice2.toString(), stbl_balance_alice.add(amount110).toString(), 'the GiftCertificate contract\'s STBL balance after Alice redeems should be 110 lower')

    //owner should be able to retrieve the remaining funds
    //console.log('\towner should be able to retrieve the remaining funds')
    const stbl_balance_owner_before = await stableToken.balanceOf.call(owner)
    await giftCertificate.refund({from: owner})
    const stbl_balance_owner_after = await stableToken.balanceOf.call(owner)
    assert.equal(stbl_balance_owner_after.toString(), stbl_balance_owner_before.add(amount80).toString(), 'the GiftCertificate contract\'s STBL balance after Alice redeems should be 110 lower')

    //GFT contract's STBL balance should be 0 in the end
    //console.log('\tGFT contract\'s STBL balance should be 0 in the end')
    const total = await giftCertificate.totalSupply.call()
    assert.equal(total.toString(), '0', 'there should not be any GiftCertificate tokens.')
  })



});
