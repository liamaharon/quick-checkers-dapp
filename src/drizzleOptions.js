import SpeedCheckers from '../build/contracts/SpeedCheckers.json';

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545',
    },
  },
  contracts: [
    SpeedCheckers,
  ],
  syncAlways: true,
  polls: {
    accounts: 1500,
  },
};

export default drizzleOptions;
