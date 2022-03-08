import { expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { ethers, waffle } from 'hardhat'
import { parseEther } from '@ethersproject/units'

use(solidity)
use(jestSnapshotPlugin())

const data = 'weopuwierpoiewuqwpwioeru'

const fundingAmount = parseEther('2')
const uriLink = 'https://link.co.test'

const proposalAmountRequested = parseEther('0.1')

describe.only('Collection Contract', () => {
  // used to keep track of the Room Contract gas cost
  it('should deploy the collection contract', async () => {
    const [owner] = await ethers.getSigners()
    const Collection = await ethers.getContractFactory('Collection')
    await Collection.deploy(owner.address, 'DAONative Membership', 'DNM')
  })

  it('should create a collection', async () => {
    const name = 'DAONative Membership'
    const symbol = 'DNM'
    const CollectionCreator = await ethers.getContractFactory('CollectionCreator')
    const collectionCreator = await CollectionCreator.deploy()
    await expect(collectionCreator.createCollection(name, symbol)).to.emit(collectionCreator, 'CollectionCreated')
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
    const collection = await Collection.deploy(owner.address, 'DAONative Membership', 'DNM')
    await expect(collection.safeMint(messageHash, signature)).to.emit(collection, 'Transfer')
  })

  it.only('should not mint with an invalid invite signature', async () => {
    const [owner, someoneElse] = await ethers.getSigners()
    const message = "invite-code"
    const messageHash = ethers.utils.solidityKeccak256(['string'], [message]);
    const signature = await someoneElse.signMessage(ethers.utils.arrayify(messageHash))
    const Collection = await ethers.getContractFactory('Collection')
    const collection = await Collection.deploy(owner.address, 'DAONative Membership', 'DNM')
    await expect(collection.safeMint(messageHash, signature)).to.be.revertedWith('Invalid signature')
  })
})