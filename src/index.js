#!/usr/bin/env node
const program = require('commander')
const ethers = require('ethers')
const _ =  require('lodash')
const chalk = require('chalk')

const Pool = require('./abis/Pool.json')

program
  .option('-c --count [number]', 'number of winners to calculate', 100)
  .option('-n --network [name]', 'network name', 'mainnet')
  .option('-a --address [ethereum address]', 'pool contract address', '0xb7896fce748396EcFC240F5a0d3Cc92ca42D7d84')

program.parse(process.argv)


const provider = ethers.getDefaultProvider(program.network)

const pool = new ethers.Contract(program.address, Pool, provider)

async function randomWinner() {
  const entropy = ethers.utils.randomBytes(32)
  const winner = await pool.calculateWinner(entropy) 
  return winner
}

const promises = []
for (let i = 0; i < program.count; i++) {
  promises.push(randomWinner())
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
    const message = `${address}: won ${percentage.toFixed(2)}% of prizes`
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
