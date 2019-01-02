pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";

contract ShopRole {
  using Roles for Roles.Role;

  event ShopAdded(address indexed account);
  event ShopRemoved(address indexed account);

  Roles.Role private _shops;

  constructor() internal {
    _addShop(msg.sender);
  }

  modifier onlyShop() {
    require(isShop(msg.sender));
    _;
  }

  function isShop(address account) public view returns (bool) {
    return _shops.has(account);
  }

  function addShop(address account) public onlyShop {
    _addShop(account);
  }

  function renounceShop() public {
    _removeShop(msg.sender);
  }

  function _addShop(address account) internal {
    _shops.add(account);
    emit ShopAdded(account);
  }

  function _removeShop(address account) internal {
    _shops.remove(account);
    emit ShopRemoved(account);
  }
}
