import { expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { ethers, waffle } from 'hardhat'
import { parseEther } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'

use(solidity)
use(jestSnapshotPlugin())

const data = 'weopuwierpoiewuqwpwioeru'

const fundingAmount = parseEther('2')
const uriLink = 'https://link.co.test'

// used to keep track of the Room Contract gas cost
describe('Room Contract', () => {
  it('should deploy the contract', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    await Room.deploy(owner.address, data)
  })
})

describe('sponsors should be able to create a room', () => {
  it('should create a room', async () => {
    const RoomCreator = await ethers.getContractFactory('RoomCreator')
    const roomCreator = await RoomCreator.deploy()
    await expect(roomCreator.createRoom(data)).to.emit(roomCreator, 'RoomCreated')
    const [newRoomAddress] = await roomCreator.getBounties()
    const Room = await ethers.getContractFactory('Room')
    const room = Room.attach(newRoomAddress)
    expect(await room.getURI()).to.equal(data)
  })
  it('should be able to get existing rooms', async () => {
    const RoomCreator = await ethers.getContractFactory('RoomCreator')
    const roomCreator = await RoomCreator.deploy()
    const roomsBefore = await roomCreator.getBounties()
    expect(roomsBefore.length).to.equal(0)
    await roomCreator.createRoom(data)
    const roomsAfter = await roomCreator.getBounties()
    expect(roomsAfter.length).to.equal(1)
  })

  it('should be able to deposit eth on room', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    await expect(room.deposit({ value: fundingAmount }))
      .to.emit(room, 'Transfer')
      .withArgs(owner.address, room.address, fundingAmount)
    const userBalance = await room.getDeposit()
    expect(userBalance).to.equal(fundingAmount)
    expect(await waffle.provider.getBalance(room.address)).to.equal(fundingAmount)
  })

  it('should be able to get my balance', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    expect(await waffle.provider.getBalance(room.address)).to.equal(parseEther('0'))
    room.deposit({ value: fundingAmount })
    const userBalance = await room.getDeposit()
    expect(userBalance).to.equal(fundingAmount)
  })

  it('should be able to withdraw eth from contract', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    await room.deposit({ value: fundingAmount })
    await expect(room.withdraw(fundingAmount))
      .to.emit(room, 'Transfer')
      .withArgs(room.address, owner.address, fundingAmount)

    expect(await room.getDeposit()).to.be.equal(0)
  })
})
describe('writers should be able to submit an answer', () => {
  it('should be able to submit an article', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    await expect(room.submitAnswer(uriLink)).to.emit(room, 'SubmitAnswer')
  })
  it('should be able to retrieve own answers', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    room.submitAnswer(uriLink)
    const answers = await room.getMyAnswers()
    expect(answers[0]).to.equal(uriLink)
  })
})

describe('sponsors should be able to vote on answers', () => {
  it('should be able to vote on answer', async () => {
    const [roomOwnerSigner, roomWriterSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // response round
    const roomWriter = new ethers.Contract(room.address, Room.interface, roomWriterSigner)
    roomWriter.submitAnswer(uriLink)
    const answers = await roomWriter.getAnswers()

    // voting round
    const votingAmount = parseEther('0.5')
    await expect(room.vote(answers[0].id, votingAmount)).to.emit(room, 'Vote').withArgs(votingAmount, answers[0].id)
    expect(await room.getDeposit()).to.equal(fundingAmount.sub(votingAmount))
    expect(await roomWriter.getDeposit()).to.equal(votingAmount)
  })
})
describe('writers should be able to claim rewards', () => {
  it('should be able to withdraw funds', async () => {
    const [roomOwnerSigner, roomWriterSigner] = await ethers.getSigners()
    // this is for the creator of the coontract
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // this is for a writer
    const roomWriter = new ethers.Contract(room.address, Room.interface, roomWriterSigner)
    roomWriter.submitAnswer(uriLink)
    const answers = await roomWriter.getAnswers()
    await room.vote(answers[0].id, fundingAmount)
    await roomWriter.withdraw(fundingAmount)
  })
})
describe('sponsors should be able to add funds to an existing call for article', async () => {})
