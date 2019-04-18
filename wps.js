'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    eosApi = require('external_apis/eos_api'),
    data = require('./data');

class EosWpsApi {
    constructor() {
        this.contractName = 'eosio.wps';
    }
    regcommittee(params, keyProvider, actor) {
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'regcommittee', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    regreviewer(params, keyProvider, actor) {
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'regreviewer', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    regproposer(params, keyProvider, actor) {
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'regproposer', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    regproposal(params, keyProvider, actor) {
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'regproposal', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    acceptprop(params, keyProvider, actor) {
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'acceptprop', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    rejectprop(params, keyProvider, actor) { // eosio.wps contract
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'rejectprop', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    checkvote(params, keyProvider, actor) { // eosio.wps contract
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'checkvote', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    vote(params, keyProvider, actor) { // eosio.wps contract
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'vote', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }

    unvote(params, keyProvider, actor) { // eosio.wps contract
        const options = {keyProvider};
        const authorization = eosApi.createAuthorization(actor, 'active');
        const action = eosApi.createAction(this.contractName, 'unvote', params, authorization);
        return eosApi.transact({actions : [action]}, options);
    }
}

const eosWps = new EosWpsApi();

async function flowWps() {
    const dummy = Object.assign({}, {}, data);

    await function() {
        console.log('create committees');
        return Promise.each(dummy.committees, (committee, index) => {
            console.log(`create committee ${committee.committeeman}.`);
            const user = _.find(data.accounts.users, {name : 'eosio.wps'});
            const authorization = 'eosio.wps';
            console.log(committee);
            return Promise.resolve(eosWps.regcommittee(committee, user.pvt, authorization))
                .delay(10);
        });
    }();

    await function() {
        console.log('create reviewers');
        return Promise.each(dummy.reviewers, (reviewer) => {
            console.log(`create reviewer ${reviewer.reviewer}.`);
            const user = _.find(data.accounts.users, {name : dummy.committees[0].committeeman});
            console.log(user);
            return Promise.resolve(eosWps.regreviewer(reviewer, user.pvt, user.name))
                .delay(10);
        });
    }();

    await function() {
        console.log('create proposers');
        return Promise.each(dummy.proposers, (proposer) => {
            console.log(`create proposer ${proposer.account}.`);
            console.log(proposer);
            const user = _.find(data.accounts.users, {name : proposer.account});
            return Promise.resolve(eosWps.regproposer(proposer, user.pvt, proposer.account))
                .delay(10);
        });
    }();

    await function() {
        console.log('create proposals');
        return Promise.each(dummy.proposals, (proposal) => {
            console.log(`create proposal ${proposal.proposer}.`);
            const user = _.find(data.accounts.users, {name : proposal.proposer});
            return Promise.resolve(eosWps.regproposal(proposal, user.pvt, proposal.proposer))
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
            return Promise.resolve(eosWps.acceptprop(params, user.pvt, reviewer.reviewer))
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
            return Promise.resolve(eosWps.rejectprop(params, user.pvt, reviewer.reviewer))
                .delay(10);
        });
    }();

    await function() {
        console.log('vote proposal');
        return Promise.each(dummy.votes, (_vote, index) => {
            console.log(`vote ${_vote.voter}`);
            const user = _.find(data.accounts.users, {name : _vote.voter});
            const params = {voter : _vote.voter, proposal_id : 1, is_agree : true};
            if (index > 10) {
                params.is_agree = false;
                console.log(`vote ${_vote.voter} is disagree`);
            }
            console.log(params);
            return Promise.resolve(eosWps.vote(params, user.pvt, _vote.voter))
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
            return Promise.resolve(eosWps.unvote(params, user.pvt, vote.voter))
                .delay(10);
        });
    }();

    await function() {
        console.log('check vote');
        const reviewer = data.reviewers[0];
        const user = _.find(data.accounts.users, {name : reviewer.reviewer});
        const params = {reviewer : reviewer.reviewer, proposal_id : 1};
        return Promise.resolve(eosWps.checkvote(params, user.pvt, reviewer.reviewer))
            .delay(10);
    }();

    await function() {
        console.log('check vote');
        const reviewer = data.reviewers[0];
        const user = _.find(data.accounts.users, {name : reviewer.reviewer});
        const params = {reviewer : reviewer.reviewer, proposal_id : 2};
        return Promise.resolve(eosWps.checkvote(params, user.pvt, reviewer.reviewer))
            .delay(10);
    }();
}

module.exports = exports = { flowWps };
