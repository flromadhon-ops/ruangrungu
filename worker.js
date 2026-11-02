// Asknything Bridge: satu server untuk website + sambungan realtime tamu <-> front office.
import html from "./index.html";

export class Room {
  constructor(state) { this.state = state; }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket")
      return new Response("Butuh WebSocket", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > 8192) return;
    for (const peer of this.state.getWebSockets()) {
      if (peer !== ws) { try { peer.send(msg); } catch (e) {} }
    }
  }
  webSocketClose(ws) { try { ws.close(1000); } catch (e) {} }
  webSocketError(ws) { try { ws.close(1011); } catch (e) {} }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const room = url.searchParams.get("room") || "";
      if (!/^asknything-\d{6}$/.test(room)) return new Response("Kode salah", { status: 400 });
      return env.ROOM.get(env.ROOM.idFromName(room)).fetch(request);
    }
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
    });
  },
};
