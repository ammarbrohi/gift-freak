# Reentrancy
We use Checks/Effects/Interactions pattern where possible.

# Integer under/overflows
We use well audited OpenZepplin SafeMath libraries. We also use the OpenZepplin ERC721 library (though not for Integer under/overflows)

# Denial of Service
We use the withdraw pattern (redeem/redeemPaused) to avoid any locked state due to a failed send.

# Mythril
We have used mythril to analyze the contracts:

GiftCertificates contract:
```bash
myth -xa 0x3fa2b6f6b1b0b69d1e5c4d36edd99eeada12c052 --rpc infura-rinkeby
The analysis was completed successfully. No issues were detected.
```

StableToken contract:
```bash
myth -xa 0x36006a85516e7b7d31a69ead689a8763041bec0d --rpc infura-rinkeby
==== Integer Overflow ====
SWC ID: 101
Type: Warning
Contract: 0x36006a85516e7b7d31a69ead689a8763041bec0d
Function name: mint(address,uint256)
PC address: 3714
Estimated Gas Usage: 887 - 982
This binary add operation can result in integer overflow.
--------------------
```
As you can see we get a warning on the StableToken, but as this particular function is purely using the \_mint() function on the OpenZeppelin ERC20 contract (which is SafeMath protected) it is considered a false positive. Also the StableToken contract is for demo purposes only.

StableToken.sol
```solidity
function mint(address to, uint256 value) public returns (bool) {
  _mint(to, value);
  return true;
}
```

ERC20.sol
```solidity
function _mint(address account, uint256 value) internal {
    require(account != address(0));

    _totalSupply = _totalSupply.add(value);
    _balances[account] = _balances[account].add(value);
    //emit Transfer(address(0), account, value);
}
```
SafeMath.sol
```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
}
```
