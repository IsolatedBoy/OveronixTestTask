const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

class BitcoinController {
  privateKey = process.env.PRIVATE_KEY
  address = process.env.ADDRESS
  providerUrl = 'https://api.blockcypher.com/v1/btc/test3'
  apiKey=process.env.BLOCKCYPHER_API_KEY
  defaultFee = 10000 // it will be 0.0001 BTC
  _calculateChange (balance, amountToSend) {
    return balance-this.defaultFee-amountToSend;
  }
  async _sendTransaction (txHex) {
    const result = await axios.post(`${this.providerUrl}/txs/push?token=${this.apiKey}`, {
      tx: txHex
    });
    return result.data.tx;
  }
  async getTxUnspent (address) {
    const result = await axios.get(`${this.providerUrl}/addrs/${address}?unspentOnly=true&token=${this.apiKey}`);
    return result.data;
  }
  async getTXHex (txId) {
    const result = await axios.get(`${this.providerUrl}/txs/${txId}?includeHex=true&token=${this.apiKey}`);
    return result.data.hex;
  }
  async generateTransaction (unpentTxs, address, privateKey, outputs, isWiF) {
    let totalAmount = 0;
    outputs.forEach(output => {
      totalAmount += Math.round(output.amount * 10**8);
    });
    const change = this._calculateChange(unpentTxs.final_balance, totalAmount);
    if (totalAmount > unpentTxs.final_balance || change < 0) {
      throw new Error('Not enough balance');
    }
    const keypair = isWiF ?
      bitcoin.ECPair.fromWIF(privateKey, bitcoin.networks.testnet) :
      bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), bitcoin.networks.testnet);
    const tx = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    outputs.forEach(output => {
      tx.addOutput({
        address: output.address,
        value: Math.round(output.amount * 10**8),
      });
      totalAmount += output.amount * 10**8;
    });
    tx.addOutput({
      address: address,
      value: change
    });
    if (unpentTxs.txrefs && unpentTxs.txrefs.length) {
      for (const unpentTx of unpentTxs.txrefs) {
        const txHex = await this.getTXHex(unpentTx.tx_hash);
        tx.addInput({
          hash: unpentTx.tx_hash,
          index: unpentTx.tx_output_n,
          nonWitnessUtxo: Buffer.from(txHex, 'hex')
        });
      }
    }
    if (unpentTxs.unconfirmed_txrefs && unpentTxs.unconfirmed_txrefs.length) {
      for (const unpentTx of unpentTxs.unconfirmed_txrefs) {
        const txHex = await this.getTXHex(unpentTx.tx_hash);

        tx.addInput({
          hash: unpentTx.tx_hash,
          index: unpentTx.tx_output_n,
          nonWitnessUtxo: Buffer.from(txHex, 'hex')
        });
      }
    }
    await tx.signAllInputsAsync(keypair);
    tx.finalizeAllInputs();
    const completedTx = tx.extractTransaction()

    const txHash = completedTx.toHex();

    const pushedTxInfo = await this._sendTransaction(txHash);
    return pushedTxInfo.hash;
  };
}

module.exports = BitcoinController;