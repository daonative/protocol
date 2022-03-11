import { expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { ethers, waffle } from 'hardhat'
import { parseEther } from '@ethersproject/units'

use(solidity)
use(jestSnapshotPlugin())

const URI = "test"

describe.only('Collection Contract', () => {
  // used to keep track of the Room Contract gas cost
  it('should deploy the collection contract', async () => {
    const [owner] = await ethers.getSigners()
    const Collection = await ethers.getContractFactory('Collection')
    await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI)
  })

  it('should create a collection', async () => {
    const name = 'DAONative Membership'
    const symbol = 'DNM'
    const CollectionCreator = await ethers.getContractFactory('CollectionCreator')
    const collectionCreator = await CollectionCreator.deploy()
    await expect(collectionCreator.createCollection(name, symbol, URI)).to.emit(collectionCreator, 'CollectionCreated')
    const [newRoomAddress] = await collectionCreator.getCollections()
    const Collection = await ethers.getContractFactory('Collection')
    const collection = Collection.attach(newRoomAddress)
    expect(await collection.name()).to.equal(name)
    expect(await collection.symbol()).to.equal(symbol)
  })

  it('should mint with a valid invite signature', async () => {
    const [owner] = await ethers.getSigners()
    const message = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string'], [message]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI)
    await expect(collection.safeMint(messageHash, signature)).to.emit(collection, 'Transfer')
    expect(await collection.tokenURI(0)).to.equal(URI)
  })

  it('should not mint with an invalid invite signature', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const message = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string'], [message]);
    const signature = await someoneElse.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI)
    await expect(collection.safeMint(messageHash, signature)).to.be.revertedWith('Invalid signature')
  })

  it('should not be able to mint two tokens', async () => {
    const [owner] = await ethers.getSigners()
    const message = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string'], [message]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI)
    await expect(collection.safeMint(messageHash, signature)).to.emit(collection, 'Transfer')
    await expect(collection.safeMint(messageHash, signature)).to.be.revertedWith('Recipient already has a token')
  })

  it('should not be able to mint two tokens', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const message = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string'], [message]);
    const signature = await owner.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAOnative Membership', 'DNM', URI)

    // Mint token 0 for owner
    await expect(collection.connect(owner).safeMint(messageHash, signature)).to.emit(collection, 'Transfer')

    // Mint token 1 for someoneElse
    await expect(collection.connect(someoneElse).safeMint(messageHash, signature)).to.emit(collection, 'Transfer')

    // Transfer token 0 to someoneElse
    await expect(collection.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, someoneElse.address, 0)).to.be.revertedWith('Recipient already has a token')
  })
})