#!/usr/bin/env node
const program = require('commander')
const ethers = require('ethers')
const _ =  require('lodash')
const chalk = require('chalk')
const generateSecret = require('./generateSecret')
const generateSecretHash = require('./generateSecretHash')

const Pool = require('./abis/Pool.json')

program
  .option('-c --count [number]', 'number of winners to calculate', 100)
  .option('-n --network [name]', 'network name', 'mainnet')
  .option('-s --secretSeed [hex encoded 256 bit value]', 'use a secret to generate all draw values.  i.e. 0x2a026f2c09a3591d03c7c61b7d58a96c600bbacb0f1362981a93cda3747a0bb4')
  .option('-a --address [ethereum address]', 'pool contract address', '0xb7896fce748396EcFC240F5a0d3Cc92ca42D7d84')

program.parse(process.argv)

const provider = ethers.getDefaultProvider(program.network)

const pool = new ethers.Contract(program.address, Pool, provider)

let nextDrawId = 1

function nextRandomNumber() {
  let entropy
  if (program.secretSeed) {
    entropy = generateSecret(program.secretSeed, nextDrawId)
    nextDrawId += 1
  } else {
    entropy = ethers.utils.randomBytes(32)
  }
  return entropy
}

async function randomWinner(entropy) {
  const winner = await pool.calculateWinner(entropy) 
  return winner
}

const promises = []
for (let i = 0; i < program.count; i++) {
  promises.push(randomWinner(nextRandomNumber()))
}

Promise.all(promises).then(function (winners) {

  const grouped = _.groupBy(winners)

  const addresses = Object.keys(grouped)

  addresses.sort((a, b) => {
    if (grouped[a].length < grouped[b].length) {
      return 1;
    } else if (grouped[a].length > grouped[b].length) {
      return -1;
    }
    return 0;
  })

  addresses.forEach((address, index) => {
    const count = grouped[address].length
    const percentage = 100.0 * count / program.count
    const message = `${address}, ${percentage.toFixed(1)}%, ${count}`
    const percentile = (index * 1.0) / addresses.length
    if (percentile < 0.25) {
      console.log(chalk.green(message))
    } else if (percentile < 0.5) {
      console.log(chalk.yellow(message))
    } else if (percentile < 0.75) {
      console.log(chalk.magenta(message))
    } else {
      console.log(chalk.red(message))
    }
  })
})
