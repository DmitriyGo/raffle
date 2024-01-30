import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-docgen';
import '@typechain/hardhat';

import { HardhatUserConfig as WithEtherscanConfig } from 'hardhat/config';
import { HardhatUserConfig } from 'hardhat/src/types/config';

type DeploymentConfig = HardhatUserConfig & WithEtherscanConfig;

const config: DeploymentConfig = {
  defaultNetwork: 'hardhat',

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
  typechain: {
    outDir: './typechain-types',
    target: 'ethers-v6',
    tsNocheck: true,

    // alwaysGenerateOverloads: true,
  },
  paths: {
    sources: './contracts/',
  },
  gasReporter: {
    enabled: true,
  },
  contractSizer: {
    runOnCompile: true,
  },
};

export default config;
