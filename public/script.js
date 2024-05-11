const socket = io();

console.log("Document ready");
usernameInput = document.querySelector("#usernameInput");

usernameInput.value = localStorage.getItem("username");
let username = "";
let SelectedCharacter = {
  name: "",
  id: "",
  hp: 0,
  power: 0,
  speed: 0,
};

document.querySelector("#submit").addEventListener("click", function () {
  username = usernameInput.value;
  localStorage.setItem("username", username);
  document.querySelector("#step1").classList.add("d-none");
  document.querySelector("#step2").classList.remove("d-none");
  document.querySelector("#username").textContent = username;
});

console.log("Connesso al server");

console.log("Document ready");

let SelectedEnemy = {
  name: "",
  id: "",
  hp: 0,
  power: 0,
  speed: 0,
};

document.querySelectorAll(".selectionChr").forEach((el, i) => {
  el.addEventListener("click", (btn) => {
    let dataset = btn.target.dataset;
    SelectedCharacter = dataset;

    // if (SelectedCharacter.id == "") {
    //   SelectedCharacter.id = dataset.id;
    //   SelectedCharacter.hp = parseInt(dataset.hp);
    //   SelectedCharacter.speed = parseInt(dataset.speed);
    //   SelectedCharacter.power = parseInt(dataset.power);
    //   SelectedCharacter.name = dataset.name;
    //   console.log("SelectedCharacter", SelectedCharacter);
    // } else {
    //   SelectedEnemy.id = dataset.id;
    //   SelectedEnemy.hp = parseInt(dataset.hp);
    //   SelectedEnemy.speed = parseInt(dataset.speed);
    //   SelectedEnemy.power = parseInt(dataset.power);
    //   SelectedEnemy.name = dataset.name;
    //   console.log("SelectedEnemy", SelectedEnemy);
    document.querySelector("#step2").classList.add("d-none");
    document.querySelector("#attesa").classList.remove("d-none");
    socket.emit("readyToPlay", username);
  });
});
const opponentName = document.getElementById("opponentName");
const myName = document.getElementById("myName");
socket.on("startGame", (players) => {
  players.forEach((player) => {
    if (player.id != socket.id) {
      opponentName.textContent = player.username;
    }
  });
  myName.textContent = username;
  document.querySelector("#attesa").classList.add("d-none");
  document.querySelector("#step3").classList.remove("d-none");
});
socket.on("vinto", () => {
  console.log("Win");
  document.querySelector("#fineText").textContent = "Hai Vinto";
  document.querySelector("#step3").classList.add("d-none");
  document.querySelector("#fine").classList.remove("d-none");

  setTimeout(() => {
    location.reload();
  }, 3000);
});
socket.on("opponentDisconnect", () => {
  console.log("opponent disconnected");
  document.querySelector("#step3").classList.add("d-none");
  document.querySelector("#abbandonato").classList.remove("d-none");
  setTimeout(() => {
    location.reload();
  }, 5000);
});
const myLife = document.querySelector("#myBar");
const opponentLife = document.querySelector("#opponentBar");
socket.on("recivedAttack", (attacco, life, danno) => {
  document.querySelector(
    "#attacco"
  ).textContent = `l'avversario ti ha colpito ${attacco}`;
  myLife.style.width = `${parseInt(myLife.style.width) - +danno}%`;
  myLife.textContent = `${parseInt(myLife.textContent) - +danno}%`;
  opponentLife.style.width = `${life}%`;
  opponentLife.textContent = `${life}%`;
  if (parseInt(myLife.textContent) < 5) {
    document.querySelector("#fineText").textContent = `Hai Perso`;
    document.querySelector("#step3").classList.add("d-none");
    document.querySelector("#fine").classList.remove("d-none");
    socket.emit("perso");
    setTimeout(() => {
      location.reload();
    }, 3000);
  }
});

// document.querySelector("info").ad
const buttons = document.querySelectorAll("#actions button");
buttons.forEach((butt) => {
  butt.addEventListener("click", (event) => {
    let danno = event.target.dataset.danno;
    // console.log("danno", danno);
    switch (event.target.id) {
      case "pugno":
        event.target.disabled = true;
        setTimeout(() => {
          event.target.disabled = false;
        }, 1300);
        break;
      case "calcio":
        event.target.disabled = true;
        setTimeout(() => {
          event.target.disabled = false;
        }, 2500);
        break;
      case "schiva":
        myLife.style.width = `${parseInt(myLife.style.width) + 2}%`;
        myLife.textContent = `${parseInt(myLife.textContent) + 2}%`;
        danno = "0";
        event.target.disabled = true;
        setTimeout(() => {
          event.target.disabled = false;
        }, 500);
        break;

      case "para":
        danno = "0";
        // SelectedEnemy.hp -= SelectedCharacter.power;
        event.target.disabled = true;
        setTimeout(() => {
          event.target.disabled = false;
        }, 500);
        break;
    }

    // document.querySelector("#attacco").textContent = event.target.id;
    socket.emit("attack", event.target.id, parseInt(myLife.style.width), danno);
    opponentLife.style.width = `${
      parseInt(opponentLife.style.width) - +danno
    }%`;
    opponentLife.textContent = `${
      parseInt(opponentLife.textContent) - +danno
    }%`;
  });
});

function checkVictory(attacco) {
  if (game.actionP1 == "pugno") {
    switch (game.actionP2) {
      case "schiva":
        alert("pareggio");
        break;
      case "calcio":
        alert("pareggio");
        break;
      case "para":
        SelectedEnemy.hp -= SelectedCharacter.power;
        alert("vince p1");
        break;
    }
  }
  if (game.actionP1 == "schiva") {
    switch (game.actionP2) {
      case "pugno":
        alert("pareggio");
        break;
      case "calcio":
        SelectedCharacter.hp -= SelectedEnemy.speed;
        alert("vince p2");
        break;
      case "para":
        alert("pareggio");
        break;
    }
  }
  if (game.actionP1 == "calcio") {
    switch (game.actionP2) {
      case "schiva":
        SelectedEnemy.hp -= SelectedCharacter.speed;
        alert("vince p1");
        break;
      case "pugno":
        alert("pareggio");
        break;
      case "para":
        alert("pareggio");
        break;
    }
  }
  if (game.actionP1 == "para") {
    switch (game.actionP2) {
      case "schiva":
        alert("pareggio");
        break;
      case "pugno":
        SelectedCharacter.hp -= SelectedEnemy.power;
        alert("vince p2");
        break;
      case "calcio":
        alert("pareggio");
        break;
    }
  }
  console.log(SelectedCharacter);
  console.log(SelectedEnemy);
  if (game.actionP1 == game.actionP2) {
    alert("pareggio vince l'amicizia");
  }
  if (SelectedCharacter.hp <= 0) {
    alert("ha vinto p2");
    location.reload();
  } else if (SelectedEnemy.hp <= 0) {
    alert("ha vinto p1");
    location.reload();
  }
}
