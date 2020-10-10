const express = require("express");
const app = express();
const port = 3000;
let ipAddress;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

require("dns").lookup(require("os").hostname(), function (err, add, fam) {
    ipAddress =  add;
    app.listen(port, ipAddress, () => {
        console.log(`Example app listening at http://${ipAddress}:${port}`);
      });
});

