// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract DVToken is ERC20Votes {
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply
  ) ERC20(_name, _symbol) ERC20Permit(_name) {
    _mint(msg.sender, _initialSupply);
  }

  function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address account, uint256 amount) internal override(ERC20Votes) {
    super._mint(account, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20Votes) {
    super._burn(account, amount);
  }
}
