var express = require('express');
var router = express.Router();

const EthereumController = require('../controllers/ethereum');

const ethereumController = new EthereumController(process.env.ETHEREUM_NODE_URL);

router.put('/transactions/send', async (req, res, next) => {
  const { config, data } = req.body;
  const { contractAddress } = req.query;

  const senderInfo = data[0];
  try {
    const txInfo = await ethereumController.sendTransaction(
      config.address, config.privateKey, senderInfo.address, Number(senderInfo.amount), contractAddress
    );
    res.send({ txInfo });
  } catch (err) {
    res.status(400).send({ msg: err.message });
  }
});

module.exports = router;