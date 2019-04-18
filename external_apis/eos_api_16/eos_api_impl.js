'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    Eos = require('eosjs'),
    binaryen = require('binaryen'),
    fs = require('fs'),
    config = require('config');

const {format /*, api, ecc, json, Fcbuffer*/} = Eos.modules;
const eosNodeConfig = config.eosNode;
const readFile = Promise.promisify(fs.readFile);

class EosApi {
    constructor(options) {
        this.options = options;
    }

    getOptions(options) {
        return _.defaults({}, options, this.options);
    }

    getEos(options) {
        return Eos(this.getOptions(options));
    }

    getInfo(httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.getInfo({});
    }

    getBlock(blockId, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.getBlock(blockId);
    }

    getAccount(name, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.getAccount(name);
    }

    getKeyAccounts(publicKey, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.getKeyAccounts(publicKey);
    }

    getTableRows(code, scope, table, tableKey, lowerBound, limit, keyType, indexPosition, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        if (_.isString(lowerBound) === true) {
            lowerBound = format.encodeName(lowerBound, false);
        }
        const params = {
            json : true, // {type : "bool", "default": false},
            code : code,
            scope : scope,
            table : table,
            table_key : tableKey,
            lower_bound : lowerBound,
            //upper_bound : lowerBound,
            // upper_bound: {type : "string", default: '-1'},
            limit : limit,
            key_type : keyType,
            index_position : indexPosition
        };

        return eos.getTableRows(params);
    }

    getProducers(lowerBound, limit, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        const params = {
            json : true,
            lower_bound : lowerBound,
            limit : limit || 1000
        };
        return eos.getProducers(params);
    }

    transaction(code, func, options) {
        const eos = Eos(this.getOptions(options));
        return eos.transaction(code, (contract) => {
            func(contract);
        });
    }

    contract(code, func, options) {
        const eos = Eos(this.getOptions(options));
        return eos.contract(code)
            .then((contract) => {
                return func(contract);
            });
    }

    setpriv(priv, httpEndpoint) { // eosio.bios contract
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.contract('eosio')
            .then((contract) => {
                return contract.setpriv(priv, {authorization: `${eosNodeConfig.systemAccount}`});
            });
    }

    regproducer(prod, keyProvider, httpEndpoint) {
        // console.log(keyProvider);
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract(eosNodeConfig.systemAccount)
            .then((contract) => {
                return contract.regproducer(prod, {authorization: `${prod.producer}`});
            });
    }

    unregprod(name, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract(eosNodeConfig.systemAccount)
            .then((contract) => {
                return contract.unregprod(name, {authorization: `${name}`});
            });
    }

    delegatebw(delegate, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract(eosNodeConfig.systemAccount)
            .then((contract) => {
                return contract.delegatebw(delegate, {authorization: `${delegate.from}`});
            });
    }

    undelegatebw(undelegate, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract(eosNodeConfig.systemAccount)
            .then((contract) => {
                return contract.undelegatebw(undelegate, {authorization: `${undelegate.from}`});
            });
    }

    // {from: 'inita', to: 'initb', quantity: '1.0000 EOS', memo: ''}
    buyram(ram, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract('eosio')
            .then((contract) => {
                return contract.buyram(ram, {authorization: `${ram.payer}`});
            });
    }

    voteproducer(vote, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract(eosNodeConfig.systemAccount)
            .then((contract) => {
                return contract.voteproducer(vote, {authorization: `${vote.voter}`});
            });
    }

    setprods(prods, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.contract(eosNodeConfig.biosAccount)
            .then((contract) => {
                return contract.setprods(prods, {authorization: `${eosNodeConfig.biosAccount}`});
            });
    }

    newaccount(account, ram, delegate, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.transaction('eosio', (contract) => {
            contract.newaccount(account, {authorization: `${eosNodeConfig.systemAccount}`});
            if (!_.isEmpty(delegate)) {
                contract.delegatebw(delegate, {authorization: `${delegate.from}`});
            }
            if (!_.isEmpty(ram)) {
                contract.buyram(ram, {authorization: `${ram.payer}`});
            }
        });
    }

    transfer(_transfer, keyProvider, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint, keyProvider}));
        return eos.contract('eosio.token')
            .then((contract) => {
                return contract.transfer(_transfer, {authorization: `${eosNodeConfig.systemAccount}`});
            });
    }

    setcode(account, vmType, vmVersion, code, options) {
        const eos = Eos(this.getOptions(options));
        return eos.setcode(account, vmType, vmVersion, code);
    }

    setabi(account, abi, options) {
        const eos = Eos(this.getOptions(options));
        return eos.setabi(account, abi);
    }

    /*
    deployContract(account, contractPath, options) {
        const name = path.parse(contractPath).base;
        const self = this;
        return Promise.join(
            readFile(`${contractPath}/${name}.wasm`),
            readFile(`${contractPath}/${name}.abi`, 'utf-8'),
            async function(wasm, abi) {
                const eos = Eos(self.getOptions(_.defaults({}, {binaryen}, options)));
                const retCode = await eos.setcode(account, 0, 0, wasm);     // @returns {Promise}
                const retAbi = await eos.setabi(account, JSON.parse(abi));  // @returns {Promise}
                return {retCode, retAbi};
            });
    }
    */

    /* auth = {
        'account': account,
        'permission': permission,
        'parent': parent,
        'auth': {
            'threshold': 1, 'keys': [], 'waits': [],
            'accounts': [{
                'weight': 1,
                'permission': {'actor': controller, 'permission': 'active'}
            }]
        }
    }
    */
    updateauth(auth, httpEndpoint) {
        const eos = Eos(this.getOptions({httpEndpoint}));
        return eos.contract('eosio')
            .then((contract) => {
                return contract.updateauth(auth, {authorization: `${auth.account}@${auth.permission}`});
            });
    }

}

module.exports = EosApi;

