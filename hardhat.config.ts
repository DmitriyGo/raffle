import type { HardhatUserConfig } from 'hardhat/config';

import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-docgen';

import {
  ENV,
  getForkNetworkConfig,
  getHardhatNetworkConfig,
  getNetworkConfig,
} from './config';

const { OPTIMIZER, REPORT_GAS, FORKING_NETWORK, ETHERSCAN_API_KEY } = ENV;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  defaultNetwork: 'hardhat',
  networks: {
    main: getNetworkConfig('main'),
    sepolia: getNetworkConfig('sepolia'),
    hardhat: FORKING_NETWORK
      ? getForkNetworkConfig(FORKING_NETWORK)
      : getHardhatNetworkConfig(),
    localhost: FORKING_NETWORK
      ? getForkNetworkConfig(FORKING_NETWORK)
      : getHardhatNetworkConfig(),
  },
  gasReporter: { enabled: REPORT_GAS },
  contractSizer: { runOnCompile: OPTIMIZER },
  etherscan: { apiKey: ETHERSCAN_API_KEY },
  paths: {
    deploy: 'deploy/',
    deployments: 'deployments/',
    sources: 'contracts/',
  },
  external: FORKING_NETWORK
    ? {
        deployments: {
          hardhat: ['deployments/' + FORKING_NETWORK],
          local: ['deployments/' + FORKING_NETWORK],
        },
      }
    : undefined,
};

export default config;
