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
describe('Room Membership Contract', () => {
  it('should deploy the contract', async () => {
    const RoomMembership = await ethers.getContractFactory('RoomMembership')
    await RoomMembership.deploy()
  })
})

describe('Ability to mint an NFT', () => {
  it('should be possible to mint an NFT', async () => {
    const RoomMembership = await ethers.getContractFactory('RoomMembership')
    const roomMembership = await RoomMembership.deploy()
    const [_, memberOne, memberTwo, memberThree] = await ethers.getSigners()
    const roomMembershipContract = new ethers.Contract(roomMembership.address, roomMembership.interface)

    await roomMembershipContract.connect(memberOne).safeMint(memberOne.address, 'daonative')
    await roomMembershipContract.connect(memberOne).safeMint(memberOne.address, 'greendao')
    await roomMembershipContract.connect(memberTwo).safeMint(memberTwo.address, 'daonative')
    await roomMembershipContract.connect(memberThree).safeMint(memberThree.address, 'greendao')
  })
})
