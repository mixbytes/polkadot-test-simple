const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a } = require('@polkadot/util');
const { randomAsU8a } = require('@polkadot/util-crypto');
const BN = require('bn.js');


async function main () {
  const provider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create(provider);
  const keyring = testKeyring.default();

  // exactly the "--key NODE_KEY_SEED" parameter for launching node
  // I chose to use the same seed to launch test node and generate keypair in JS test
  const DEV_NODE_KEY_SEED = "AAA";
  // I run command:
  // $ docker run --rm -it --network host chevdor/polkadot:0.3.14 polkadot --chain=local --validator -d /tmp/alice --key AAA --rpc-external --ws-external
  // from the log
  // ...
  // Using authority key 5CZnXiA7kw6YMp8V5PMfJqFEskC1posdgnKocKqAv1HLi4CG
  // Then, let's generate keypair from the same seed ("AAA")
  const node_keypair = keyring.addFromUri(DEV_NODE_KEY_SEED);
  const NODE_ADDRESS = node_keypair.address();
  console.log("Using address: " + NODE_ADDRESS);
  // Generated in JS:           5CZnXiA7kw6YMp8V5PMfJqFEskC1posdgnKocKqAv1HLiDbZ
  // Authority key from Docker: 5CZnXiA7kw6YMp8V5PMfJqFEskC1posdgnKocKqAv1HLi4CG
  // Supposed, that addresses will be equal, but they differ in last three symbols, hz why
  
  const balance = await api.query.balances.freeBalance(NODE_ADDRESS);
  console.log("Balance is: " + balance);


  /* send single transaction */
  const AMOUNT = 3;
  const recipient = keyring.addFromSeed(randomAsU8a(32)).address();
  
  const nonce = await api.query.system.accountNonce(NODE_ADDRESS);

  // FAILS - NO DOTS on NODE_ADDRESS :(
  api.tx.balances
    .transfer(recipient, AMOUNT)
    .sign(node_keypair, { nonce })
    .send(({ events = [], status }) => {
      console.log('[DEBUG] Transaction status:', status.type);

      if (status.isFinalized) {
        console.log('Completed at block hash', status.asFinalized.toHex());
        console.log('Events:');

        events.forEach(({ phase, event: { data, method, section } }) => {
          console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
        });

  		console.log('[DEBUG] Sent', AMOUNT, 'from', NODE_ADDRESS, 'to', recipient, 'with nonce', nonce.toString(), 'hash', hash.toHex());
        process.exit(0);
      }
    });

  return false;
}

main().catch(console.error);
