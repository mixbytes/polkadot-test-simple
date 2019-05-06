# polkadot-test-simple                                                                                                                                                   
Tests of transaction signing, account generation, transfers                                                                                                              
                                                                                                                                                                         
## How to run                                                                                                                                                            
                                                                                                                                                                         
1. run Polkadot local node in docker with authority key
```docker run --rm -it --network host chevdor/polkadot:0.3.14 polkadot --chain=local --validator -d /tmp/alice --key AAA --rpc-external --ws-external```

2. ```cd polkadot-test-simple && npm install```

3. ```node src/test.js```

