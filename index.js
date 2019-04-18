'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data');
    // util = require('util'),
    // wps = require('./wps');

bootNode();

async function bootNode() {
    const dummy = Object.assign({}, {}, data);
    await function() {
        console.log('create systemAccounts');
        return Promise.each(dummy.systemAccounts, (account) => {
            console.log(`create account ${account.name}.`);

            const authorization = eosApi.createAuthorization('eosio', 'active');
            const newaccountAction = eosApi.createAction('eosio', 'newaccount', account, authorization);
            return Promise.resolve(eosApi.newaccount(newaccountAction))
                .catch((err) => {
                    if (err.error && err.error.code === 3050001) { // already exist
                        console.log(err.error.what);
                        return;
                    }
                    throw err;
                });
        })
        .delay(1000);
    }();

    await function() {
        console.log('deploy eosio.bios contract');
        const authorization = eosApi.createAuthorization('eosio', 'active');
        const contractPath = path.join(__dirname, 'contract', 'eosio.bios');
        return eosApi.deployContract('eosio', contractPath, authorization)
        .catch((err) => {
            if (err.error && err.error.code === 3160008) { // set_exact_code: Contract is already running this version
                console.log(err.error.what);
                return;
            }
            throw err;
        });
    }();

    await function() {
        console.log('setpriv');
        return Promise.each(dummy.systemAccounts, (account) => {
            console.log(`setpriv ${account.name}.`);

            const authorization = eosApi.createAuthorization('eosio', 'active');
            return Promise.resolve(eosApi.setpriv({account : account.name, is_priv : 1}, authorization));
        })
        .delay(2000);
    }();

    await function() {
        console.log('deploy eosio.token contract');

        const authorization = eosApi.createAuthorization('eosio.token', 'active');
        const contractPath = path.join(__dirname, 'contract', 'eosio.token');
        return Promise.resolve(eosApi.deployContract('eosio.token', contractPath, authorization))
        .delay(2000)
        .catch((err) => {
            if (err.error && err.error.code === 3160008) { // set_exact_code: Contract is already running this version
                console.log(err.error.what);
                return;
            }
            throw err;
        });
    }();

    await function() {
        console.log('create and issue system token');

        const authorization = eosApi.createAuthorization('eosio.token', 'active');
        const data = {
            issuer : 'eosio',
            maximum_supply : dummy.systemToken.create
        };
        return eosApi.create(data, 'eosio.token', authorization)
            .then(() => {
                const authorization = eosApi.createAuthorization('eosio', 'active');
                const data = {
                    to : 'eosio',
                    quantity : dummy.systemToken.issue,
                    memo : 'boot sequence'
                };
                return eosApi.issue(data, 'eosio.token', authorization);
            });
    }();

    await function() {
        console.log('deploy eosio.system contract');

        const authorization = eosApi.createAuthorization('eosio', 'active');
        const contractPath = path.join(__dirname, 'contract', 'eosio.system');
        return eosApi.deployContract('eosio', contractPath, authorization)
        .catch((err) => {
            if (err.error && err.error.code === 3160008) { // set_exact_code: Contract is already running this version
                console.log(err.error.what);
                return;
            }
            throw err;
        });
    }();

    await function() {
        console.log('create newaccounts');
        return Promise.each(dummy.newEosAccounts, (newAccount) => {
            console.log(`newaccount ${newAccount.name}`);

            const authorization = eosApi.createAuthorization('eosio', 'active');

            const newAccountBuyRam = Object.assign({}, dummy.newAccountBuyRam, {receiver : newAccount.name});
            const newAccountDelegate = Object.assign({}, dummy.newAccountDelegate, {receiver : newAccount.name});

            const newaccountAction = eosApi.createAction('eosio', 'newaccount', newAccount, authorization);
            const buyramAction = eosApi.createAction('eosio', 'buyram', newAccountBuyRam, authorization);
            const delegatebwAction = eosApi.createAction('eosio', 'delegatebw', newAccountDelegate, authorization);

            return Promise.resolve(eosApi.newaccount(newaccountAction, buyramAction, delegatebwAction))
                .catch((err) => {
                    console.log(err);
                    if (err.error.code === 3050001) { // already exist
                        console.log(err.error.what);
                        return;
                    }
                    throw err;
                });
        })
        .then(() => {
            return Promise.each(dummy.newProdAccounts, (newAccount) => {
                console.log(`newaccount ${newAccount.name}`);

                const authorization = eosApi.createAuthorization('eosio', 'active');

                const newAccountBuyRam = Object.assign({}, dummy.newAccountBuyRam, {receiver : newAccount.name});
                const newAccountDelegate = Object.assign({}, dummy.newAccountDelegate, {receiver : newAccount.name});

                const newaccountAction = eosApi.createAction('eosio', 'newaccount', newAccount, authorization);
                const buyramAction = eosApi.createAction('eosio', 'buyram', newAccountBuyRam, authorization);
                const delegatebwAction = eosApi.createAction('eosio', 'delegatebw', newAccountDelegate, authorization);

                return Promise.resolve(eosApi.newaccount(newaccountAction, buyramAction, delegatebwAction))
                .catch((err) => {
                    if (err.error.code === 3050001) { // already exist
                        console.log(err.error.what);
                        return;
                    }
                    throw err;
                });
            });
        });
    }();

    await function() {
        console.log('regproducers ===>');
        return Promise.each(dummy.regProducers, (_producer) => {
            console.log(`regproducer ${_producer.producer}`);

            const producer = _.find(data.accounts.producers, {name : _producer.producer});

            const authorization = eosApi.createAuthorization(_producer.producer, 'active');
            return Promise.resolve(eosApi.regproducer(_producer, authorization, {keyProvider : producer.pvt}))
            .catch(function(err) {
                console.log(err);
                throw err;
            });
        });
    }();

    await function() {
        console.log('transfer ===>');
        return Promise.each(dummy.transfers, (transfer) => {
            console.log(`transfer ${transfer.to}`);

            const authorization = eosApi.createAuthorization('eosio', 'active');
            return Promise.resolve(eosApi.transfer(transfer, 'eosio.token', authorization))
            .then((result) => {
                // console.log(result);
            });
        });
    }();

    await function() {
        console.log('buyram ===>');
        return Promise.each(dummy.buyRams, (ram) => {
            console.log(`buyram ${ram.receiver}`);

            const user = _.find(data.accounts.users, {name : ram.payer});

            const authorization = eosApi.createAuthorization(ram.payer, 'active');
            return Promise.resolve(eosApi.buyram(ram, authorization, {keyProvider : user.pvt}));
        });
    }();

    await function() {
        console.log('delegatebw ===>');
        return Promise.each(dummy.delegates, (delegate) => {
            console.log(`delegatebw ${delegate.receiver}`);

            const user = _.find(data.accounts.users, {name : delegate.from});

            const authorization = eosApi.createAuthorization(delegate.from, 'active');
            return Promise.resolve(eosApi.delegatebw(delegate, authorization, {keyProvider : user.pvt}));
        });
    }();

    await function() {
        console.log('voteproducers ===>');
        return Promise.each(dummy.votes, (vote) => {
            console.log(`voteproducer ${vote.voter}`);

            const user = _.find(data.accounts.users, {name : vote.voter});
            vote.producers = vote.producers.sort();

            const authorization = eosApi.createAuthorization(vote.voter, 'active');
            return Promise.resolve(eosApi.voteproducer(vote, authorization, {keyProvider : user.pvt}));
        });
    }();

    /*
    await function() {
        console.log('deploy eosio.wps contract');

        const contractPath = path.join(__dirname, 'contract', 'eosio.wps');
        const authorization = eosApi.createAuthorization('eosio.wps', 'active');
        const options = {keyProvider : '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr'};

        return eosApi.deployContract('eosio.wps', contractPath, authorization, options)
        .catch((err) => {
            console.log(err);
            if (err.error && err.error.code === 3160008) { // set_exact_code: Contract is already running this version
                console.log(err.error.what);
                return;
            }
            throw err;
        });
    }();

    await wps.flowWps();

    await function() {
        console.log('updateauth ===>');

        return Promise.each(dummy.authes, (auth) => {
            console.log(`updateauth ${auth.account}`);

            const authorization = eosApi.createAuthorization(auth.account, auth.permission);
            return Promise.resolve(eosApi.updateauth(auth, authorization))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();
    */
}
