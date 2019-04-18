'use strict';

const Promise = require('bluebird'),
    _ = require('lodash');

const { Api, JsonRpc, Serialize } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

class EosApi {
    constructor(options) {
        this.options = options;
    }

    setOptions(options) {
        this.options = _.assign(this.options, options);
    }

    getOptions(options) {
        return _.defaults({}, options, this.options);
    }

    getAbiHex(abi) {
        const api = new Api({ extDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
        const buffer = new Serialize.SerialBuffer({
            textEncoder: new TextEncoder(),
            textDecoder: new TextDecoder()
        });

        abi = JSON.parse(abi);
        let abiDefinition = api.abiTypes.get('abi_def');
        abi = abiDefinition.fields.reduce(
            (acc, {name: fieldName}) => Object.assign(acc, {[fieldName]: acc[fieldName] || []}),
            abi,
        );
        abiDefinition.serialize(buffer, abi);
        return Buffer.from(buffer.asUint8Array()).toString('hex');
    }

    getBalance(code, account, symbol, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.get_currency_balance(code, account, symbol);
    }

    getInfo(httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.get_info({});
    }

    getBlock(blockId, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.get_block(blockId);
    }

    getActions(req, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.history_get_actions(req.account_name, req.pos, req.offset);
    }

    getAccount(name, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.get_account(name);
    }

    getKeyAccounts(publicKey, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        return rpc.history_get_key_accounts(publicKey);
    }

    getTableRows(code, scope, table, tableKey, lowerBound, limit, keyType, indexPosition, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});

        const params = {
            json : true,
            code : code,
            scope : scope,
            table : table,
            table_key : tableKey,
            lower_bound : lowerBound,
            // upper_bound : lowerBound,
            // upper_bound: {type : "string", default: '-1'},
            limit : limit,
            key_type : keyType,
            index_position : indexPosition
        };

        return rpc.get_table_rows(params);
    }

    getProducers(lowerBound, limit, httpEndpoint) {
        const options = this.getOptions({httpEndpoint});
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        const params = {
            json : true,
            lower_bound : lowerBound,
            limit : limit || 1000
        };
        return rpc.get_producers(params);
    }

    transact(transaction, _options) {
        const options = this.getOptions(_options);
        const rpc = new JsonRpc(options.httpEndpoint, {fetch});
        const signatureProvider = new JsSignatureProvider([options.keyProvider]);
        const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

        return api.transact(transaction, options);
    }
}

module.exports = EosApi;
