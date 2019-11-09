const ethers = require('ethers')

module.exports = function generateSecret(poolSeed, drawId) {
  return ethers.utils.solidityKeccak256(['bytes32', 'uint256'], [poolSeed, drawId])
}