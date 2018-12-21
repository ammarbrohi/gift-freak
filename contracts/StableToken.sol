pragma solidity ^0.4.24;
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';

/**
 * @title StableToken
 * @dev ERC20 with ability for anyone to mint their own tokens.
 * This is meant as a dummy DAI or other Stable token for testing with our ERC721 token.
 */
contract StableToken is ERC20, ERC20Detailed {

  constructor(string name, string symbol, uint8 decimals) ERC20Detailed(name, symbol, decimals) public {
  }
  /**
  * @dev  function to let anyone mint their own tokens
  * @param to The address that will receive the minted tokens.
  * @param value The amount of tokens to mint.
  * @return A boolean that indicates if the operation was successful.
  */
  function mint(address to, uint256 value) public returns (bool) {
    _mint(to, value);
    return true;
  }
}
