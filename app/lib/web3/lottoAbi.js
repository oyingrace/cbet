/** CbetLotto ABI — the subset the app needs (bet placement + event). */
export const lottoAbi = [
  {
    type: 'function',
    name: 'placeBet',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'drawId', type: 'string' },
      { name: 'gameType', type: 'uint8' },
      { name: 'numbers', type: 'uint8[]' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'minBet',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'maxBet',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'BetPlaced',
    inputs: [
      { indexed: true, name: 'ticketId', type: 'uint256' },
      { indexed: true, name: 'player', type: 'address' },
      { indexed: true, name: 'drawIdHash', type: 'bytes32' },
      { indexed: false, name: 'gameType', type: 'uint8' },
      { indexed: false, name: 'numbers', type: 'uint8[]' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'drawId', type: 'string' },
    ],
  },
];
