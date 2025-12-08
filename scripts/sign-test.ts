import { Wallet } from 'ethers';

const privateKey =
  '0x1e1b70308eea711d145b9407bf7f4563aae82101321ffd74448d2438018a715e';
const wallet = new Wallet(privateKey);

const message =
  'Sign in to Wallet\nURI: http://localhost:3000\nWallet: 0xdcb46e0b5f2bee150b3576c5055d2a0fa50330dc\nChain ID: 1\nNonce: 026257809ffb91eeeb2a134eff942725';

async function signMessage() {
  const signature = await wallet.signMessage(message);
  console.log('Signature:', signature);
  console.log('\nWallet Address:', wallet.address);
}

void signMessage();
