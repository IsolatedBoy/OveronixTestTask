const fs = require('fs');
const Web3 = require('web3');
const tx = require('ethereumjs-tx');
const erc20abi = JSON.parse(fs.readFileSync('./abi/erc20abi.json'));

class EthereumController {
  constructor(nodeUrl) {
    this.tokenDecimals = new Map();
    this.web3Provider = new Web3(new Web3.providers.HttpProvider(nodeUrl));
  }

  async getTransactionsCount(address) {
    return this.web3Provider.eth.getTransactionCount(address, 'pending');
  }

  async broadcastTransaction(rawTx) {
    return this.web3Provider.eth.sendSignedTransaction(rawTx);
  }

  async getTokenDecimals(contractAddress) {
    let decimals = this.tokenDecimals.get(contractAddress);

    if (!decimals) {
      const contract = new this.web3Provider.eth.Contract(erc20abi, contractAddress);
      const stringDecimals = await contract.methods.decimals().call();

      decimals = Math.pow(10, parseInt(stringDecimals));

      this.tokenDecimals.set(contractAddress, decimals);
    }

    return decimals;
  }

  async sendTransaction(addressFrom, privateKey, addressTo, amount, contractAddress) {
    try {
      let data;

      if (contractAddress) {
        const contract = new this.web3Provider.eth.Contract(erc20abi, contractAddress, { from: addressFrom })
        const decimals = await this.getTokenDecimals(contractAddress);

        data = contract.methods.transfer(addressTo, this.web3Provider.utils.toHex(amount * decimals)).encodeABI()
      }

      const transactionsCount = await this.getTransactionsCount(addressFrom);
      const hexAmount = contractAddress ? 0 : this.web3Provider.utils.toHex(amount * 1e18);

      const rawTransaction = {
        from : addressFrom,
        gasPrice : this.web3Provider.utils.toHex(10 * 1e9),
        gasLimit : this.web3Provider.utils.toHex(60000),
        to : contractAddress || addressTo,
        value : hexAmount,
        nonce : this.web3Provider.utils.toHex(transactionsCount),
        data,
      };
  
      const transaction = new tx.Transaction(rawTransaction, {
        chain:'goerli'
      });
  
      transaction.sign(Buffer.from(privateKey, 'hex'));
  
      return this.broadcastTransaction(`0x${transaction.serialize().toString('hex')}`);
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

module.exports = EthereumController;