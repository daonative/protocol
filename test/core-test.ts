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

// used to keep track of the Bounty Contract gas cost
describe('Bounty Contract', () => {
  it('should deploy the contract', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    await Bounty.deploy(owner.address, data)
  })
})

describe('sponsors should be able to create a bounty', () => {
  it('should create a bounty', async () => {
    const BountyCreator = await ethers.getContractFactory('BountyCreator')
    const bountyCreator = await BountyCreator.deploy()
    await expect(bountyCreator.createBounty(data)).to.emit(bountyCreator, 'BountyCreated')
    const [newBountyAddress] = await bountyCreator.getBounties()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = Bounty.attach(newBountyAddress)
    expect(await bounty.getURI()).to.equal(data)
  })
  it('should be able to get existing bounties', async () => {
    const BountyCreator = await ethers.getContractFactory('BountyCreator')
    const bountyCreator = await BountyCreator.deploy()
    const bountiesBefore = await bountyCreator.getBounties()
    expect(bountiesBefore.length).to.equal(0)
    await bountyCreator.createBounty(data)
    const bountiesAfter = await bountyCreator.getBounties()
    expect(bountiesAfter.length).to.equal(1)
  })

  it('should be able to deposit eth on bounty', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(owner.address, data)
    await expect(bounty.deposit({ value: fundingAmount }))
      .to.emit(bounty, 'Transfer')
      .withArgs(owner.address, bounty.address, fundingAmount)
    const userBalance = await bounty.getDeposit()
    expect(userBalance).to.equal(fundingAmount)
    expect(await waffle.provider.getBalance(bounty.address)).to.equal(fundingAmount)
  })

  it('should be able to get my balance', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(owner.address, data)
    expect(await waffle.provider.getBalance(bounty.address)).to.equal(parseEther('0'))
    bounty.deposit({ value: fundingAmount })
    const userBalance = await bounty.getDeposit()
    expect(userBalance).to.equal(fundingAmount)
  })

  it('should be able to withdraw eth from contract', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(owner.address, data)
    await bounty.deposit({ value: fundingAmount })
    await expect(bounty.withdraw(fundingAmount))
      .to.emit(bounty, 'Transfer')
      .withArgs(bounty.address, owner.address, fundingAmount)

    expect(await bounty.getDeposit()).to.be.equal(0)
  })
})
describe('writers should be able to submit an answer', () => {
  it('should be able to submit an article', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(owner.address, data)
    await expect(bounty.submitAnswer(uriLink)).to.emit(bounty, 'SubmitAnswer')
  })
  it('should be able to retrieve own answers', async () => {
    const [owner] = await ethers.getSigners()
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(owner.address, data)
    bounty.submitAnswer(uriLink)
    const answers = await bounty.getMyAnswers()
    expect(answers[0]).to.equal(uriLink)
  })
})

describe('sponsors should be able to vote on answers', () => {
  it('should be able to vote on answer', async () => {
    const [bountyOwnerSigner, bountyWriterSigner] = await ethers.getSigners()
    // funding round
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(bountyOwnerSigner.address, data)
    await bounty.deposit({ value: fundingAmount })

    // response round
    const bountyWriter = new ethers.Contract(bounty.address, Bounty.interface, bountyWriterSigner)
    bountyWriter.submitAnswer(uriLink)
    const answers = await bountyWriter.getAnswers()

    // voting round
    const votingAmount = parseEther('0.5')
    await expect(bounty.vote(answers[0].id, votingAmount)).to.emit(bounty, 'Vote').withArgs(votingAmount, answers[0].id)
    expect(await bounty.getDeposit()).to.equal(fundingAmount.sub(votingAmount))
    expect(await bountyWriter.getDeposit()).to.equal(votingAmount)
  })
})
describe('writers should be able to claim rewards', () => {
  it('should be able to withdraw funds', async () => {
    const [bountyOwnerSigner, bountyWriterSigner] = await ethers.getSigners()
    // this is for the creator of the coontract
    const Bounty = await ethers.getContractFactory('Bounty')
    const bounty = await Bounty.deploy(bountyOwnerSigner.address, data)
    await bounty.deposit({ value: fundingAmount })

    // this is for a writer
    const bountyWriter = new ethers.Contract(bounty.address, Bounty.interface, bountyWriterSigner)
    bountyWriter.submitAnswer(uriLink)
    const answers = await bountyWriter.getAnswers()
    await bounty.vote(answers[0].id, fundingAmount)
    await bountyWriter.withdraw(fundingAmount)
  })
})
describe('sponsors should be able to add funds to an existing call for article', async () => {})
