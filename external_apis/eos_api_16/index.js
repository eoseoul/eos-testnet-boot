'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    config = require('config'),
    path = require('path'),
    fs = require('fs');

const readFile = Promise.promisify(fs.readFile);


const eosNodeConfig = config.eosNode;
const EosApiImp = require('./eos_api_impl');

const wrappedEosApi = wrap(EosApiImp);

async function deployContract(account, contractPath, options) {
    const name = path.parse(contractPath).base;
    return Promise.join(
        readFile(`${contractPath}/${name}.wasm`),
        readFile(`${contractPath}/${name}.abi`, 'utf-8'),
        async function(wasm, abi) {
            const retCode = await wrappedEosApi.setcode(account, 0, 0, wasm, options)
                .catch((err) => {
                    if (err.code === 3160008) {
                        return err.code;
                    }
                });
            const retAbi = await wrappedEosApi.setabi(account, JSON.parse(abi), options);
            return {retCode, retAbi};
        });
}

function wrap(_EosApi) {
    let endpoints = _.clone(config.eosNode.endpoints);
    const options  = {
        keyProvider: eosNodeConfig.eosioPriKey,
        httpEndpoint: endpoints[0],
        // mockTransactions: () => 'pass', // or 'fail'
        // transactionHeaders: (expireInSeconds, callback) => { callback(null/*error*/, headers)},
        expireInSeconds: 60,
        broadcast: true,
        debug: false,
        sign: true,
        chainId: eosNodeConfig.chainId
    };

    const eosApi = new _EosApi(options);

    const EosApiWrap = {};
    const proto = Object.getPrototypeOf(eosApi);
    for (const key of Object.getOwnPropertyNames(proto)) {
        const func = proto[key];
        if (key === 'getEos') {
            EosApiWrap[key] = function() {
                return func.apply(eosApi, arguments);
            };
        }
        else if (key !== 'getOptions' && typeof func === 'function') {
            EosApiWrap[key] = async function() {
                const args = arguments;
                let ret = {};
                for (let i = 0; i < endpoints.length; i++) {
                    eosApi.options.httpEndpoint = endpoints[0];
                    ret = await func.apply(eosApi, args)
                        .catch((err) => {
                            console.log(err);
                            if (err.status === 502 || err.status === 429 || (err.name === 'TypeError' && err.message === 'Failed to fetch') || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                                const endpoint = endpoints.shift();
                                endpoints = endpoints.concat([endpoint]);
                                return null;
                            }
                            if (typeof err === 'string') {
                                err = JSON.parse(err);
                            }
                            if (!_.isNil(err.error)) {
                                if (err.error.code === 3080006 || err.error.code === 3081001) { // transaction too long // push_transaction의 경우, error.message를 eosjs에서 리턴함.
                                                                                                // 3081001,"name":"leeway_deadline_exception
                                    console.log('transaction too long delay');
                                    return Promise.resolve(null).delay(5000);
                                }
                                throw err;
                            } else {
                                if (!_.isEmpty(err.message)) {
                                    try {
                                        const message = JSON.parse(err.message);
                                        if (!_.isEmpty(message.error) && !_.isNil(message.error.code)) {
                                            throw message;
                                        }
                                    } catch (err) {
                                    }
                                }
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

module.exports = exports = Object.assign({}, wrap(EosApiImp), {wrap, EosApiImp, deployContract});
