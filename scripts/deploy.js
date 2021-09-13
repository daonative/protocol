const ethers = require('hardhat').ethers

async function main() {
  // We get the contract to deploy
  const BountyCreator = await ethers.getContractFactory('BountyCreator')
  const bountyCreator = await BountyCreator.deploy()

  console.log('BountyCreator deployed to:', bountyCreator.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
