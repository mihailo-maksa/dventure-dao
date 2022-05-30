const hre = require('hardhat')
const ethers = require('ethers')
const { expect } = require('chai')

describe("create, propose, execute",  async () => {
  const [
    executor,
    proposer,
    voter1,
    voter2,
    voter3,
    voter4,
    voter5,
  ] = await hre.ethers.getSigners()

  let isReleased, funds, blockNumber, proposalState, vote

  const amount = ethers.utils.parseEther("5") // 5 ETH
  const initialSupply = ethers.utils.parseEther('1000000') // 1 million DV

  // deploy token
  const DVToken = await hre.ethers.getContractFactory('DVToken')
  const dvToken = await DVToken.deploy("DVenture DAO", "DV", initialSupply)
  await dvToken.deployed()
  console.log(`DVToken deployed to: ${dvToken.address}`)

  // transfer some tokens to owners
  const voters = [voter1, voter2, voter3, voter4, voter5]
  for (let i = 0; i < voters.length; i++) {
    await dvToken.transfer(voters[i].address, amount, { from: executor })
    console.log(`${amount} DV transferred to ${voters[i].address}`)
  }

  // delegate tokens to proposer
  for (let i = 0; i < voters.length; i++) {
    await token.delegate(voters[i], { from: voters[i] })
  }

  // deploy treasury
  const ethFunds = ethers.utils.parseEther('25') // 25 ETH
  const Treasury = await hre.ethers.getContractFactory('Treasury')
  const treasury = await Treasury.deploy(dvToken.address, executor, ethFunds)
  await treasury.deployed()
  console.log(`Treasury deployed to: ${treasury.address}`)

  isReleased = await treasury.isReleased()
  expect(isReleased).to.be.false
  console.log(`isReleased? ${isReleased}`)

  funds = await hre.ethers.getBalance(treasury.address)
  expect(funds).to.be.equal(ethers.utils.parseEther('25'))
  console.log(`Funds inside of treasury: ${ethers.utils.formatEther(funds.toString())} ETH\n`)

  // deploy timelock
  const minDelay = 0 // for dev prurposes only - make it greater than 0 for production
  
  const Timelock = await hre.ethers.getContractFactory('Timelock')
  const timelock = await Timelock.deploy(minDelay, [proposer], [executor])
  await timelock.deployed()
  console.log(`Timelock deployed to: ${timelock.address}`)

  // deploy governance
  const quorum = 5 // Percentage of total supply of tokens needed to aprove proposals (5%)
  const votingDelay = 0 // How many blocks after proposal until voting becomes active
  const votingPeriod = 5 // How many blocks to allow voters to vote

  const Governance = await hre.ethers.getContractFactory('Governance')
  const governance = await Governance.deploy(
    dvToken.address,
    timelock.address,
    quorum,
    votingDelay,
    votingPeriod,
  ) 
  await governance.deployed()
  console.log(`Governance deployed to: ${governance.address}`)

  const encodedFunction = ''
  const description = "Proposal #1: Release Funds from Treasury to Invest in Startups in the web3 Ecosystem"

  const tx = await governance.propose([treasury.address], [0], [encodedFunction], description, { from: proposer })
  const proposalId = tx.logs[0].args.proposalId
  console.log(`Proposal #${proposalId.toString()} created\n`)

  proposalState = await governance.state(proposalId)
  console.log(`Proposal #${proposalId.toString()} state: ${proposalState}`)

  const snapshot = await governance.proposalSnapshot(proposalId)
  console.log(`Proposal #${proposalId.toString()} created on block: ${snapshot.toString()}\n`)

  const deadline = await governance.proposalDeadline(proposalId)
  console.log(`Proposal #${proposalId.toString()} deadline on block: ${deadline.toString()}\n`)

  blockNumber = await hre.ethers.getBlockNumber()
  console.log(`Current block number: ${blockNumber.toString()}\n`)

  quorum = await governance.quorum(blockNumber - 1)
  console.log(`Quorum of votes required to pass: ${ethers.utils.formatEther(quorum.toString())}\n`)

  // Vote
  console.log(`Casting votes...\n`)

  // 0 = Against, 1 = For, 2 = Abstain
  vote = await governance.castVote(proposalId, 1, { from: voter1 })
  vote = await governance.castVote(proposalId, 1, { from: voter2 })
  vote = await governance.castVote(proposalId, 1, { from: voter3 })
  vote = await governance.castVote(proposalId, 0, { from: voter4 })
  vote = await governance.castVote(proposalId, 2, { from: voter5 })

  // States: Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed
  proposalState = await governance.state(proposalId)
  expect(proposalState.toString()).to.equal('1') // Active
  console.log(`Proposal #${proposalId.toString()} state: ${proposalState.toString()}`)

  // Arbitrary transfer to fast forward one block after the voting period (5 blocks) ends
  await dvToken.transfer(proposer, amount, { from: executor })

  // Vote results
  const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId) 
  console.log(`Votes For: ${forVotes.toString()}\n`)
  console.log(`Votes Against: ${againstVotes.toString()}\n`)
  console.log(`Neutral Votes: ${abstainVotes.toString()}\n`)

  blockNumber = await ethers.getBlockNumber()
  console.log(`Current block number: ${blockNumber.toString()}\n`)

  proposalState = await governance.state(proposalId)
  expect(proposalState.toString()).to.equal('4') // Succeeded
  console.log(`Proposal #${proposalId.toString()} state: ${proposalState.toString()}\n`) 

  // Queue
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
  await governance.queue([treasury.address], [0], [encodedFunction], hash, { from: executor })

  proposalState = await governance.state(proposalId)
  expect(proposalState.toString()).to.equal('5') // Queued
  console.log(`Proposal #${proposalId.toString()} state: ${proposalState.toString()}\n`)

  // Execute
  await governance.execute([treasury.address], [0], [encodedFunction], hash, { from: executor })

  proposalState = await governance.state(proposalId)
  expect(proposalState.toString()).to.equal('7') // Executed
  console.log(`Proposal #${proposalId.toString()} state: ${proposalState.toString()}\n`)

  isReleased = await treasury.isReleased()
  expect(isReleased).to.be.true
  console.log(`isReleased? ${isReleased}`)

  funds = await hre.ethers.getBalance(treasury.address)
  expect(funds).to.be.equal(ethers.utils.parseEther('0'))
  console.log(`Funds inside of treasury: ${ethers.utils.formatEther(funds.toString())} ETH\n`)
})
