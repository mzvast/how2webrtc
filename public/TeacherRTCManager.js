class TeacherRTCManager {
  constructor(username) {
    this.username = "";
    this.customId = "";
    this.socket = undefined;
    this.connections = {
      0: undefined,
      1: undefined,
    };
  }

  getEmptyConnectionIndex = () => {
    if (this.connections[0] === undefined) {
      return 0;
    } else if (this.connections[1] === undefined) {
      return 1;
    } else {
      return -1;
    }
  };

  sendMessageToSignallingServer = (message) => {
    const json = JSON.stringify(message);
    this.socket.send(json);
  };

  createConnection = (name, index) => {
    const webrtc = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.stunprotocol.org"],
        },
        {
          url: "turn:relay.backups.cz",
          credential: "webrtc",
          username: "webrtc",
        },
        {
          url: "turn:relay.backups.cz?transport=tcp",
          credential: "webrtc",
          username: "webrtc",
        },
      ],
    });
    const remoteVideo = document.getElementById("remote-video" + index);
    webrtc.onaddstream = (e) => {
      // console.log("onaddstream,e", e);
      // fix android webview v62 track事件不会触发导致不能播放的问题
      remoteVideo.srcObject = event.stream;
      remoteVideo.setAttribute("class", "active");
    };

    webrtc.addEventListener("icecandidate", (event) => {
      if (!event.candidate) {
        return;
      }
      // console.log("onIcecandidate", event.candidate);
      //alert(JSON.stringify(event.candidate));
      this.sendMessageToSignallingServer({
        action: "iceCandidate",
        deviceId: this.username,
        data: {
          customId: this.customId,
          calledId: name,
          candidate: event.candidate,
        },
      });
    });

    webrtc.addEventListener("track", (event) => {
      // console.log("track,event", event);
      /** @type {HTMLVideoElement} */
      if (remoteVideo.srcObject) return;
      remoteVideo.srcObject = event.streams[0];
    });
    this.connections[index] = {
      name,
      webrtc,
    };
  };

  getConnectionByName = (name) => {
    console.log("getConnectionByName,name", this.connections, name);
    for (const key in this.connections) {
      if (this.connections[key] && this.connections[key].name === name) {
        return this.connections[key].webrtc;
      }
    }
    return undefined;
  };

  closeConnectionByIndex = (index) => {
    console.log("closeConnectionByIndex,index", index);
    const connection = this.connections[index];
    if (!connection) {
      return;
    }
    const remoteVideo = document.getElementById("remote-video" + index);
    remoteVideo.srcObject = null;
    remoteVideo.setAttribute("class", "");
    connection.webrtc.close();
    this.sendMessageToSignallingServer({
      action: "stopProjectScreen",
      deviceId: this.username,
      data: {
        customId: this.customId,
        calledId: this.connections[index].name,
      },
    });
    this.connections[index] = undefined;
  };

  setUserInfo = ({ username, customId, socket }) => {
    this.username = username;
    this.customId = customId;
    this.socket = socket;
  };
}
export default new TeacherRTCManager();
