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
const io = new Server(server, {
  cors: {
    origin: ["http://192.168.1.10:3000", "https://admin.socket.io"],
  },
});
app.use(express.static("public"));
// Route per la homepage
app.get("/", (req, res) => {
  res.sendFile(`${path.resolve()}/public/index.html`);
});
let selctedCharacter = null;

app.post("/arena", express.json(), (req, res) => {
  const character = req.body.character;
  // Ora puoi utilizzare il personaggio selezionato come preferisci
  console.log("Selected character:", character);
  selctedCharacter = character;
  // Ad esempio, puoi reindirizzare l'utente alla pagina dell'arena

  res.status(200);
});
// Route per "arena.html"
app.get("/arena", (req, res) => {
  res.sendFile(`${path.resolve()}/public/arena/arena.html`);
});

let rooms = {};

// Evento di connessione al namespace "arena"
const arena = io.of("/arena");
arena.on("connection", (socket) => {
  socket.on("readyToPlay", () => {
    console.log(`user ${socket.id} connected in arena`);

    // Funzione per trovare una stanza disponibile o crearne una nuova
    function findOrCreateRoom() {
      let availableRoom = null;
      Object.keys(rooms).some((room) => {
        if (rooms[room].length < 2) {
          availableRoom = room;
          return true;
        }
        return false;
      });

      if (!availableRoom) {
        const newRoom = `room-${Object.keys(rooms).length + 1}`;
        rooms[newRoom] = [];
        availableRoom = newRoom;
      }

      return availableRoom;
    }

    // Trova o crea una stanza disponibile
    const room = findOrCreateRoom();
    socket.join(room);
    rooms[room].push(socket.id);

    // Controlla se la stanza ha ora 2 giocatori per iniziare il gioco
    if (rooms[room].length === 2) {
      arena.to(room).emit("startGame");
    } else {
      arena.to(room).emit("waiting");
    }

    // Gestisci la disconnessione del giocatore
    socket.on("disconnect", () => {
      const index = rooms[room].indexOf(socket.id);
      if (index !== -1) {
        // Rimuovi il giocatore dalla stanza
        rooms[room].splice(index, 1);
        // Se la stanza è ora vuota, elimina la stanza
        if (rooms[room].length === 0) {
          delete rooms[room];
        } else {
          // Se c'è ancora un giocatore nella stanza, avvisa l'altro giocatore della disconnessione
          const remainingPlayerId = rooms[room][0];
          arena.to(remainingPlayerId).emit("opponentDisconnected");
        }
      }
    });
  });
});

io.on("connection", (socket) => {
  console.log(`user ${socket.id} connected`);
  console.log(io.engine.clientsCount);
});

server.listen(3000, () => {
  console.log(`server running at http://${address}:3000`);
});

instrument(io, {
  auth: false,
});
