/// <reference path="../messages.d.ts" />

/**
 * Hides the given element by setting `display: none`.
 * @param {HTMLElement} element The element to hide
 */
function hideElement(element) {
  element.style.display = "none";
}

/**
 * Shows the given element by resetting the display CSS property.
 * @param {HTMLElement} element The element to show
 */
function showElement(element) {
  element.style.display = "";
}

const callButton = document.getElementById("call-button");
const videoContainer = document.getElementById("video-container");

/**
 * Hides both local and remote video, but shows the "call" button.
 */
function hideVideoCall() {
  hideElement(videoContainer);
  showElement(callButton);
}

/**
 * Shows both local and remote video, and hides the "call" button.
 */
function showVideoCall() {
  hideElement(callButton);
  showElement(videoContainer);
}

/** @type {string} */
let otherPerson;

const username = `teacher${Math.floor(Math.random() * 100)}`; // prompt("What's your name?", `user${Math.floor(Math.random() * 100)}`);
const socketUrl = `wss://${location.host}/ws`;
const socket = new WebSocket(socketUrl);
const customId = "c00001";
/**
 * Sends the message over the socket.
 * @param {WebSocketMessage} message The message to send
 */
function sendMessageToSignallingServer(message) {
  const json = JSON.stringify(message);
  socket.send(json);
}

// log in directly after the socket was opened
socket.addEventListener("open", () => {
  console.log("websocket connected");
  sendMessageToSignallingServer({
    action: "login",
    name: username,
    deviceId: username,
    data: {
      customId,
    },
  });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data.toString());
  handleMessage(message);
});

/**
 * Processes the incoming message.
 * @param {WebSocketMessage} message The incoming message
 */
async function handleMessage(message) {
  switch (message.action) {
    case "iceCandidate":
      console.log("received ice candidate", message.data.candidate);
      await webrtc.addIceCandidate(message.data.candidate);
      break;

    case "webrtcOffer":
      console.log("received webrtc offer");
      await webrtc.setRemoteDescription(message.data.offer);

      const answer = await webrtc.createAnswer();
      await webrtc.setLocalDescription(answer);

      sendMessageToSignallingServer({
        action: "webrtcAnswer",
        deviceId: username,
        data: {
          customId,
          calledId: otherPerson,
          answer,
        },
      });
      break;

    case "webrtcAnswer":
      console.log("received webrtc answer");
      await webrtc.setRemoteDescription(message.data.answer);
      break;

    default:
      console.log("unknown message", message);
      break;
  }
}

const webrtc = new RTCPeerConnection({
  iceServers: [
    {
      urls: ["stun:stun.stunprotocol.org"],
    },
  ],
});

webrtc.onaddstream = (e) => {
  console.log("onaddstream,e", e);
  const remoteVideo = document.getElementById("remote-video");
  // fix android webview v62 track事件不会触发导致不能播放的问题
  remoteVideo.srcObject = event.stream;
};

webrtc.addEventListener("icecandidate", (event) => {
  if (!event.candidate) {
    return;
  }
  console.log("onIcecandidate", event.candidate);
  //alert(JSON.stringify(event.candidate));
  sendMessageToSignallingServer({
    action: "iceCandidate",
    deviceId: username,
    data: {
      customId,
      calledId: otherPerson,
      candidate: event.candidate,
    },
  });
});

webrtc.addEventListener("track", (event) => {
  console.log("track,event", event);
  /** @type {HTMLVideoElement} */
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo.srcObject) return;
  remoteVideo.srcObject = event.streams[0];
});

callButton.addEventListener("click", async () => {
  otherPerson = "student001"; //prompt("Who you gonna call?");

  showVideoCall();
  sendMessageToSignallingServer({
    action: "projectScreen",
    deviceId: username,
    data: {
      customId,
      calledId: otherPerson,
    },
  });
});

hideVideoCall();
