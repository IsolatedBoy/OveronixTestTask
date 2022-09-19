var express = require('express');
var crypto = require("crypto");
var router = express.Router();

router.put('/transactions/send', async (req, res, next) => {
  return res.send({
    txHash: crypto.randomBytes(64).toString('hex'),
  })
});

module.exports = router;