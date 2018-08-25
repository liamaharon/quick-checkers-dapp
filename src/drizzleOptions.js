import QuickCheckers from '../build/contracts/QuickCheckers.json';

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545',
    },
  },
  contracts: [
    QuickCheckers,
  ],
  events: {
    QuickCheckers: ['NewGame'],
  },
  polls: {
    accounts: 1500,
  },
};

export default drizzleOptions;
