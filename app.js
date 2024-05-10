import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import ip from "ip";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { instrument } from "@socket.io/admin-ui";
const address = ip.address();
const app = express();
const server = createServer(app);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: [
      `http://${address}:3000`,
      `http://localhost:3000`,
      "https://admin.socket.io",
    ],
    credentials: true,
  },
});

app.use(express.static("public"));
// Route per la homepage
app.get("/", (req, res) => {
  res.sendFile(`${path.resolve()}/public/index.html`);
});

let rooms = [];
// Funzione per trovare una stanza disponibile o crearne una nuova
function findOrCreateRoom() {
  let availableRoomId = false;
  // if (rooms) {
  rooms.some((room) => {
    // console.log(room.players);
    if (room.players.length < 2) {
      availableRoomId = room.id;
      // console.log("available ", availableRoomId);
      return true;
    }
    return false;
  });
  // }

  return availableRoomId;
}

// Evento di connessione al namespace "arena"
let i = 0;
io.on("connection", (socket) => {
  socket.on("readyToPlay", (username) => {
    let players = [];
    socket.data = {
      username: username,
    };
    if (i === 0) {
      setInterval(() => {
        // console.log(rooms);
        // console.log(io.of("/").adapter.rooms);
        // console.log(io.sockets.adapter.rooms);
      }, 5000);
      i++;
    }
    let roomId = findOrCreateRoom();

    if (roomId !== false) {
      const room = rooms.filter((ele) => (ele.id === roomId ? true : false))[0];
      // console.log("ffedfew", indexRoom, rooms[indexRoom]);
      let playersRoom = room.players;
      players = playersRoom;
      console.log(socket.data.username);
      playersRoom.push(socket.data.username);
    } else {
      roomId = uuidv4();
      rooms.push({ id: roomId, players: [socket.data.username] });
      players.push(socket.data.username);
      // console.log("ciao");
    }
    console.log("ciao io entro in", roomId);
    socket.join(roomId);
    if (io.of("/").adapter.rooms.get(roomId).size > 1) {
      io.of("/").to(roomId).emit("startGame", players);
    }
    socket.on("attack", (attack) => {
      io.of("/").to(roomId).except(socket.id).emit("recivedAttack", attack);
    });

    // Gestisci la disconnessione del giocatore
    socket.on("disconnect", () => {
      console.log("ciao io esco da", roomId);
      io.of("/").to(roomId).emit("opponentDisconnect");
    });
  });
});

server.listen(3000, () => {
  console.log(`server running at http://${address}:3000`);
});

instrument(io, {
  auth: false,
  mode: "development",
});
