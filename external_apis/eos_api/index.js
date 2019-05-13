'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    fs = require('fs');

const readFile = Promise.promisify(fs.readFile);

const EosApiImp = require('./eos_api_impl');

const wrappedEosApi = wrap(EosApiImp);

function createAction(contractName, actionName, data, authorization) {
    if (!_.isArray(authorization)) {
        authorization = [authorization];
    }
    return {
        account : contractName,
        name : actionName,
        authorization : authorization, // must be array
        data : data
    };
}

function createAuthorization(actor, permission) {
    permission = permission || 'active';
    return {actor, permission};
}

async function deployContract(account, contractPath, authorizations, options) {
    const name = path.parse(contractPath).base;
    return Promise.join(
        readFile(`${contractPath}/${name}.wasm`),
        readFile(`${contractPath}/${name}.abi`, 'utf-8'),
        async function(wasm, abi) {
            const retCode = await setcode(account, 0, 0, wasm, authorizations, options)
                .catch((err) => {
                    if (err.error && err.error.code === 3160008) { //Contract is already running this version of code
                        return err.error.code;
                    }
                });
            const retAbi = await setabi(account, wrappedEosApi.getAbiHex(abi), authorizations, options);
            return {retCode, retAbi};
        });
}

async function deployAbi(account, abiPath, authorizations, options) {
    const abi = await readFile(abiPath, 'utf-8');
    return setabi(account, wrappedEosApi.getAbiHex(abi), authorizations, options);
}

function setcode(account, vmtype, vmversion, code, authorizations, options) {
    const data = {account, vmtype, vmversion, code};
    const action = createAction('eosio', 'setcode', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function setabi(account, abi, authorizations, options) {
    const data = {account, abi};
    const action = createAction('eosio', 'setabi', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function newaccount(newAcccountAction, buyramAction, delegatebwAction, options) {
    const actions = [];
    if (typeof newAcccountAction.data.owner === 'string') {
        newAcccountAction.data.owner = {
            threshold : 1,
            keys : [{key : newAcccountAction.data.owner, weight: 1}],
            accounts : [],
            waits : [],
        };
    }
    if (typeof newAcccountAction.data.active === 'string') {
        newAcccountAction.data.active = {
            threshold: 1,
            keys: [{key : newAcccountAction.data.active, weight: 1}],
            accounts : [],
            waits : [],
        };
    }

    actions.push(newAcccountAction);
    if (!_.isEmpty(buyramAction)) {
        actions.push(buyramAction);
    }

    if (!_.isEmpty(delegatebwAction)) {
        actions.push(delegatebwAction);
    }
    return wrappedEosApi.transact({actions : actions}, options);
}

function setpriv(data, authorizations, options) { // bios
    const action = createAction('eosio', 'setpriv', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function updateauth(data, authorizations, options) {
    const action = createAction('eosio', 'updateauth', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function buyram(data, authorizations, options) {
    const action = createAction('eosio', 'buyram', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function buyrambytes(data, authorizations, options) {
    const action = createAction('eosio', 'buyrambytes', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function regproducer(data, authorizations, options) {
    const action = createAction('eosio', 'regproducer', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function unregprod(data, authorizations, options) {
    const action = createAction('eosio', 'unregprod', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function delegatebw(data, authorizations, options) {
    const action = createAction('eosio', 'delegatebw', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function undelegatebw(data, authorizations, options) {
    const action = createAction('eosio', 'undelegatebw', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function voteproducer(data, authorizations, options) {
    const action = createAction('eosio', 'voteproducer', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function create(data, code, authorizations, options) {
    const action = createAction(code, 'create', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function issue(data, code, authorizations, options) {
    const action = createAction(code, 'issue', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function transfer(data, code, authorizations, options) {
    const action = createAction(code, 'transfer', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function regrecord(data, code, authorizations, options) {
    const action = createAction(code, 'regrecord', data, authorizations);
    return wrappedEosApi.transact({actions : [action]}, options);
}

function wrap(EosApi) {
    const config = require('config');
    const eosNodeConf = config.eosNode;

    let endpoints = _.clone(eosNodeConf.endpoints);
    const options  = {
        keyProvider: eosNodeConf.eosioPriKey,
        httpEndpoint: endpoints[0],
        broadcast: true,
        sign: true,
        chainId: eosNodeConf.chainId,
        blocksBehind : 3,
        expireSeconds: 60,
    };

    const eosApi = new EosApi(options);

    const EosApiWrap = {};
    const proto = Object.getPrototypeOf(eosApi);
    for (const key of Object.getOwnPropertyNames(proto)) {
        const func = proto[key];
        if (key === 'getEos' || key === 'setOptions' || key === 'getOptions' || key === 'getAbiHex') {
            EosApiWrap[key] = function() {
                return func.apply(eosApi, arguments);
            };
        } else if (typeof func === 'function') {
            EosApiWrap[key] = async function() {
                const args = arguments;
                let ret = {};
                for (let i = 0; i < endpoints.length; i++) {
                    eosApi.options.httpEndpoint = endpoints[0];
                    ret = await func.apply(eosApi, args)
                        .catch((err) => {
                            err.endpoint = eosApi.options.httpEndpoint;
                            err.endpoints = endpoints;
                            console.log(err);
                            if (err.status === 502 || err.status === 429 || (err.name === 'TypeError' && err.message === 'Failed to fetch') || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                                const endpoint = endpoints.shift();
                                endpoints = endpoints.concat([endpoint]);
                                return null;
                            }
                            const error = err.json;
                            if (!_.isNil(error)) {
                                if (error.code === 3080006) { // transaction too long // push_transaction의 경우, error.message를 eosjs에서 리턴함.
                                    console.log('transaction too long delay');
                                    return Promise.resolve(null).delay(5000);
                                }
                                throw error;
                            } else {
                                throw err;
                            }
                        });
                    if (!_.isNil(ret)) {
                        return ret;
                    }
                }
                return ret;
            };
        }
    }
    return EosApiWrap;
}

module.exports = exports = Object.assign({}, wrappedEosApi, {
    wrap, EosApiImp,
    createAction, createAuthorization,
    deployContract, deployAbi, setcode, setabi,
    newaccount,
    setpriv,
    updateauth,
    buyram, buyrambytes, delegatebw, undelegatebw,
    regproducer, unregprod, voteproducer,
    create, issue, transfer,
    regrecord
});

