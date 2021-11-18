const ethers = require('hardhat').ethers

async function main() {
  // We get the contract to deploy
  const RoomCreator = await ethers.getContractFactory('RoomCreator')
  const roomCreator = await RoomCreator.deploy()

  console.log('RoomCreator deployed to:', roomCreator.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
