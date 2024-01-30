import 'dotenv/config';
import { DEFAULT_VRF_COORDINATOR, DEFAULT_VRF_KEY_HASH } from '../constants';
import { Environment, Network } from '../types';

export const ENV: Environment = {
  ALCHEMY_KEY: process.env.ALCHEMY_KEY ?? '',
  INFURA_KEY: process.env.INFURA_KEY ?? '',
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? '',
  OPTIMIZER: process.env.OPTIMIZER === 'true',
  COVERAGE: process.env.COVERAGE === 'true',
  REPORT_GAS: process.env.REPORT_GAS === 'true',
  MNEMONIC_DEV: process.env.MNEMONIC_DEV,
  MNEMONIC_PROD: process.env.MNEMONIC_PROD ?? '',
  FORKING_NETWORK: process.env.FORKING_NETWORK
    ? (process.env.FORKING_NETWORK as Network)
    : undefined,
  VRF_COORDINATOR: process.env.VRF_COORDINATOR ?? DEFAULT_VRF_COORDINATOR,
  VRF_SUB_ID: process.env.VRF_SUB_ID,
  VRF_KEY_HASH: process.env.VRF_KEY_HASH ?? DEFAULT_VRF_KEY_HASH,
  TEST: process.env.TEST === 'true',
  DEPLOY_STORAGE_PATH: process.env.DEPLOY_STORAGE_PATH,
};
