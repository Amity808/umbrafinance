export const STEALTH_PAY_ABI = [
  {
    "type": "function",
    "name": "pay",
    "inputs": [
      {"name": "freelancer", "type": "address"},
      {"name": "token", "type": "address"},
      {"name": "rawAmount", "type": "uint256"},
      {"name": "senderName", "type": "string"},
      {"name": "description", "type": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "payWithEscrow",
    "inputs": [
      {"name": "freelancer", "type": "address"},
      {"name": "index", "type": "uint256"},
      {"name": "token", "type": "address"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "markLinkDone",
    "inputs": [{"name": "index", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "releaseFunds",
    "inputs": [
      {"name": "freelancer", "type": "address"},
      {"name": "index", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRecordCount",
    "inputs": [{"name": "freelancer", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecord",
    "inputs": [{"name": "freelancer", "type": "address"}, {"name": "index", "type": "uint256"}],
    "outputs": [
      {"name": "senderName", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "rawAmount", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBalance",
    "inputs": [{"name": "freelancer", "type": "address"}, {"name": "token", "type": "address"}],
    "outputs": [{"name": "encryptedBalance", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [{"name": "amount", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createLink",
    "inputs": [{"name": "description", "type": "string"}, {"name": "amount", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getLinksCount",
    "inputs": [{"name": "freelancer", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLink",
    "inputs": [{"name": "freelancer", "type": "address"}, {"name": "index", "type": "uint256"}],
    "outputs": [
      {"name": "description", "type": "string"},
      {"name": "amount", "type": "uint256"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "isPaid", "type": "bool"},
      {"name": "freelancerDone", "type": "bool"},
      {"name": "clientConfirmed", "type": "bool"},
      {"name": "payer", "type": "address"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerUsername",
    "inputs": [{"name": "username", "type": "string"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "resolveUsername",
    "inputs": [{"name": "username", "type": "string"}],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addressToUsername",
    "inputs": [{"name": "", "type": "address"}],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  }
] as const;

export const MOCK_STEALTHPAY_ADDRESS = "0x62e85C8cb59F62BdB07689c3813163277cCf171c" as `0x${string}`;
export const MOCK_TOKEN_ADDRESS = "0x3378f7798d63Dd6B605706ccb298b999EF323168" as `0x${string}`;
