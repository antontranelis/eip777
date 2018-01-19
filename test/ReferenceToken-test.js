/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TestRPC = require('ethereumjs-testrpc');
const Web3 = require('web3');
const chai = require('chai');
const EIP820 = require('eip820');
const TokenableContractsRegistry = require('../js/TokenableContractsRegistry');
const ReferenceToken = require('../js/ReferenceToken');
const assert = chai.assert;
const { utils } = Web3;
chai.use(require('chai-as-promised')).should();


describe('EIP777 Reference Token Test', () => {
  let testrpc;
  let web3;
  let accounts;
  let referenceToken;
  let tokenableContractsRegistry;
  let interfaceImplementationRegistry;
  let util;

  before(async () => {
    testrpc = TestRPC.server({ws: true, gasLimit: 5800000, total_accounts: 10});
    testrpc.listen(8546, '127.0.0.1');

    web3 = new Web3('ws://localhost:8546');
    accounts = await web3.eth.getAccounts();

    interfaceImplementationRegistry = await EIP820.deploy(web3, accounts[0]);
    assert.ok(interfaceImplementationRegistry.$address);
  });

  after(async () => await testrpc.close());

  it('should deploy the reference token contract', async () => {
    tokenableContractsRegistry = await TokenableContractsRegistry.new(web3);
    assert.ok(tokenableContractsRegistry.$address);

    referenceToken = await ReferenceToken.new(
      web3,
      'Reference Token',
      'XRT',
      web3.utils.toWei("0.01"),
      tokenableContractsRegistry.$address
    );
    assert.ok(referenceToken.$address);

    util = require('./util')(web3, referenceToken);
    util.getBlock();

    const name = await referenceToken.name();
    assert.strictEqual(name, 'Reference Token');
    util.log(`name: ${name}`);

    const symbol = await referenceToken.symbol();
    assert.strictEqual(symbol, 'XRT');
    util.log(`symbol: ${symbol}`);

    const granularity = await referenceToken.granularity();
    assert.strictEqual(web3.utils.fromWei(granularity), '0.01');
    util.log(`granularity: ${granularity}`);

    util.assertTotalSupply(0);
  }).timeout(20000);

  it('should mint 10 XRT for addr 1', async () => {
    await referenceToken.ownerMint(accounts[1], web3.utils.toWei("10"), '0x', {
      gas: 300000,
      from: accounts[0]
    });
    util.getBlock();

    util.assertTotalSupply(10);
    util.assertBalance(accounts[1], 10);
  }).timeout(6000);

  it('should let addr 1 send 3 XRT to addr 2', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei("3"), {
      gas: 300000,
      from: accounts[1]
    });
    util.getBlock();

    util.assertTotalSupply(10);
    util.assertBalance(accounts[1], 7);
    util.assertBalance(accounts[2], 3);
  }).timeout(6000);

    getBlock();

    const totalSupply = await referenceToken.totalSupply();
    assert.equal(web3.utils.fromWei(totalSupply), 10);
    log(`totalSupply: ${web3.utils.fromWei(totalSupply)}`);

    const balance1 = await referenceToken.balanceOf(accounts[1]);
    assert.equal(web3.utils.fromWei(balance1), 7);
    log(`balance[${accounts[1]}]: ${web3.utils.fromWei(balance1)}`);

    const balance2 = await referenceToken.balanceOf(accounts[2]);
    assert.equal(web3.utils.fromWei(balance2), 3);
    log(`balance[${accounts[2]}]: ${web3.utils.fromWei(balance2)}`);
  }).timeout(6000);

  it('should not send -3 tokens from address 1 to address 2', async () => {
    await referenceToken.send(accounts[2], web3.utils.toWei("-3"), {
      gas: 300000,
      from: accounts[1]
    }).should.be.rejectedWith('invalid opcode');

    getBlock();

    const totalSupply = await referenceToken.totalSupply();
    assert.equal(web3.utils.fromWei(totalSupply), 10);
    log(`totalSupply: ${web3.utils.fromWei(totalSupply)}`);

    const balance1 = await referenceToken.balanceOf(accounts[1]);
    assert.equal(web3.utils.fromWei(balance1), 7);
    log(`balance[${accounts[1]}]: ${web3.utils.fromWei(balance1)}`);

    const balance2 = await referenceToken.balanceOf(accounts[2]);
    assert.equal(web3.utils.fromWei(balance2), 3);
    log(`balance[${accounts[2]}]: ${web3.utils.fromWei(balance2)}`);
  }).timeout(6000);
});
