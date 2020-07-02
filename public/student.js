/// <reference path="../messages.d.ts" />
import {socketUrl} from "./config.js";
import getServerConfig from "./getServerConfig.js"
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

// const callButton = document.getElementById("call-button");
const videoContainer = document.getElementById("video-container");

/**
 * Hides both local and remote video, but shows the "call" button.
 */
function hideVideoCall() {
  hideElement(videoContainer);
  // showElement(callButton);
}

/**
 * Shows both local and remote video, and hides the "call" button.
 */
function showVideoCall() {
  // hideElement(callButton);
  showElement(videoContainer);
}

/** @type {string} */
let otherPerson;
function getUrlSearchName() {
  const match = location.search.match(/\?name=(\w*)/);
  return match ? match[1] : null;
}
const username = getUrlSearchName()
  ? getUrlSearchName()
  : prompt("What's your name?", `student001`);
const socket = new WebSocket(socketUrl);
const customId = "c00001";
console.log("my name is", username);
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
    case "projectScreen":
      console.log(`receiving projectScreen from ${message.data.calledId}`);
      otherPerson = message.data.calledId;
      showVideoCall();
      startShareScreen(async () => {
        const offer = await webrtc.createOffer();
        await webrtc.setLocalDescription(offer);
        sendMessageToSignallingServer({
          action: "webrtcOffer",
          deviceId: username,
          data: {
            customId,
            calledId: otherPerson,
            offer,
          },
        });
      });
      break;

    case "iceCandidate":
      console.log("received ice candidate", message.data.candidate);
      await webrtc.addIceCandidate(message.data.candidate);
      break;

    case "webrtcAnswer":
      console.log("received webrtc answer");
      await webrtc.setRemoteDescription(message.data.answer);
      break;
    case "stopProjectScreen":
      console.log("received stopProjectScreen ");
      stopShareScreen();
      break;

    default:
      console.log("unknown message", message);
      break;
  }
}
const iceServers = getServerConfig();
console.log('iceServers', iceServers);
const webrtc = new RTCPeerConnection({
  iceServers
});

webrtc.addEventListener("icecandidate", (event) => {
  if (!event.candidate) {
    return;
  }
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

function startShareScreen(cb) {
  navigator.mediaDevices
    .getDisplayMedia()
    .then((localStream) => {
      /** @type {HTMLVideoElement} */
      const localVideo = document.getElementById("local-video");
      localVideo.srcObject = localStream;

      for (const track of localStream.getTracks()) {
        webrtc.addTrack(track, localStream);
      }
      cb && cb();
    })
    .catch((e) => {
      console.log("startShareScreen error", e);
    });
}

function stopShareScreen(cb) {
  const localVideo = document.getElementById("local-video");
  const localStream = localVideo.srcObject;
  for (const track of localStream.getTracks()) {
    track.stop();
  }
  // webrtc.close();
  hideVideoCall();
}

// callButton.addEventListener("click", async () => {
//   otherPerson = prompt("Who you gonna call?");

//   showVideoCall();
//   sendMessageToSignallingServer({
//     action: "projectScreen",
//     otherPerson,
//   });
// });

hideVideoCall();
