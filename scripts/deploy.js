const ethers = require('hardhat').ethers

async function main() {
  // We get the contract to deploy
  const MyToken = await ethers.getContractFactory('MyToken')
  const myToken = await MyToken.deploy()

  console.log('My Token deployed to:', myToken.address)

  const FarmToken = await ethers.getContractFactory('FarmToken')
  const farmToken = await FarmToken.deploy(myToken.address)
  console.log('Farm Token deployed to:', farmToken.address)

  const MyNFT = await ethers.getContractFactory('MyNFT')
  const myNFT = await MyNFT.deploy()
  console.log('NFT Contract deployed at', myNFT.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
