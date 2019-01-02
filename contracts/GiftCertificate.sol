pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Pausable.sol';
import 'openzeppelin-solidity/contracts/drafts/Counter.sol';

import './StableToken.sol';
import './ShopRole.sol';

contract GiftCertificate is Ownable, ERC721Full, ERC721Pausable, ShopRole {
  using Counter for Counter.Counter;
  Counter.Counter private tokenId;
  uint256 _rate;
  uint256 _reserved;
  address _stabletoken_addr;
  mapping (uint256 => uint256 ) _values;

  event Fund(
    address from,
    uint256 amount
  );
  event Issue(
    address to,
    uint256 amount,
    uint256 ID
  );
  event Redeem(
    uint256 ID,
    address to,
    uint256 amount
  );
  event Refund(
    address to,
    uint256 amount
  );

  constructor( string memory name, string memory symbol, uint256 rate, address stabletoken_addr) ERC721Full(name, symbol) public {
    require(rate % 10 == 0, 'The bonus percentage must be multiples of 10.');
    _rate = rate;
    _stabletoken_addr = stabletoken_addr;
  }
  /*
  *@dev function to fund the contract for promotion/discount.
  * requires the ERC20 to be approved for this contract at least for the amount requested
  * @param amount the user supplied amount of ERC20 tokens, we only accept multiples of 50.
  */
  function fund(uint256 amount) public onlyOwner whenNotPaused {
    StableToken st = StableToken(_stabletoken_addr);
    require(amount <= st.allowance(msg.sender, address(this)), "You did not approve this amount.");
    st.transferFrom(msg.sender, address(this), amount);
    emit Fund(msg.sender, amount);
  }

  /*
  *@dev function to issue a gift certificate.
  * requires the ERC20 to be approved for this contract at least for the amount requested
  * @param amount the user supplied amount of ERC20 tokens, we only accept multiples of 50.
  */
  function issue(uint256 amount) public whenNotPaused returns (uint256){
    require(amount != 0, 'Please be reasonable.');
    require(amount % 10 == 0, 'You must buy in multiples of 10.');
    StableToken st = StableToken(_stabletoken_addr);
    uint256 ID = tokenId.next();
    uint256 balance = st.balanceOf(address(this));
    uint256 available = balance.sub(_reserved);
    //as both amount and _rate are multiples of 10 this should always result in an int.
    uint256 bonus = amount.mul(_rate).div(100);
    require(bonus <= available, "We cannot issue a gift certificate for this value as it would exceed our budget.");
    require(amount <= st.allowance(msg.sender, address(this)), "You did not approve this amount.");
    _values[ID] = amount.add(bonus);
    _reserved = _reserved.add(_values[ID]);
//    assert(_reserved <= st.balanceOf(this));
    super._mint(msg.sender, ID);
    //TODO make it safe for when the approve was not done or balanceOf not suficient.
    //What happens in such a case, would this revert ? I guess it depends on the ERC20 implementation ?
    st.transferFrom(msg.sender, address(this), amount);
    emit Issue(msg.sender, amount, ID);
    return ID;
  }

  /*
  *@dev function to allow a shop to redeem a gift certificate.
  *@param ID the ID of the GFT token to redeem
  * an approved shop can redeem the certificate for the total amount of ERC20 tokens
  */
  function redeem(uint256 ID) public whenNotPaused onlyShop {
    _redeem(ID);
  }


  /*
  *@dev function to allow a customer to redeem a gift certificate when the contract has been paused.
  *@param ID the ID of the GFT token to redeem
  * anyone can redeem their certificate for the total amount of ERC20 tokens
  */
  function redeemPaused(uint256 ID) public whenPaused {
    _redeem(ID);
  }

  /*
  *@dev internal function to redeem a gift certificate.
  *@param ID the ID of the GFT token to redeem
  */
  function _redeem(uint256 ID) internal {
    require(super._exists(ID), "Gift certificate does not exist.");
    require(super._isApprovedOrOwner(msg.sender, ID), "Not authorized to redeem this gift certificate.");
    uint256 value = _values[ID];
    _reserved = _reserved.sub(value);
    super._burn(msg.sender, ID);
    StableToken st = StableToken(_stabletoken_addr);
    st.transfer(msg.sender, value);
    emit Redeem( ID,  msg.sender, value);
  }

  /*
  *@dev function to allow the owner to return all the unused STBL tokens when the contract is Paused and all GFT tokens have been redeemed
  */
  function refund() public whenPaused onlyOwner{
    require(_reserved == 0, 'A part of the STBL tokens are still reserved.');
    uint256 total_supply = super.totalSupply();
    require(total_supply == 0, 'There are still GFT tokens that are not redeemed.');
    StableToken st = StableToken(_stabletoken_addr);
    uint256 stbl_balance = st.balanceOf(address(this));
    st.transfer(msg.sender, stbl_balance);
    emit Refund(msg.sender, stbl_balance);
  }

}
