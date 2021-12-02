import 'hardhat-typechain'
import 'hardhat-watcher'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

require('dotenv').config()

const { API_URL_KOVAN, API_URL_ROPSTEN, TEST_PRIVATE_KEY } = process.env

export default {
  watcher: {
    compilation: {
      tasks: ['compile'],
      files: ['./contracts'],
      verbose: true,
    },
    test: {
      tasks: [{ command: 'test', params: { testFiles: ['./test/core-test.ts', './test/membership-test.ts'] } }],
      files: ['./test/**/*', './contracts/**/*'],
      verbose: true,
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },

    ropsten: {
      url: API_URL_ROPSTEN,
      accounts: [`0x${TEST_PRIVATE_KEY}`],
    },
    kovan: {
      url: API_URL_KOVAN,
      accounts: [`0x${TEST_PRIVATE_KEY}`],
    },
    matic: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [process.env.PRIVATE_KEY || '0x000000000000'],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: process.env.COINMARKETCAP_DEFAULT_CURRENCY,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    token: 'MATIC',
  },
  solidity: {
    version: '0.8.0',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none',
      },
    },
  },
}
