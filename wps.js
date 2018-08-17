'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data');

function regcommittee(committee, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.regcommittee(committee, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function regreviewer(reviewer, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.regreviewer(reviewer, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function regproposer(proposer, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.regproposer(proposer, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function regproposal(proposal, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.regproposal(proposal, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function acceptprop(params, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.acceptprop(params, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function rejectprop(params, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.rejectprop(params, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function checkvote(params, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.checkvote(params, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function vote(params, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.vote(params, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}

function unvote(params, key, authorization) { // eosio.wps contract
    const eos = eosApi.getEos(undefined, key);
    return eos.contract('eosio.wps')
        .then((contract) => {
            return contract.unvote(params, {authorization: authorization});
        })
        .catch(function(err) {
            if (typeof err === 'string') {
                throw JSON.parse(err);
            }
            throw err;
        });
}


async function flowWps() {
    const dummy = Object.assign({}, {}, data);

    await function() {
        console.log('create committees');
        return Promise.each(dummy.committees, (committee, index) => {
            console.log(`create committee ${committee.committeeman}.`);
            const user = _.find(data.accounts.users, {name : 'eosio.wps'});
            const authorization = 'eosio.wps';
            console.log(committee);
            return Promise.resolve(regcommittee(committee, user.pvt, authorization))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(regcommittee(committee, user.pvt, authorization))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('create reviewers');
        return Promise.each(dummy.reviewers, (reviewer) => {
            console.log(`create reviewer ${reviewer.reviewer}.`);
            const user = _.find(data.accounts.users, {name : dummy.committees[0].committeeman});
            console.log(user);
            return Promise.resolve(regreviewer(reviewer, user.pvt, user.name))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(regreviewer(reviewer, user.pvt, user.name))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('create proposers');
        return Promise.each(dummy.proposers, (proposer) => {
            console.log(`create proposer ${proposer.account}.`);
            const user = _.find(data.accounts.users, {name : proposer.account});
            return Promise.resolve(regproposer(proposer, user.pvt, proposer.account))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(regproposer(proposer, user.pvt, proposer.account))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('create proposals');
        return Promise.each(dummy.proposals, (proposal) => {
            console.log(`create proposal ${proposal.proposer}.`);
            const user = _.find(data.accounts.users, {name : proposal.proposer});
            return Promise.resolve(regproposal(proposal, user.pvt, proposal.proposer))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(regproposal(proposal, user.pvt, proposal.proposer))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('accept proposals');
        return Promise.each(dummy.proposals, (proposal, index) => {
            if (index > 4) {
                return;
            }
            console.log(`accept proposal ${proposal.proposer}.`);
            const reviewer = data.reviewers[0];
            const user = _.find(data.accounts.users, {name : reviewer.reviewer});
            const params = {reviewer : reviewer.reviewer, proposal_id : index + 1};
            return Promise.resolve(acceptprop(params, user.pvt, reviewer.reviewer))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(acceptprop(params, user.pvt, reviewer.reviewer))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('reject proposals');
        return Promise.each(dummy.proposals, (proposal, index) => {
            if (index < 4) {
                return;
            }
            console.log(`reject proposal ${proposal.proposer}.`);
            const reviewer = data.reviewers[0];
            const user = _.find(data.accounts.users, {name : reviewer.reviewer});
            const params = {reviewer : reviewer.reviewer, proposal_id : index + 1, reason : 'test reject'};
            return Promise.resolve(rejectprop(params, user.pvt, reviewer.reviewer))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(rejectprop(params, user.pvt, reviewer.reviewer))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('vote proposal');
        return Promise.each(dummy.votes, (_vote, index) => {
            console.log(`vote ${_vote.voter}`);
            const user = _.find(data.accounts.users, {name : _vote.voter});
            const params = {voter : _vote.voter, proposal_id : 1, is_agree : 1};
            if (index > 40) {
                params.is_agree = 0;
                console.log(`vote ${_vote.voter} is disagree`);
            }
            console.log(params);
            return Promise.resolve(vote(params, user.pvt, _vote.voter))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(vote(params, user.pvt, _vote.voter))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('unvote proposal');
        return Promise.each(dummy.votes, (vote, index) => {
            if (index < 3) {
                return;
            }
            console.log(`unvote ${vote.voter}`);
            const user = _.find(data.accounts.users, {name : vote.voter});
            const params = {voter : vote.voter, proposal_id : 1};
            return Promise.resolve(unvote(params, user.pvt, vote.voter))
                .delay(10)
                .catch(function(err) {
                    return Promise.resolve(unvote(params, user.pvt, vote.voter))
                        .catch(function(err) {
                            console.log(err);
                        });
                });
        });
    }();

    await function() {
        console.log('check vote');
        const reviewer = data.reviewers[0];
        const user = _.find(data.accounts.users, {name : reviewer.reviewer});
        const params = {reviewer : reviewer.reviewer, proposal_id : 1};
        return Promise.resolve(checkvote(params, user.pvt, reviewer.reviewer))
            .delay(10)
            .catch(function(err) {
                return Promise.resolve(checkvote(params, user.pvt, reviewer.reviewer))
                    .catch(function(err) {
                        console.log(err);
                    });
            });
    }();

}

module.exports = exports = { flowWps };
