'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data');

class EosWpsApi extends eosApi.EosApiImp  {
    regcommittee(committee, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.regcommittee(committee, {authorization: authorization});
            });
    }

    regreviewer(reviewer, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.regreviewer(reviewer, {authorization: authorization});
            });
    }

    regproposer(proposer, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.regproposer(proposer, {authorization: authorization});
            });
    }

    regproposal(proposal, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.regproposal(proposal, {authorization: authorization});
            });
    }

    acceptprop(params, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.acceptprop(params, {authorization: authorization});
            });
    }

    rejectprop(params, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.rejectprop(params, {authorization: authorization});
            });
    }

    checkvote(params, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.checkvote(params, {authorization: authorization});
            });
    }

    vote(params, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.vote(params, {authorization: authorization});
            });
    }

    unvote(params, key, authorization) { // eosio.wps contract
        const eos = this.getEos(undefined, key);
        return eos.contract('eosio.wps')
            .then((contract) => {
                return contract.unvote(params, {authorization: authorization});
            });
    }
}

const eosWpsWrap = eosApi.wrap(EosWpsApi);

async function flowWps() {
    const dummy = Object.assign({}, {}, data);

    await function() {
        console.log('create committees');
        return Promise.each(dummy.committees, (committee, index) => {
            console.log(`create committee ${committee.committeeman}.`);
            const user = _.find(data.accounts.users, {name : 'eosio.wps'});
            const authorization = 'eosio.wps';
            console.log(committee);
            return Promise.resolve(eosWpsWrap.regcommittee(committee, user.pvt, authorization))
                .delay(10);
        });
    }();

    await function() {
        console.log('create reviewers');
        return Promise.each(dummy.reviewers, (reviewer) => {
            console.log(`create reviewer ${reviewer.reviewer}.`);
            const user = _.find(data.accounts.users, {name : dummy.committees[0].committeeman});
            console.log(user);
            return Promise.resolve(eosWpsWrap.regreviewer(reviewer, user.pvt, user.name))
                .delay(10);
        });
    }();

    await function() {
        console.log('create proposers');
        return Promise.each(dummy.proposers, (proposer) => {
            console.log(`create proposer ${proposer.account}.`);
            const user = _.find(data.accounts.users, {name : proposer.account});
            return Promise.resolve(eosWpsWrap.regproposer(proposer, user.pvt, proposer.account))
                .delay(10);
        });
    }();

    await function() {
        console.log('create proposals');
        return Promise.each(dummy.proposals, (proposal) => {
            console.log(`create proposal ${proposal.proposer}.`);
            const user = _.find(data.accounts.users, {name : proposal.proposer});
            return Promise.resolve(eosWpsWrap.regproposal(proposal, user.pvt, proposal.proposer))
                .delay(10);
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
            return Promise.resolve(eosWpsWrap.acceptprop(params, user.pvt, reviewer.reviewer))
                .delay(10);
        });
    }();

    await function() {
        console.log('reject proposals');
        return Promise.each(dummy.proposals, (proposal, index) => {
            if (index < 10) {
                return;
            }
            console.log(`reject proposal ${proposal.proposer}.`);
            const reviewer = data.reviewers[0];
            const user = _.find(data.accounts.users, {name : reviewer.reviewer});
            const params = {reviewer : reviewer.reviewer, proposal_id : index + 1, reason : 'test reject'};
            return Promise.resolve(eosWpsWrap.rejectprop(params, user.pvt, reviewer.reviewer))
                .delay(10);
        });
    }();

    await function() {
        console.log('vote proposal');
        return Promise.each(dummy.votes, (_vote, index) => {
            console.log(`vote ${_vote.voter}`);
            const user = _.find(data.accounts.users, {name : _vote.voter});
            const params = {voter : _vote.voter, proposal_id : 1, is_agree : 1};
            if (index > 10) {
                params.is_agree = 0;
                console.log(`vote ${_vote.voter} is disagree`);
            }
            console.log(params);
            return Promise.resolve(eosWpsWrap.vote(params, user.pvt, _vote.voter))
                .delay(10);
        });
    }();

    await function() {
        console.log('unvote proposal');
        return Promise.each(dummy.votes, (vote, index) => {
            if (index < 40) {
                return;
            }
            console.log(`unvote ${vote.voter}`);
            const user = _.find(data.accounts.users, {name : vote.voter});
            const params = {voter : vote.voter, proposal_id : 1};
            return Promise.resolve(eosWpsWrap.unvote(params, user.pvt, vote.voter))
                .delay(10);
        });
    }();

    await function() {
        console.log('check vote');
        const reviewer = data.reviewers[0];
        const user = _.find(data.accounts.users, {name : reviewer.reviewer});
        const params = {reviewer : reviewer.reviewer, proposal_id : 1};
        return Promise.resolve(eosWpsWrap.checkvote(params, user.pvt, reviewer.reviewer))
            .delay(10);
    }();

    await function() {
        console.log('check vote');
        const reviewer = data.reviewers[0];
        const user = _.find(data.accounts.users, {name : reviewer.reviewer});
        const params = {reviewer : reviewer.reviewer, proposal_id : 2};
        return Promise.resolve(eosWpsWrap.checkvote(params, user.pvt, reviewer.reviewer))
            .delay(10);
    }();
}

module.exports = exports = { flowWps };
