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

// used to keep track of the Room Contract gas cost
describe('Room Contract', () => {
  it('should deploy the contract', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    await Room.deploy(owner.address, data)
  })
})

describe('Contract creator should be able to withdraw all funds', () => {
  it('should only allow the creator to make emergency withdrawals', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    await expect(room.emergencyWithdrawal()).to.emit(room, 'Transfer')
  })
})
describe('sponsors should be able to create a room', () => {
  it('should create a room', async () => {
    const RoomCreator = await ethers.getContractFactory('RoomCreator')
    const roomCreator = await RoomCreator.deploy()
    await expect(roomCreator.createRoom(data)).to.emit(roomCreator, 'RoomCreated')
    const [newRoomAddress] = await roomCreator.getRooms()
    const Room = await ethers.getContractFactory('Room')
    const room = Room.attach(newRoomAddress)
    expect(await room.getURI()).to.equal(data)
  })
  it('should be able to get existing rooms', async () => {
    const RoomCreator = await ethers.getContractFactory('RoomCreator')
    const roomCreator = await RoomCreator.deploy()
    const roomsBefore = await roomCreator.getRooms()
    expect(roomsBefore.length).to.equal(0)
    await roomCreator.createRoom(data)
    const roomsAfter = await roomCreator.getRooms()
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
describe('contributors should be able to submit a proposal', () => {
  it('should be able to submit a proposal', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    await expect(room.submitProposal(uriLink, proposalAmountRequested)).to.emit(room, 'SubmitProposal')
  })
  it('should be able to retrieve own proposals', async () => {
    const [owner] = await ethers.getSigners()
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(owner.address, data)
    room.submitProposal(uriLink, proposalAmountRequested)
    const proposals = await room.getMyProposals()
    expect(proposals[0].length).greaterThanOrEqual(1)
  })
})

describe('sponsors should be able to approve proposals', () => {
  it('should be possible for the creator of the room mark the task as delivered', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // submission round
    const roomContributor = new ethers.Contract(room.address, Room.interface, roomContributorSigner)
    roomContributor.submitProposal(uriLink, proposalAmountRequested)
    const proposalList = await roomContributor.getMyProposals()
    const proposalBefore = await roomContributor.getProposal(proposalList[0])

    // approval round
    expect(await proposalBefore.state).to.be.eq(0)
    await room.approveProposal(proposalBefore.id)
    await roomContributor.getProposal(proposalList[0])

    // closing round
    expect(await proposalBefore.state).to.be.eq(0)
    await room.closeProposal(proposalBefore.id)
    const proposalAfter = await roomContributor.getProposal(proposalList[0])

    expect(await proposalAfter.state).to.be.eq(2)
  })
  it('should be able to transition from pending to rejected', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // submission
    const roomContributor = new ethers.Contract(room.address, Room.interface, roomContributorSigner)
    roomContributor.submitProposal(uriLink, proposalAmountRequested)
    const proposalList = await roomContributor.getMyProposals()
    const proposalBefore = await roomContributor.getProposal(proposalList[0])

    // rejection
    expect(await proposalBefore.state).to.be.eq(0)
    await room.rejectProposal(proposalBefore.id)
    const proposalAfter = await roomContributor.getProposal(proposalList[0])
    expect(await proposalAfter.state).to.be.eq(3)
  })
  it('should be able to transition from pending to approved', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // submission round
    const roomContributor = new ethers.Contract(room.address, Room.interface, roomContributorSigner)
    roomContributor.submitProposal(uriLink, proposalAmountRequested)
    const proposalList = await roomContributor.getMyProposals()
    const proposalBefore = await roomContributor.getProposal(proposalList[0])

    // approval round
    expect(await proposalBefore.state).to.be.eq(0)
    await room.approveProposal(proposalBefore.id)
    const proposalAfter = await roomContributor.getProposal(proposalList[0])
    expect(await proposalAfter.state).to.be.eq(1)
  })

  it('should be able to approve a proposal', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // funding round
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // submission round
    const roomContributor = new ethers.Contract(room.address, Room.interface, roomContributorSigner)
    roomContributor.submitProposal(uriLink, proposalAmountRequested)
    const proposals = await roomContributor.getProposals()

    // approval round
    await expect(room.approveProposal(proposals[0]))
      .to.emit(room, 'Approve')
      .withArgs(proposalAmountRequested, proposals[0])
    expect(await room.getDeposit()).to.equal(fundingAmount.sub(proposalAmountRequested))
    expect(await roomContributor.getDeposit()).to.equal(proposalAmountRequested)
  })
})
describe('contributors should be able to claim rewards', () => {
  it('should be able to withdraw funds', async () => {
    const [roomOwnerSigner, roomContributorSigner] = await ethers.getSigners()
    // this is for the creator of the coontract
    const Room = await ethers.getContractFactory('Room')
    const room = await Room.deploy(roomOwnerSigner.address, data)
    await room.deposit({ value: fundingAmount })

    // this is for a contributor
    const roomContributor = new ethers.Contract(room.address, Room.interface, roomContributorSigner)
    roomContributor.submitProposal(uriLink, proposalAmountRequested)
    const proposals = await roomContributor.getProposals()
    await room.approveProposal(proposals[0])
    await roomContributor.withdraw(proposalAmountRequested)
  })
})
