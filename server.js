import express from "express";
import http from "http";
import { Server } from "socket.io";
import { ControlEvent, TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(express.static("."));
app.get("/health", (_req, res) => res.json({ ok: true, game: "Corrida Insana LIVE" }));

let liveConnection = null;
let currentCreator = "";
let connecting = false;
const racers = new Map();
const MAX_RACERS = 8;

function sendState() {
  io.emit("race-state", {
    creator: currentCreator,
    connected: Boolean(liveConnection),
    connecting,
    racers: [...racers.values()]
  });
}
function addRacer(displayName, vehicle) {
  const name = String(displayName || "Piloto").replace(/[<>]/g, "").slice(0, 24);
  const key = name.toLowerCase();
  if (racers.has(key)) return;
  if (racers.size >= MAX_RACERS) {
    io.emit("game-message", "Pista cheia! A próxima corrida terá novas vagas.");
    return;
  }
  racers.set(key, { name, vehicle, progress: 0, lane: racers.size });
  io.emit("game-message", `${name} entrou na corrida com ${vehicle === "moto" ? "uma moto" : "um carro"}!`);
  sendState();
}
async function disconnectTikTok() {
  if (liveConnection) {
    try { await liveConnection.disconnect(); } catch {}
  }
  liveConnection = null;
  currentCreator = "";
  connecting = false;
  sendState();
}
async function connectTikTok(username) {
  const clean = String(username || "").trim().replace(/^@/, "").replace(/^.*\/@/, "").replace(/\/live.*$/, "");
  if (!/^[a-zA-Z0-9._]{2,30}$/.test(clean)) throw new Error("Digite um @ válido, sem espaços.");
  if (connecting) throw new Error("Já estamos tentando conectar.");
  await disconnectTikTok();
  currentCreator = clean;
  connecting = true;
  sendState();

  const connection = new TikTokLiveConnection(clean);
  liveConnection = connection;

  connection.on(ControlEvent.ERROR, ({ info, exception }) => {
    io.emit("connection-error", `${info || "Erro na conexão"}${exception?.message ? ": " + exception.message : ""}`);
  });
  connection.on(WebcastEvent.CHAT, (event) => {
    const content = String(event.content || "").trim().toLowerCase();
    const display = event.user?.displayId || event.user?.nickname || "Piloto";
    if (content === "carro" || content === "🚗") addRacer(display, "carro");
    if (content === "moto" || content === "🏍️") addRacer(display, "moto");
    io.emit("chat-event", { user: display, content: event.content || "" });
  });
  connection.on(WebcastEvent.GIFT, (event) => {
    const giftName = event.giftDetails?.giftName || event.giftName || "presente";
    io.emit("game-message", `🎁 Presente recebido: ${giftName}! (Poderes serão ativados na próxima etapa)`);
  });

  try {
    await connection.connect();
    connecting = false;
    io.emit("connection-status", `Conectado à LIVE de @${clean}`);
    sendState();
  } catch (error) {
    liveConnection = null;
    connecting = false;
    io.emit("connection-error", error?.message || "Não foi possível conectar. Verifique se a LIVE está pública e ativa.");
    sendState();
    throw error;
  }
}

io.on("connection", (socket) => {
  socket.emit("race-state", {
    creator: currentCreator, connected: Boolean(liveConnection), connecting,
    racers: [...racers.values()]
  });
  socket.on("connect-tiktok", async (username) => {
    try { await connectTikTok(username); }
    catch (e) { socket.emit("connection-error", e.message); }
  });
  socket.on("disconnect-tiktok", disconnectTikTok);
  socket.on("start-race", () => {
    if (!racers.size) {
      io.emit("game-message", "Ainda não há pilotos. Peça para comentarem CARRO ou MOTO!");
      return;
    }
    io.emit("race-start");
    const interval = setInterval(() => {
      let winner = null;
      for (const racer of racers.values()) {
        racer.progress += 4 + Math.random() * 8;
        if (racer.progress >= 100 && !winner) winner = racer;
      }
      sendState();
      if (winner) {
        clearInterval(interval);
        io.emit("race-winner", winner.name);
        io.emit("game-message", `🏆 ${winner.name} venceu a Corrida Insana!`);
      }
    }, 450);
  });
  socket.on("reset-race", () => {
    racers.clear();
    sendState();
    io.emit("game-message", "Pista liberada! Comentem CARRO ou MOTO para entrar.");
  });
  socket.on("heartbeat", () => socket.emit("heartbeat-ok"));
});

const initialUser = process.env.TIKTOK_USERNAME;
server.listen(PORT, () => {
  console.log(`Corrida Insana LIVE rodando na porta ${PORT}`);
  if (initialUser) connectTikTok(initialUser).catch(console.error);
});
