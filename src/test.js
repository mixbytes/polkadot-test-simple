const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a, bufferToU8a } = require('@polkadot/util');
const { randomAsU8a } = require('@polkadot/util-crypto');
const BN = require('bn.js');


async function main () {
  const provider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create(provider);
  const keyring = testKeyring.default();

  keyring
    .getPairs()
    .forEach((pair, index) => {
			const addr = pair.address()
	  	api.query.balances.freeBalance(addr).then((balance) => {
      	// console.log(`Account with index #${index}, name: ${pair.name}, address: ${addr}, balance: ${balance}\n`);
	  });
  });

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
  //console.log("Using address: " + NODE_ADDRESS);
  // Generated in JS:           5CZnXiA7kw6YMp8V5PMfJqFEskC1posdgnKocKqAv1HLiDbZ
  // Authority key from Docker: 5CZnXiA7kw6YMp8V5PMfJqFEskC1posdgnKocKqAv1HLi4CG
  // Supposed, that addresses will be equal, but they differ in last three symbols, hz why
  let node_balance = await api.query.balances.freeBalance(NODE_ADDRESS);
  console.log("Node balance is: " + node_balance);
  
  // Alice balance
  const alice = keyring.addFromUri('Alice');
  let alice_balance = await api.query.balances.freeBalance(alice.address());
  console.log("Alice balance is: " + alice_balance);

  // Bob balance
  const bob = keyring.addFromUri('Bob');
  let bob_balance = await api.query.balances.freeBalance(bob.address());
  console.log("Bob balance is: " + bob_balance);


  let alice_nonce = await api.query.system.accountNonce(alice);
  let transfer = api.tx.balances
				.transfer(bob.address(), 666)                                                                                                                                         
				.sign(alice, { alice_nonce })
				.send(({ events = [], status }) => {                                                                                                                                 
					if (status.isFinalized) {
						console.log('[DEBUG] Sent 666 DOTs from Alice to Bob');
						return false;
					}
				})
                .then(function(s) {console.log(`aaaaaaaaaaaa: %{s}`); });


  
  // generate many keypairs
  const PAIRS_AMOUNT = 3;
  let keypairs = [];
  for(let i = 0; i < PAIRS_AMOUNT; i++) {
  	keypairs.push(keyring.addFromUri('seed' + i));
  }

  // sign many transfer transactions
  const AMOUNT = 3;
  
  console.log(`Start signing ${PAIRS_AMOUNT} transfer transactions`);
  console.time("signing1");

  for (let i = 0; i < PAIRS_AMOUNT; i++) {
    const nonce = 0
    const recipient = keyring.addFromSeed(randomAsU8a(32)).address();
  	let result = await api.tx.balances
					.transfer(recipient, AMOUNT)                                                                                                                                         
	    			.sign(keypairs[i], { nonce });

  }
  console.timeEnd("signing1");
  console.log(`Finished signing ${PAIRS_AMOUNT} transfer transactions`);

  // process.exit(0);


  // transfering to random accounts
  console.log(`Start sending ${PAIRS_AMOUNT} transfer transactions`);
  console.time("sending1");

  for (let i = 0; i < PAIRS_AMOUNT; i++) {
    const nonce = await api.query.system.accountNonce(alice);
    const recipient = keyring.addFromSeed(randomAsU8a(32)).address();
  	let result = await api.tx.balances
					.transfer(recipient, AMOUNT)                                                                                                                                         
	    			.sign(alice, { nonce })
					.send(({ events = [], status }) => {                                                                                                                                 
      					if (status.isFinalized) {
        					console.log('[DEBUG] Sent', AMOUNT, 'from', alice.address(), 'to', recipient, 'with nonce', nonce.toString());
							return false;
						}                                
     				});

  }
  console.timeEnd("sending1");
  console.log(`Finished sending ${PAIRS_AMOUNT} transfer transactions`);
  
  process.exit(0);



  /*
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
	*/
	
   return false;
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
