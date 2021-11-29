# Newsroom Treasury protocol

Welcome to the Newsroom Treasury repo

Right now we just released a naive implementation of how the contracts will work. But, we plan on reducing the costs of deploying.

## Warning

This is still an alpha version which will evolve significantly before the mainnet release.

## Terminology

- room: a treasury to help you fund content
- proposal: a way to request funds from your treasury

## Roles

- contributor: someone making a proposal for content
- sponsor: someone funding a Newsroom
- creator: msg.sender that created the treasury

## Introduction

Using newsroom contracts, sponsors can:

- Create a newsroom & fund it
- Create proposals to request funds from your newsroom
- Fund proposals

Using newsroom contracts, contributors can:

- Submit an proposal
- Withdraw their rewards

## Roadmap

1. release source code naive implentation of smart coontracts
2. reduce gas cost by using [open zeppelin clones](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
3. release testnet
4. release testnet dApp 
5. release mainnet ⬅️ Currently live on polygon
6. funding using erc20 support

## Development

Running test watchers:

```
yarn
cp .env.example .env
# replace values of .env
yarn test:watch
```
