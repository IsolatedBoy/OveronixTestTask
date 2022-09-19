var express = require('express');
var router = express.Router();
var BitcoinController = require('../controllers/bitcoin');
var BitcoinBlockIoController = require('../controllers/bitcoin-block-io');

const bitcoinController = new BitcoinController();
const bitcoinBlockIoController = new BitcoinBlockIoController();
let index = 0;
/* GET home page. */
router.put('/transactions/send', async (req, res, next) => {
  index++;
  console.log(req.body)
  const { config, data } = req.body;
  let unspentTxs;
  try {
    unspentTxs = await bitcoinController.getTxUnspent(config.address);
  } catch (err) {
    console.log(err)
    return res.status(400).send({
      msg: 'Invalid address'
    });
  }

  if (
    (!unspentTxs.txrefs || !unspentTxs.txrefs.length) &&
    (!unspentTxs.unconfirmed_txrefs || !unspentTxs.unconfirmed_txrefs.length)
  ) {
    return res.status(500).send({
      msg: 'No available unspent txs'
    });
  };
  try {
    const txHash = await bitcoinController.generateTransaction(
      unspentTxs, config.address, config.privateKey, data, !!config.wif
    );
    if (index%2) {
      return res.status(500).send({
        msg: 'Unexpected error'
      })
    }
    res.send({ txHash });
  } catch (err) {
    console.log(err)
    res.status(400).send({ msg: err });
  }
});

router.post('/block-io/tranasctions/send', async (req, res, next) => {
  const { secrets, data } = req.body;
  const bitcoinBlockIoController = new BitcoinBlockIoController(secrets.apiKey, secrets.pin);
  try {
    const { addressFrom, ouptputsInfo } = data;
    const txInfo = await bitcoinBlockIoController.generateTransaction(addressFrom, ouptputsInfo);
    res.send(txInfo);
  } catch (err) {
    let errMessage = err.toJSON();
    if (err?.response?.data) {
      errMessage = err?.response?.data;
    }
    res.status(400).send(errMessage);
  };
});

router.post('/block-io/set-config', async (req, res, next) => {
  const { apiKey, pin } = req.body;
  bitcoinBlockIoController.apiKey = apiKey;
  bitcoinBlockIoController.pin = pin;
})

module.exports = router;
