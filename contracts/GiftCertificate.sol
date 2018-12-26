pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Pausable.sol';
import 'openzeppelin-solidity/contracts/drafts/Counter.sol';
import './StableToken.sol';

contract GiftCertificate is Ownable, ERC721Full, ERC721Pausable {
  using Counter for Counter.Counter;
  Counter.Counter private tokenId;
  uint256 _rate;
  uint256 _reserved;
  address _stabletoken_addr;
  mapping (uint256 => uint256 ) _values;

  event Fund(
    address from,
    uint256 ammount
  );
  event Issue(
    address to,
    uint256 ammount,
    uint256 ID
  );
  event Redeem(
    uint256 ID,
    address to,
    uint256 ammount
  );

  constructor( string name, string symbol, uint256 rate, address stabletoken_addr) ERC721Full(name, symbol) public {
    require(rate % 10 == 0, 'The bonus percentage must be multiples of 10.');
    _rate = rate;
    _stabletoken_addr = stabletoken_addr;
  }
  /*
  *@dev function to fund the contract for promotion/discount.
  * requires the ERC20 to be approved for this contract at least for the ammount requested
  * @param ammount the user supplied ammount of ERC20 tokens, we only accept multiples of 50.
  */
  function fund(uint256 ammount) onlyOwner public whenNotPaused {
    StableToken st = StableToken(_stabletoken_addr);
    require(ammount <= st.allowance(msg.sender, this), "You did not approve this ammount.");
    st.transferFrom(msg.sender, address(this), ammount);
    emit Fund(msg.sender, ammount);
  }

  /*
  *@dev function to issue a gift certificate.
  * requires the ERC20 to be approved for this contract at least for the ammount requested
  * @param ammount the user supplied ammount of ERC20 tokens, we only accept multiples of 50.
  */
  function issue(uint256 ammount) public whenNotPaused returns (uint256){
    require(ammount != 0, 'Please be reasonable.');
    require(ammount % 10 == 0, 'You must buy in multiples of 10.');
    StableToken st = StableToken(_stabletoken_addr);
    uint256 ID = tokenId.next();
    uint256 balance = st.balanceOf(this);
    uint256 available = balance.sub(_reserved);
    //as both ammount and _rate are multiples of 10 this should always result in an int.
    uint256 bonus = ammount.mul(_rate).div(100);
    require(bonus <= available, "We cannot issue a gift certificate for this value as it would exceed our budget.");
    require(ammount <= st.allowance(msg.sender, this), "You did not approve this ammount.");
    _values[ID] = ammount.add(bonus);
    _reserved = _reserved.add(_values[ID]);
//    assert(_reserved <= st.balanceOf(this));
    super._mint(msg.sender, ID);
    //TODO make it safe for when the approve was not done or balanceOf not suficient.
    //What happens in such a case, would this revert ? I guess it depends on the ERC20 implementation ?
    st.transferFrom(msg.sender, address(this), ammount);
    emit Issue(msg.sender, ammount, ID);
    return ID;
  }

  /*
  *@dev function to redeem a gift certificate.
  * an approved shop can redeem the certificate for the total ammount of ERC20 tokens
  *TODO  add a modifier mechanism to only allow a list of shop(adresses) to redeem the certificates
  */
  function redeem(uint256 ID) public whenNotPaused {
    require(super._exists(ID), "Gift certificate does not exist.");
    require(super._isApprovedOrOwner(msg.sender, ID), "Not authorized to redeem this gift certificate.");
    uint256 value = _values[ID];
    _reserved = _reserved.sub(value);
    super._burn(msg.sender, ID);
    StableToken st = StableToken(_stabletoken_addr);
    st.transfer(msg.sender, value);
    emit Redeem( ID,  msg.sender, value);
  }

}
