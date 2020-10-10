(() => {
  //Step_Three

  const MESSAGE_TYPE = {
    SDP: "SDP",
    CANDIDATE: "CANDIDATE",
  };

  document.addEventListener("click", async (event) => {
    if (event.target.id === "start_step3") {
      startChat();
    }
  });

  const startChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      showChatRoom();

      const signaling = new WebSocket("ws://192.168.0.112:3000");
      const peerConnection = createPeerConnection(signaling);

      addMessageHandler(signaling, peerConnection);

      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));
      document.getElementById("self-view").srcObject = stream;
    } catch (err) {
      console.error(err);
    }
  };

  const createPeerConnection = (signaling) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.test.com:19000" }],
    });

    peerConnection.onnegotiationneeded = async () => {
      await createAndSendOffer();
    };

    peerConnection.onicecandidate = (iceEvent) => {
      if (iceEvent && iceEvent.candidate) {
        signaling.send(
          JSON.stringify({
            message_type: MESSAGE_TYPE.CANDIDATE,
            content: iceEvent.candidate,
          })
        );
      }
    };

    peerConnection.ontrack = (event) => {
      const video = document.getElementById("remote-view");
      if (!video.srcObject) {
        video.srcObject = event.streams[0];
      }
    };

    return peerConnection;
  };

  const addMessageHandler = (signaling, peerConnection) => {
    signaling.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (!data) {
        return;
      }

      const { message_type, content } = data;
      try {
        if (message_type === MESSAGE_TYPE.CANDIDATE && content) {
          await peerConnection.addIceCandidate(content);
        } else if (message_type === MESSAGE_TYPE.SDP) {
          if (content.type === "offer") {
            await peerConnection.setRemoteDescription(content);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            signaling.send(
              JSON.stringify({
                message_type: MESSAGE_TYPE.SDP,
                content: answer,
              })
            );
          } else if (content.type === "answer") {
            await peerConnection.setRemoteDescription(content);
          } else {
            console.log("Unsupported SDP type.");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
  };

  const createAndSendOffer = async (signaling, peerConnection) => {
    const offer = await peerConnection.createOffer();
    console.log("offer ", offer);
    await peerConnection.setLocalDescription(offer);

    signaling.send(
      JSON.stringify({ message_type: MESSAGE_TYPE.SDP, content: offer })
    );
  };

  const showChatRoom = () => {
    document.getElementById("start").style.display = "none";
    document.getElementById("chat-room").style.display = "block";
  };

  // Step_Two
  let connection;

  const enableAndDisableButtons = (connected) => {
    document.getElementById("start_step2").disabled = connected;
    document.getElementById("sayHello").disabled = !connected;
    document.getElementById("close").disabled = !connected;
  };

  const setupWebSocketConnection = () => {
    connection = new WebSocket("ws://192.168.0.112:3000");

    connection.onopen = () => {
      addMessageToConsole("You are now connected!");
      enableAndDisableButtons(true);
    };

    connection.onerror = (error) => {
      console.log(`An error occured: ${error}`);
    };

    connection.onmessage = (message) => {
      const data = JSON.parse(message.data);
      addMessageToConsole(`Client${data.client} says: ${data.text}`);
    };
  };

  const closeConnection = () => {
    connection.close();
    addMessageToConsole("You disconnected!");
    enableAndDisableButtons(false);
  };

  const addMessageToConsole = (message) => {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    document.getElementById("console").appendChild(messageDiv);
  };
  document.addEventListener("click", async (event) => {
    if (event.target.id === "start_step2") {
      setupWebSocketConnection();
    } else if (event.target.id === "sayHello") {
      console.log("Message sended");
      connection.send("Hello!");
    } else if (event.target.id === "close") {
      closeConnection();
    }
  });

  // Step_One
  document
    .getElementById("startVideoBtn")
    .addEventListener("click", async () => {
      try {
        const videoTag = document.getElementById("videoTag");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("stream ", stream);
        videoTag.srcObject = stream;
        videoTag.play();
      } catch (error) {
        alert(error.message);
        console.error(error);
      }
    });
})();
