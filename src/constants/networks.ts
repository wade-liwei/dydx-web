import environments from '../../public/configs/v1/env.json';

type Mode = 'MAINNET' | 'TESTNET' | 'DEV';

const mode = import.meta.env.MODE;
export const CURRENT_MODE = ({
  production: 'MAINNET',
  testnet: 'TESTNET',
  staging: 'DEV',
  development: 'DEV',
}[mode] ?? 'DEV') as Mode;

export const isMainnet = CURRENT_MODE === 'MAINNET';
export const isTestnet = CURRENT_MODE === 'TESTNET';
export const isDev = CURRENT_MODE === 'DEV';

export const AVAILABLE_ENVIRONMENTS = environments.deployments[CURRENT_MODE];
export const ENVIRONMENT_CONFIG_MAP = environments.environments;
export const TOKEN_CONFIG_MAP = environments.tokens;
export const LINKS_CONFIG_MAP = environments.links;
export const WALLETS_CONFIG_MAP = environments.wallets;
export type DydxNetwork = keyof typeof ENVIRONMENT_CONFIG_MAP;
export type DydxChainId = keyof typeof TOKEN_CONFIG_MAP;
export const DEFAULT_APP_ENVIRONMENT = AVAILABLE_ENVIRONMENTS.default as DydxNetwork;

// 这里是 statsig 的环境
export const STATSIG_ENVIRONMENT_TIER = ({
  production: 'production',
  testnet: 'staging',
  staging: 'development',
  development: 'development',
}[mode] ?? 'development') as 'production' | 'staging' | 'development';

console.log({
  mode,
  CURRENT_MODE,
  AVAILABLE_ENVIRONMENTS,
  ENVIRONMENT_CONFIG_MAP,
  TOKEN_CONFIG_MAP,
  LINKS_CONFIG_MAP,
  WALLETS_CONFIG_MAP,
  DEFAULT_APP_ENVIRONMENT,
  STATSIG_ENVIRONMENT_TIER,
});
