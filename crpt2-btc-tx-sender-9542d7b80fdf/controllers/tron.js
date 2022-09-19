const EC = require('elliptic').ec;
const axios = require('axios');
const jsSHA = require("jssha");

class TronController {
  tronApiUrl=''
  constructor (apiUrl) {
    this.tronApiUrl = apiUrl;
  }

  async createTransaction(transactionBody) {
    const response = await axios.post(`${this.tronApiUrl}/api/v1/trx/transaction`, transactionBody);
    return response.data;
  }

  async broadcastTransaction(transactionBody) {
    const response = await axios.post(`${this.tronApiUrl}/api/v1/trx/transaction/broadcast`, transactionBody);
    return response.data;
  }

  _stringToHash(txHex) {
    const shaObj = new jsSHA("SHA-256", "HEX");
    shaObj.update(txHex);
    return shaObj.getHash("HEX");
  }

  _byte2hexStr(byte) {
    var hexByteMap = "0123456789ABCDEF";
    var str = "";
    str += hexByteMap.charAt(byte >> 4);
    str += hexByteMap.charAt(byte & 0x0f);
    return str;
  }

  ECKeySign(hashBytes, priKeyBytes) {
    let ec = new EC('secp256k1');
    let key = ec.keyFromPrivate(priKeyBytes, 'bytes');
    let signature = key.sign(hashBytes);
    let r = signature.r;
    let s = signature.s;
    let id = signature.recoveryParam;
  
    let rHex = r.toString('hex');
    while (rHex.length < 64) {
      rHex = "0" + rHex;
    }
    let sHex = s.toString('hex');
    while (sHex.length < 64) {
      sHex = "0" + sHex;
    }
    let idHex = this._byte2hexStr(id);
    let signHex = rHex + sHex + idHex;
    return signHex;
  }

  async sendTransaction(addressFrom, privateKey, addressTo, amount, currencySymbol) {
    try {
      const transactionBody = {
        amount: amount*10**6,
        feeLimit: 10000000000,
        from: addressFrom,
        to: addressTo,
      };
      if (currencySymbol === 'USDT') {
        transactionBody.contract = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
      }

      const res = await this.createTransaction(transactionBody);
      const signedTx = this.ECKeySign(
        this._stringToHash(res.hex),
        Buffer.from(privateKey, 'hex'),
      )

      const result = await this.broadcastTransaction({
        hex: res.hex,
        signature: signedTx,
      })
      return result;

    } catch (err) {
      console.log(err)
      return null;
    }
  }
}

module.exports = TronController;