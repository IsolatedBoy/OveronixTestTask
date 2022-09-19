var express = require('express');
var router = express.Router();

const TronController = require('../controllers/tron');

const tronController = new TronController(process.env.TRON_API_URL);

router.put('/transactions/send', async (req, res, next) => {
  const { config, data } = req.body;

  const senderInfo = data[0];
  try {
    const txInfo = await tronController.sendTransaction(
      config.address, config.privateKey, senderInfo.address, Number(senderInfo.amount), req.query.currencySymbol,
    );
    if (!txInfo) {
      res.status(400).send({ error: "Cannot send transaction" });
    }
    res.send({ txInfo });
  } catch (err) {
    console.log(err)
    res.status(400).send({ msg: err.message });
  }
});

module.exports = router;