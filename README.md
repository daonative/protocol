# DAOnative smart contracts

Welcome to the DAOnative repo

Right now we just released a naive implementation of how the contracts will work. But, we plan on reducing the costs of deploying.


## Types of Smart Contracts

1. Rooms -> Rooms Smartcontract are dead simple treasury that allow people to fund it and request funds from it
2. Collections -> Collection are used to create your own NFT DAO membership


## Rooms

### Warning

This is still an alpha version which will evolve significantly before the mainnet release.

### Terminology

- room: a treasury to help you fund content
- proposal: a way to request funds from your treasury

### Roles

- contributor: someone requesting money from the treasury
- sponsor: a person who funds the treasury
- creator: `msg.sender` that created the treasury

### Introduction

Using DAOnative smart contracts, sponsors can:

- Create a room & fund it
- Approve & Fund proposals from contributors


Using DAOnative contracts, contributors can:

- Submit an proposal
- Withdraw their rewards

## Roadmap

- [x] release source code naive implentation of smart coontracts
- [ ] reduce gas cost by using [open zeppelin clones](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
- [x] release tesnet
- [x] release mainnet polygon
- [x] release mainnet eth
- [ ] funding a treasury using `RoomMembership` NFTs
- [ ] funding using erc20 support


## Development

Running test watchers:

```
yarn
cp .env.example .env
# replace values of .env
yarn test:watch
```
