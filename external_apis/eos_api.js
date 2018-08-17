'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    Eos = require('eosjs'),
    binaryen = require('binaryen'),
    fs = require('fs'),
    config = require('config');

// const {format /*, api, ecc, json, Fcbuffer*/} = Eos.modules;

const eosNodeConfig = config.eosNode;
const readFile = Promise.promisify(fs.readFile);

function getConfig(httpEndPoint, key) {
    const endpoint = getEndpoint(httpEndPoint);
    return {
        keyProvider: key || eosNodeConfig.eosioPriKey,
        httpEndpoint: endpoint,
        // mockTransactions: () => 'pass', // or 'fail'
        // transactionHeaders: (expireInSeconds, callback) => { callback(null/*error*/, headers)},
        expireInSeconds: 60,
        broadcast: true,
        debug: false,
        sign: true,
        chainId: eosNodeConfig.chainId
    };
}

function getEndpoint(endpoint) {
    if (_.isEmpty(endpoint)) {
        endpoint = `http://${eosNodeConfig.host}:${eosNodeConfig.httpPort}`;
    }
    return endpoint;
}

function getInfo(endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.getInfo({})
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getBlock(blockId, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.getBlock(blockId)
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getAccount(name, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.getAccount(name)
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getKeyAccounts(publicKey, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.getKeyAccounts(publicKey)
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getTableRows(code, scope, table, tableKey, limit, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);

    const params = {
        json : true, // {type : "bool", "default": false},
        code : code,
        scope : scope,
        table : table,
        table_key : tableKey,
        // lower_bound : format.encodeName('eoseouldotio', false),
        // upper_bound : format.encodeName('eoseouldotio', false),
        //lower_bound: {type : string, default: '0'},
        //upper_bound: {type : "string", default: '-1'},
        limit : limit
    };

    return eos.getTableRows(params)
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function setpriv(priv, endpoint) { // eosio.bios contract
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.contract('eosio')
        .then((contract) => {
            return contract.setpriv(priv, {authorization: `${eosNodeConfig.systemAccount}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function regproducer(prod, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.systemAccount)
        .then((contract) => {
            return contract.regproducer(prod, {authorization: `${prod.producer}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function unregprod(name, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.systemAccount)
        .then((contract) => {
            return contract.unregprod(name, {authorization: `${name}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function delegatebw(delegate, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.systemAccount)
        .then((contract) => {
            return contract.delegatebw(delegate, {authorization: `${delegate.from}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function undelegatebw(undelegate, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.systemAccount)
        .then((contract) => {
            return contract.undelegatebw(undelegate, {authorization: `${undelegate.from}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

// {from: 'inita', to: 'initb', quantity: '1.0000 EOS', memo: ''}
function buyram(ram, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract('eosio')
        .then((contract) => {
            return contract.buyram(ram, {authorization: `${ram.payer}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function voteproducer(vote, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.systemAccount)
        .then((contract) => {
            return contract.voteproducer(vote, {authorization: `${vote.voter}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function setprods(prods, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.contract(eosNodeConfig.biosAccount)
        .then((contract) => {
            return contract.setprods(prods, {authorization: `${eosNodeConfig.biosAccount}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function newaccount(account, ram, delegate, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.transaction('eosio', (contract) => {
        contract.newaccount(account, {authorization: `${eosNodeConfig.systemAccount}`});
        if (!_.isEmpty(ram)) {
            contract.delegatebw(delegate, {authorization: `${delegate.from}`});
            contract.buyram(ram, {authorization: `${ram.payer}`});
        }
    })
    .catch(function(err) {
        console.log(err);
        if (typeof err === 'string') {
            throw JSON.parse(err);
        }
        throw err;
    });
}

function transfer(_transfer, pvt, endpoint) {
    const options = getConfig(endpoint);
    if (!_.isEmpty(pvt)) {
        options.keyProvider = pvt;
    }
    const eos = Eos(options);
    return eos.contract('eosio.token')
        .then((contract) => {
            return contract.transfer(_transfer, {authorization: `${eosNodeConfig.systemAccount}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getProducers(lowerBound, limit, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    const params = {
        json : true,
        lower_bound : lowerBound,
        limit : limit || 1000
    };
    return eos.getProducers(params)
        .catch((err) => {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function deployContract(account, contractPath, endpoint, key) {
    const options = getConfig(endpoint, key);
    options.binaryen = binaryen;
    const name = path.parse(contractPath).base;
    return Promise.join(
        readFile(`${contractPath}/${name}.wasm`),
        readFile(`${contractPath}/${name}.abi`, 'utf-8'),
        async function(wasm, abi) {
            const eos = Eos(options);
            const retCode = await eos.setcode(account, 0, 0, wasm);     // @returns {Promise}
            const retAbi = await eos.setabi(account, JSON.parse(abi));  // @returns {Promise}
            return {retCode, retAbi};
        });
}

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
function updateauth(auth, endpoint) {
    const options = getConfig(endpoint);
    const eos = Eos(options);
    return eos.contract('eosio')
        .then((contract) => {
            return contract.updateauth(auth, {authorization: `${auth.account}@${auth.permission}`});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function getEos(endpoint, key) {
    const options = getConfig(endpoint, key);
    return Eos(options);
}

module.exports = exports = { getInfo, getBlock, getAccount, getKeyAccounts, getTableRows, setpriv, regproducer, unregprod,
    delegatebw, undelegatebw, buyram, voteproducer, setprods, newaccount, transfer, getProducers, updateauth, deployContract, getEos};
