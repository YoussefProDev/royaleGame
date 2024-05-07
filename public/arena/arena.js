const socket = io("/arena");

const text = document.querySelector("#viewText");

socket.on("startGame", () => {
  text.textContent = "Il gioco è iniziato!";
  console.log("Il gioco è iniziato!");
});
socket.emit("readyToPlay");
const room = null;
socket.on("join-room", (r, id) => {
  text.textContent = `socket ${id} has joined room ${r}`;
  console.log(`socket ${id} has joined room ${r}`);
  room = r;
});
// Ascolta l'evento per sapere se sei in attesa
socket.on("waiting", () => {
  text.textContent = "Sei in attesa di un altro giocatore...";
  console.log("Sei in attesa di un altro giocatore...");
});

socket.on("opponentDisconnected", () => {
  text.textContent = "hai vinto per abbandono";
  setTimeout(() => {
    window.location.href = "/";
  }, 5000);

  console.log("hai vinto per abbandono");
});
