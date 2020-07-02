/// <reference path="../messages.d.ts" />
import { socketUrl } from "./config.js";
import TeacherRTCManager from "./TeacherRTCManager.js";
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
const close0Button = document.getElementById("close0-button");
const close1Button = document.getElementById("close1-button");
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

const username = `teacher${Math.floor(Math.random() * 100)}`; // prompt("What's your name?", `user${Math.floor(Math.random() * 100)}`);
const socket = new WebSocket(socketUrl);
const customId = "c00001";
TeacherRTCManager.setUserInfo({ username, customId, socket });
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
  const { calledId } = message.data;
  if (!calledId) {
    return;
  }
  const rtc = TeacherRTCManager.getConnectionByName(calledId);
  if (!rtc) {
    console.log(`RTC calledId:${calledId} not found`);
    return;
  }
  switch (message.action) {
    case "iceCandidate":
      console.log("received ice candidate", message.data.candidate);
      await rtc.addIceCandidate(message.data.candidate);
      break;

    case "webrtcOffer":
      console.log("received webrtc offer");
      await rtc.setRemoteDescription(message.data.offer);

      const answer = await rtc.createAnswer();
      await rtc.setLocalDescription(answer);

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
      await rtc.setRemoteDescription(message.data.answer);
      break;

    default:
      console.log("unknown message", message);
      break;
  }
}

callButton.addEventListener("click", async () => {
  // otherPerson = prompt(
  //   "Who you gonna call?",
  //   otherPerson ? otherPerson : "student001"
  // );
  otherPerson = "student001";

  // showVideoCall();
  const index = TeacherRTCManager.getEmptyConnectionIndex();
  console.log("emptyConnectionIndex:", index, TeacherRTCManager);
  if (index === -1) {
    return;
  }
  TeacherRTCManager.createConnection(otherPerson, index);
  sendMessageToSignallingServer({
    action: "projectScreen",
    deviceId: username,
    data: {
      customId,
      calledId: otherPerson,
    },
  });
});

close0Button.addEventListener("click", () => {
  TeacherRTCManager.closeConnectionByIndex(0);
});
close1Button.addEventListener("click", () => {
  TeacherRTCManager.closeConnectionByIndex(1);
});
// hideVideoCall();
