const hre = require('hardhat')
const ethers = require('ethers')

async function main() {
  const [
    executor,
    proposer,
    voter1,
    voter2,
    voter3,
    voter4,
    voter5,
  ] = await hre.ethers.getSigners()

  // deploy token
  const name = 'DVenture DAO'
  const symbol = 'DV'
  const initialSupply = ethers.utils.parseEther('1000000') // 1 million DV

  const DVToken = await hre.ethers.getContractFactory('DVToken')
  const dvToken = await DVToken.deploy(name, symbol, initialSupply)
  await dvToken.deployed()
  console.log(`DVToken deployed to: ${dvToken.address}`)

  // transfer some tokens to owners
  const amount = ethers.utils.parseEther('1000') // 1000 DV
  const voters = [voter1, voter2, voter3, voter4, voter5]

  for (let i = 0; i < voters.length; i++) {
    await dvToken.transfer(voters[i].address, amount, { from: executor })
    console.log(`${amount} DV transferred to ${voters[i].address}`)
  }

  // deploy timelock
  const minDelay = 0

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

  // deploy treasury
  const ethFunds = ethers.utils.parseEther('25') // 25 ETH

  const Treasury = await hre.ethers.getContractFactory('Treasury')
  const treasury = await Treasury.deploy(executor, { value: ethFunds })
  await treasury.deployed()
  console.log(`Treasury deployed to: ${treasury.address}`)

  await treasury.transferOwnership(timelock.address, { from: executor })

  // assign roles
  const proposerRole = await timelock.PROPOSER_ROLE()
  const executorRole = await timelock.EXECUTOR_ROLE()

  await timelock.grantRole(proposerRole, governance.address, { from: executor })
  await timelock.grantRole(executorRole, governance.address, { from: executor })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
