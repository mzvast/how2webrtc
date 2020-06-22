interface LoginWebSocketMessage {
  action: "login";
  name: string;
  deviceId: string;
  data: any;
}

interface LogoutWebSocketMessage {
  action: "logout";
  deviceId: string;
  data: any;
}

interface StartCallWebSocketMessage {
  action: "projectScreen";
  deviceId: string;
  data: any;
}

interface WebRTCIceCandidateWebSocketMessage {
  action: "iceCandidate";
  deviceId: string;
  data: any;
}

interface WebRTCOfferWebSocketMessage {
  action: "webrtcOffer";
  deviceId: string;
  data: any;
}

interface WebRTCAnswerWebSocketMessage {
  action: "webrtcAnswer";
  deviceId: string;
  data: any;
}

type WebSocketCallMessage =
  | StartCallWebSocketMessage
  | WebRTCIceCandidateWebSocketMessage
  | WebRTCOfferWebSocketMessage
  | WebRTCAnswerWebSocketMessage;

type UserVisitMessage = LoginWebSocketMessage | WebSocketCallMessage;

type WebSocketMessage = UserVisitMessage | LogoutWebSocketMessage;
