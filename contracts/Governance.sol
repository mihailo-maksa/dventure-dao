// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract Governance is 
  Governor, 
  GovernorCountingSimple,
  GovernorVotes,
  GovernorVotesQuorumFraction,
  GovernorTimelockControl
{
  uint256 public votingDelay_;
  uint256 public votingPeriod_;

  constructor(
    ERC20Votes _token,
    TimelockController _timelock,
    uint256 _quorum,
    uint256 _votingDelay,
    uint256 _votingPeriod
  )
  Governor("DVenture DAO")
  GovernorVotes(_token)
  GovernorVotesQuorumFraction(_quorum)
  GovernorTimelockControl(_timelock) 
  {
    votingDelay_ = _votingDelay;
    votingPeriod_ = _votingPeriod;
  }

  function votingDelay() public view override returns (uint256) {
    return votingDelay_;
  }

  function votingPeriod() public view override returns (uint256) {
    return votingPeriod_;
  }

  function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    super.quorum(blockNumber);
  }

  function getVotes(address account, uint256 blockNumber) public view override(IGovernor, Governor) returns (uint256) {
    super.getVotes(account, blockNumber);
  }

  function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
    super.state(proposalId);
  }

  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public override(Governor, IGovernor) returns(uint256) {
    super.propose(targets, values, calldatas, description);
  }

  function _execute(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) {
    return super._execute(proposalId, targets, values, calldatas, descriptionHash);
  }

  function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
    return super._cancel(targets, values, calldatas, descriptionHash);
  }

  function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
    return super._executor();
  }

  function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl) returns (bool) {
    super.supportsInterface(interfaceId);
  }
}
