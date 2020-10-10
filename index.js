const http = require("http");
const server = require("websocket").server;
const port = 3000;
let ipAddress;

require("dns").lookup(require("os").hostname(), function (err, add, fam) {
  ipAddress = add;

  const httpServer = http.createServer(() => {});
  httpServer.listen(port, ipAddress, () => {
    console.log(`Server listening at http://${ipAddress}:${port}`);
  });

  const wsServer = new server({
    httpServer,
  });

  let clients = [];

  wsServer.on("request", (request) => {
    console.log("request ", request);
    const connection = request.accept();
    const id = Math.floor(Math.random() * 100);

    clients.forEach((client) =>
      client.connection.send(
        JSON.stringify({
          client: id,
          text: "I am now connected",
        })
      )
    );

    clients.push({ connection, id });

    connection.on("message", (message) => {
      clients
        .filter((client) => client.id !== id)
        .forEach((client) =>
          client.connection.send(
            JSON.stringify({
              client: id,
              text: message.utf8Data,
            })
          )
        );
    });

    connection.on("close", () => {
      clients = clients.filter((client) => client.id !== id);
      clients.forEach((client) =>
        client.connection.send(
          JSON.stringify({
            client: id,
            text: "I disconnected",
          })
        )
      );
    });
  });
});
