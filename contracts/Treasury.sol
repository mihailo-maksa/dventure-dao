// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract Treasury is Ownable {
  uint256 public totalFunds;
  address public payee;
  bool public isReleased;

  constructor(address _payee) payable {
    totalFunds = msg.value;
    payee = _payee;
    isReleased = false;
  }

  receive() external payable {}

  function releaseFunds() public onlyOwner {
    require(!isReleased, "Treasury: funds are already released");
    isReleased = true;

    (bool sent, ) = payee.call{value: totalFunds}("");
    require(sent, "Treasury: failed to send funds to payee");
  }
}
