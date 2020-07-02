const getServerConfig = () => {
    const search = location.search;
    const stun = /stun=1/i.test(search);
    const turn = /turn=1/i.test(search);
    let config = []
    if (stun) {
        config.push({
            urls: ["stun:stun.stunprotocol.org"],
        })
    }
    if (turn) {
        config.push({
            urls: ["turn:relay.backups.cz"],
            credential: "webrtc",
            username: "webrtc",
        })
        config.push({
            urls: ["turn:relay.backups.cz?transport=tcp"],
            credential: "webrtc",
            username: "webrtc",
        })
    }
    return config
}
export default getServerConfig;