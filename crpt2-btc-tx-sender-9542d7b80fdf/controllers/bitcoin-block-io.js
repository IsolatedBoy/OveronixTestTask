require('dotenv').config();
const BlockIo = require('block_io');

const axios = require("axios");

class BitcoinBlockIoController {
  apiKey = null;
  pin = null;

  constructor (apiKey = null, pin = null) {
    this.apiKey = apiKey || process.env.BLOCK_IO_API_KEY;
    this.pin = pin || process.env.BLOCK_IO_PIN;
  }

  async generateTransaction (addressFrom, outputsInfo) {
    const config = {
      api_key: this.apiKey,
      version: 2
    }
    const block_io = new BlockIo(config);
    const { data: preparedTx } = await axios.get('https://block.io/api/v2/prepare_transaction/', {
      params: {
        api_key: this.apiKey,
        amounts: outputsInfo.map(outputInfo => outputInfo.amount).join(','),
        to_addresses: outputsInfo.map(outputInfo => outputInfo.address).join(','),
        from_addresses: addressFrom,
        priority: 'high'
      }
    });
    const signedTx = await block_io.create_and_sign_transaction({ data: preparedTx, pin: this.pin });
    const submitedTx = await axios.get(`https://block.io/api/v2/submit_transaction/`, {
      params: {
        api_key: this.apiKey
      },
      data: {
        transaction_data: signedTx
      }
    });

    return submitedTx.data;
  };
}

module.exports = BitcoinBlockIoController;