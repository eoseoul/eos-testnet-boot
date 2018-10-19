'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    config = require('config');

const eosNodeConfig = config.eosNode;
const EosApiImp = require('./eos_api_impl');

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
            EosApiWrap[key] = () => {
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
                            if (typeof err === 'string') {
                                err = JSON.parse(err);
                            }
                            if (err.status === 502 || err.status === 429 || (err.name === 'TypeError' && err.message === 'Failed to fetch') || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED') {
                                const endpoint = endpoints.shift();
                                endpoints = endpoints.concat([endpoint]);
                                return null;
                            } else if (err.error && err.error.code === 3080006) { // transaction too long
                                return Promise.resolve(null).delay(5000);
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

module.exports = exports = Object.assign({}, wrap(EosApiImp), {wrap, EosApiImp});
