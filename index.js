'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data'),
    wps = require('./wps');

bootNode();
// wps.flowWps();

async function bootNode() {
    const dummy = Object.assign({}, {}, data);

    await function() {
        console.log('create systemAccounts');
        return Promise.each(dummy.systemAccounts, (account) => {
            console.log(`create account ${account.name}.`);
            return Promise.resolve(eosApi.newaccount(account))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(eosApi.newaccount(account))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('deploy eosio.bios contract');
        const contractPath = path.join(__dirname, 'contract', 'eosio.bios');
        return eosApi.deployContract('eosio', contractPath)
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            return eosApi.deployContract('eosio', contractPath)
                .catch((err) => {
                    console.log(err);
                });
        });
    }();

    await function() {
        console.log('setpriv');
        return Promise.each(dummy.systemAccounts, (account) => {
            console.log(`setpriv ${account.name}.`);
            return Promise.resolve(eosApi.setpriv({account : account.name, is_priv : 1}))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(eosApi.setpriv({account : account.name, is_priv : 1}))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('deploy eosio.token contract');
        const contractPath = path.join(__dirname, 'contract', 'eosio.token');
        return eosApi.deployContract('eosio.token', contractPath)
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            return eosApi.deployContract('eosio.token', contractPath)
                .catch((err) => {
                    console.log(err);
                });
        });
    }();

    await function() {
        console.log('create and issue system token');
        const Eos = eosApi.getEos();
        return Eos.transaction('eosio.token', (eosio_token) => {
            eosio_token.create('eosio', dummy.systemToken.create, {authorization: 'eosio.token'});
            eosio_token.issue('eosio', dummy.systemToken.issue, 'issue', {authorization: 'eosio'});
        })
        .then((result) => {
            console.log(result);
        });
    }();

    await function() {
        console.log('deploy eosio.system contract');
        const contractPath = path.join(__dirname, 'contract', 'eosio.system');
        return eosApi.deployContract('eosio', contractPath)
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            return eosApi.deployContract('eosio', contractPath)
                .catch((err) => {
                    console.log(err);
                });
        });
    }();

    await function() {
        console.log('create newaccounts');
        return Promise.each(dummy.newEosAccounts, (newAccount) => {
            console.log(`newaccount ${newAccount.name}`);
            const newAccountBuyRam = Object.assign({}, dummy.newAccountBuyRam, {receiver : newAccount.name});
            const newAccountDelegate = Object.assign({}, dummy.newAccountDelegate, {receiver : newAccount.name});
            return Promise.resolve(eosApi.newaccount(newAccount, newAccountBuyRam, newAccountDelegate))
                .delay(10)
                .catch(function(err) {
                    console.log(err);
                });
        })
        .then(() => {
            return Promise.each(dummy.newProdAccounts, (prodAccount) => {
                const newAccountBuyRam = Object.assign({}, dummy.newAccountBuyRam, {receiver : prodAccount.name});
                const newAccountDelegate = Object.assign({}, dummy.newAccountDelegate, {receiver : prodAccount.name});
                console.log(`newaccount ${prodAccount.name}`);
                return Promise.resolve(eosApi.newaccount(prodAccount, newAccountBuyRam, newAccountDelegate))
                    .delay(10)
                    .catch(function(err) {
                        console.log(err);
                    });
            });
        });
    }();

    await function() {
        console.log('regproducers ===>');
        return Promise.each(dummy.regProducers, (_producer) => {
            console.log(`regproducer ${_producer.producer}`);
            const producer = _.find(data.accounts.producers, {name : _producer.producer});
            return Promise.resolve(eosApi.regproducer(_producer, producer.pvt))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

    await function() {
        console.log('transfer ===>');
        return Promise.each(dummy.transfers, (transfer) => {
            console.log(`transfer ${transfer.to}`);
            return Promise.resolve(eosApi.transfer(transfer))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

    await function() {
        console.log('buyram ===>');
        return Promise.each(dummy.buyRams, (ram) => {
            console.log(`buyram ${ram.receiver}`);
            const user = _.find(data.accounts.users, {name : ram.payer});
            return Promise.resolve(eosApi.buyram(ram, user.pvt))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

    await function() {
        console.log('delegatebw ===>');
        return Promise.each(dummy.delegates, (delegate) => {
            console.log(`delegatebw ${delegate.receiver}`);
            const user = _.find(data.accounts.users, {name : delegate.from});
            return Promise.resolve(eosApi.delegatebw(delegate, user.pvt))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

    await function() {
        console.log('voteproducers ===>');
        return Promise.each(dummy.votes, (vote) => {
            console.log(`voteproducer ${vote.voter}`);
            const user = _.find(data.accounts.users, {name : vote.voter});
            vote.producers = vote.producers.sort();
            return Promise.resolve(eosApi.voteproducer(vote, user.pvt))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

    await function() {
        console.log('deploy eosio.wps contract');
        const contractPath = path.join(__dirname, 'contract', 'eosio.wps');
        return eosApi.deployContract('eosio.wps', contractPath, undefined, '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr')
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            return eosApi.deployContract('eosio.wps', contractPath, undefined, '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr')
                .catch((err) => {
                    console.log(err);
                });
        });
    }();

    // await wps.flowWps();

    await function() {
        console.log('updateauth ===>');
        return Promise.each(dummy.authes, (auth) => {
            console.log(`updateauth ${auth.account}`);
            return Promise.resolve(eosApi.updateauth(auth))
            .delay(10)
            .catch(function(err) {
                console.log(err);
            });
        });
    }();

}
