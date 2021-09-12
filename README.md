# smart contracts | prologe.press


Welcome to the prologe.press smart contracts repo

Right now we just released a naive implementation of how the contracts will work. But, we plan on reducing the costs of deploying.

## Warning

This is still an alpha version which will evolve significantly before the mainnet release.
## Terminology

- Call for article: a way to request content on-chain
- Article: for the smart contracts articles are a link
## Introduction


Using prologe.press smart contracts sponsor can:

- create a new call
- fund a call
- vote on articles

Using prologe.press smart contracts writers can:

- submit an article
- withdraw their rewards



## Roadmap

1. release source code naive implentation of smart coontracts
2. reduce gas cost by using [open zeppelin clones](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
3. release testnet
4. release prologe dApp (testnet integration)
5. release mainnet
6. release prologe dApp (mainnet integration)
7. funding using erc20 support

## Development

Running test watchers:

```
yarn
cp .env.example .env
# replace values of .env
yarn test:watch
```

