const ethers = require('ethers')

module.exports = function generateSecretHash(secret, salt) {
  return ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], [secret, salt])
}