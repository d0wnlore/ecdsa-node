const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1")
const { toHex } = require('ethereum-cryptography/utils');

app.use(cors());
app.use(express.json());

const balances = {
  "04d7bd90f6c8ed923344eaad8c786e1a0793d893d7642b1d3125f9304e248267458437be1db7688d7d5baa069748d692350760c2fa7552a9e4c8fb46c707140875": 100,
  "04563fb60213577bb1a2fcdd792c7d6d2e649e14d89f898109878aae6771cf8deeb3fc3a23ed713fa4fb4be6dffb843d634029aa332bbe35404a3d1e2155a6553c": 50,
  "0494ee47d6e8e79d6f7a31a407498d34463f90db5368728a13f1462f520470cb22d3422ac8ed40fdf27d16163ec175b34e5396c921cd2d126466f93e79ad992ff1": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { message, messageHash, signature, recoveryBit } = req.body;

  const fixedMessageHash = new Uint8Array(Object.values(messageHash))
  const fixedSignature = new Uint8Array(Object.values(signature))

  const publicKey = secp.recoverPublicKey(
    fixedMessageHash,
    fixedSignature,
    recoveryBit
  )

  const isSigned = secp.verify(
    fixedSignature,
    fixedMessageHash,
    publicKey
  )

  if (isSigned) {
    const { amount, recipient } = message;
    const sender = toHex(publicKey);

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
