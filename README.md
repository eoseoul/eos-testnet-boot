# eos-testnet-boot

It is a tool that allows developers to run nodeos on a PC, execute a boot sequence, create a block, and test the environment.
It does not cover builds of nodeos.

## Boot Nodeos (Boot must be run only once)
    1. start boot_node
        cd ./testnet_chain/boot_node
        ./start.sh --delete-all-blocks --genesis-json genesis.json
    2. start bp_node
        cd ./testnet_chain/bp_node
        ./start.sh --delete-all-blocks --genesis-json genesis.json
    3. start boot (Must have nodejs installed)
        npm install
        npm run boot

## Stop Nodeos
    1. stop boot_node
        cd ./testnet_chain/boot_node
        ./stop.sh
    2. stop bp_node
        cd ./testnet_chain/bp_node
        ./stop.sh

## Restart / Start Nodeos
    1. start boot_node
        cd ./testnet_chain/boot_node
        ./start.sh
    2. start bp_node
        cd ./testnet_chain/bp_node
        ./start.sh

## etc
    1. check nodeos log
        cd ./testnet_chain/boot_node
        tail -f data/stderr.txt
    2. check nodeos process
        ps aux | grep nodeos
