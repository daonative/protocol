import { expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { ethers, network } from 'hardhat'

use(solidity)
use(jestSnapshotPlugin())

const URI = "test"

describe.only('Collection Contract', () => {
  // used to keep track of the Room Contract gas cost
  it('should deploy the collection contract', async () => {
    const [owner] = await ethers.getSigners()
    const Collection = await ethers.getContractFactory('Collection')
    await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)
  })

  it('should create a collection', async () => {
    const name = 'DAONative Membership'
    const symbol = 'DNM'
    const CollectionCreator = await ethers.getContractFactory('CollectionCreator')
    const collectionCreator = await CollectionCreator.deploy()
    await expect(collectionCreator.createCollection(name, symbol, URI, 0)).to.emit(collectionCreator, 'CollectionCreated')
    const [newRoomAddress] = await collectionCreator.getCollections()
    const Collection = await ethers.getContractFactory('Collection')
    const collection = Collection.attach(newRoomAddress)
    expect(await collection.name()).to.equal(name)
    expect(await collection.symbol()).to.equal(symbol)
  })

  it('should mint with a valid invite signature', async () => {
    const [owner] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 0]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)
    await expect(collection.safeMint(inviteCode, 0, signature)).to.emit(collection, 'Transfer')
    expect(await collection.tokenURI(0)).to.equal(URI)
  })

  it('should not mint with an invalid invite signature', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 0]);
    const signature = await someoneElse.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)
    await expect(collection.safeMint(inviteCode, 0, signature)).to.be.revertedWith('Invalid signature')
  })

  it('should not be able to mint two tokens', async () => {
    const [owner] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 0]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)
    await expect(collection.safeMint(inviteCode, 0, signature)).to.emit(collection, 'Transfer')
    await expect(collection.safeMint(inviteCode, 0, signature)).to.be.revertedWith('Recipient already has a token')
  })

  it('should not be able to own two tokens', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 0]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)

    // Mint token 0 for owner
    await expect(collection.connect(owner).safeMint(inviteCode, 0, signature)).to.emit(collection, 'Transfer')

    // Mint token 1 for someoneElse
    await expect(collection.connect(someoneElse).safeMint(inviteCode, 0, signature)).to.emit(collection, 'Transfer')

    // Transfer token 0 to someoneElse
    await expect(collection.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, someoneElse.address, 0)).to.be.revertedWith('Recipient already has a token')
  })

  it('should only allow minting in a set time window', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 0]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))

    // Determine a mint time window (100 seconds after now)
    const lastBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    const mintEndTimestamp = lastBlock.timestamp + 1000

    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, mintEndTimestamp)

    // Check timewindow end
    expect(await collection.getMintEndTimestamp() === mintEndTimestamp)

    // Mint a token
    await expect(collection.safeMint(inviteCode, 0, signature)).to.emit(collection, 'Transfer')

    // Set the next block timestamp to exceed the mint time window
    await network.provider.send("evm_setNextBlockTimestamp", [mintEndTimestamp + 1])
    await network.provider.send("evm_mine")

    // Try to mint a token outside of the time window
    await expect(collection.connect(someoneElse).safeMint(inviteCode, 0, signature)).to.be.revertedWith('Cannot mint outside of time window')
  })

  it.only('should be able to mint within invite code limit', async () => {
    const [owner, someoneElse, stranger] = await ethers.getSigners()
    const inviteCode = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string', 'uint'], [inviteCode, 2]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI, 0)

    // Mint token 0 for owner
    await expect(collection.connect(owner).safeMint(inviteCode, 2, signature)).to.emit(collection, 'Transfer')

    // Mint token 1 for someoneElse
    await expect(collection.connect(someoneElse).safeMint(inviteCode, 2, signature)).to.emit(collection, 'Transfer')

    // Try to mint a third token with the same invite code
    await expect(collection.connect(someoneElse).safeMint(inviteCode, 2, signature)).to.be.revertedWith('Invalid invite code')
  })

})