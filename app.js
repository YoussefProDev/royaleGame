import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import ip from "ip";
import cors from "cors";
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

// let selctedCharacter = null;

// app.post("/arena", (req, res) => {
//   const character = req.body.charactr;
//   // Ora puoi utilizzare il personaggio selezionato come preferisci
//   console.log("Selected character:", character);
//   selctedCharacter = character;
//   // Ad esempio, puoi reindirizzare l'utente alla pagina dell'arena
// });
// Route per "arena.html"
app.get("/arena", (req, res) => {
  res.sendFile(`${path.resolve()}/public/arena/arena.html`);
});

let rooms = {};
// Funzione per trovare una stanza disponibile o crearne una nuova
function findOrCreateRoom() {
  let availableRoom = false;
  if (rooms) {
    Object.keys(rooms).some((roomId) => {
      const room = rooms[`${roomId}`];
      if (room.length < 2) {
        availableRoom = room;
        return true;
      }
      return false;
    });
  }

  if (!availableRoom) {
    let newRoom = `room-1`;
    if (rooms.keys) {
      console.log("momo", Object.keys(rooms));
      newRoom = `room-${Object.keys(rooms).length + 1}`;
    }

    rooms[newRoom] = [];
    availableRoom = newRoom;
  }

  return availableRoom;
}

// Evento di connessione al namespace "arena"
let i = 0;
io.on("connection", (socket) => {
  if (i === 0) {
    setInterval(() => {
      console.log(socket.adapter.rooms);
    }, 5000);
    i++;
  }

  // Trova o crea una stanza disponibile
  const roomId = findOrCreateRoom();
  socket.join(roomId);
  // cot rooms = io.sockets.adapter.t
  // console.log("ciao", io.sockets.adapter.rooms.get(roomId));
  // socket.adapter.rooms.get(room).add(socket.id);`

  // socket.adapter.rooms[room].push(socket.id);

  // Controlla se la stanza ha ora 2 giocatori per iniziare il gioco
  // if (rooms[roomId].length === 2) {
  //   socket.to(roomId).emit("startGame");
  // } else {
  //   socket.to(roomId).emit("waiting");
  // }
  // socket.on(roomId, () => {});

  // Gestisci la disconnessione del giocatore
  socket.on("disconnect", () => {
    console.log("id ", roomId);
    console.log(rooms[roomId]);
    const index = rooms[roomId].indexOf(socket.id);
    if (index !== -1) {
      // Rimuovi il giocatore dalla stanza
      rooms[roomId].splice(index, 1);
      // Se la stanza è ora vuota, elimina la stanza
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        // Se c'è ancora un giocatore nella stanza, avvisa l'altro giocatore della disconnessione
        const remainingPlayerId = rooms[roomId][0];
        socket
          .to(remainingPlayerId)
          .emit(`opponentDisconnected${remainingPlayerId}`);
      }
    }
  });
  // });
});

server.listen(3000, () => {
  console.log(`server running at http://${address}:3000`);
});

instrument(io, {
  auth: false,
  mode: "development",
});
