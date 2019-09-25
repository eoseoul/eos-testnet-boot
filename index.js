'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path'),
    parseArgs = require('minimist'),
    fetch = require('node-fetch'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data'),
    // util = require('util'),
    wps = require('./wps');

fetch.Promise = Promise;

Promise.resolve(bootNode())
    .then(() => {
        console.log('build complete~~');
    })
    .catch((err) => {
        console.log(err);
    })
    .delay(500);


const dummy = Object.assign({}, {}, data);

async function bootNode() {
    const argv = parseArgs(process.argv.splice(2));
    const stage = argv.s;
    const params = {};
    if (argv.v) {
        params.v = argv.v;
    }
    if (argv.n) {
        params.n = argv.n;
    }

    if (stage === 'boot') {
        await schedule_protocol_feature_activations();
        await Promise.delay(1000);

        await createSystemAccounts();
        await Promise.delay(2000);

        await deployBiosContract();
        await Promise.delay(1000);

        await setPriv();
        await Promise.delay(2000);

        await deployTokenContract();
        await Promise.delay(2000);

        await createAndIssueSystemToken();
        await Promise.delay(4000);

        await deploySystemContract();
        await Promise.delay(1000);

        await initSystem();
        await Promise.delay(1000);

        await deployRexAbifunction();
        await Promise.delay(1000);

        await createNewAccounts();
        await Promise.delay(1000);

        await regProducers();
        await Promise.delay(1000);

        await transfers();
        await Promise.delay(1000);

        await buyRams();
        await Promise.delay(1000);

        await delegatebws();
        await Promise.delay(1000);

        await voteproducers();

        // await updateauths();
    } else if (stage === 'activate') {
        await activate();
    } else if (stage === 'wps') {
        await deployWpsContract();
        await wps.flowWps();
    }
}

function schedule_protocol_feature_activations() {
    console.log('schedule_protocol_feature_activations');
    return fetch('http://127.0.0.1:8888/v1/producer/schedule_protocol_feature_activations', {
        method: 'post',
        body:    JSON.stringify({protocol_features_to_activate : ['0ec7e080177b2c02b278d5088611686b49d739925a92d9bfcacd7fc6b74053bd']}),
        headers: { 'Content-Type': 'application/json' }
    })
    .then((res) => res.text())
    .then((body) => console.log(body));
}

function activate() {
    console.log('activate feature_activations ');
    const authorization = eosApi.createAuthorization('eosio', 'active');
    // console.log(eosApi.Serialize.stringToSymbol('4,EOS'));
    const activateAction = eosApi.createAction('eosio', 'activate', {
        feature_digest : '0ec7e080177b2c02b278d5088611686b49d739925a92d9bfcacd7fc6b74053bd',
    }, authorization);
    return Promise.resolve(eosApi.transact({actions : [activateAction]}));
}

function createSystemAccounts() {
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
    });
}

function deployBiosContract() {
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
}

function setPriv() {
    console.log('setpriv');
    return Promise.each(dummy.systemAccounts, (account) => {
        console.log(`setpriv ${account.name}.`);

        const authorization = eosApi.createAuthorization('eosio', 'active');
        return Promise.resolve(eosApi.setpriv({account : account.name, is_priv : 1}, authorization));
    })
    .delay(2000);
}

function deployTokenContract() {
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
}

function createAndIssueSystemToken() {
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
}

function deploySystemContract() {
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
}

function initSystem() {
    console.log('init eosio.system');
    const authorization = eosApi.createAuthorization('eosio', 'active');
    // console.log(eosApi.Serialize.stringToSymbol('4,EOS'));
    const initAction = eosApi.createAction('eosio', 'init', {
        version : 0,
        core : '4,EOS'
        //core : eosApi.Serialize.stringToSymbol('4,EOS')
    }, authorization);
    return Promise.resolve(eosApi.transact({actions : [initAction]}));
}

function deployRexAbifunction() {
    console.log('deploy rex.results.abi');
    const authorization = eosApi.createAuthorization('eosio.rex', 'active');
    const abiPath = path.join(__dirname, 'contract', 'eosio.system/.rex/rex.results.abi');
    return eosApi.deployAbi('eosio.rex', abiPath, authorization);
}

function createNewAccounts() {
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
            console.log(`prod newaccount ${newAccount.name}`);

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
}

function regProducers() {
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
}

function transfers() {
    console.log('transfer ===>');
    return Promise.each(dummy.transfers, (transfer) => {
        console.log(`transfer ${transfer.to}`);

        const authorization = eosApi.createAuthorization('eosio', 'active');
        return Promise.resolve(eosApi.transfer(transfer, 'eosio.token', authorization));
    });
}

function buyRams() {
    console.log('buyram ===>');
    return Promise.each(dummy.buyRams, (ram) => {
        console.log(`buyram ${ram.receiver}`);

        const user = _.find(data.accounts.users, {name : ram.payer});

        const authorization = eosApi.createAuthorization(ram.payer, 'active');
        return Promise.resolve(eosApi.buyram(ram, authorization, {keyProvider : user.pvt}));
    });
}

function delegatebws() {
    console.log('delegatebw ===>');
    return Promise.each(dummy.delegates, (delegate) => {
        console.log(`delegatebw ${delegate.receiver}`);

        const user = _.find(data.accounts.users, {name : delegate.from});

        const authorization = eosApi.createAuthorization(delegate.from, 'active');
        return Promise.resolve(eosApi.delegatebw(delegate, authorization, {keyProvider : user.pvt}));
    });
}

function voteproducers() {
    console.log('voteproducers ===>');
    return Promise.each(dummy.votes, (vote) => {
        console.log(`voteproducer ${vote.voter}`);

        const user = _.find(data.accounts.users, {name : vote.voter});
        vote.producers = vote.producers.sort();

        const authorization = eosApi.createAuthorization(vote.voter, 'active');
        return Promise.resolve(eosApi.voteproducer(vote, authorization, {keyProvider : user.pvt}));
    });
}

function updateauths() {
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
}

function deployWpsContract() {
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
}
