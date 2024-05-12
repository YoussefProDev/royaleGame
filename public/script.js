console.log("Document ready");
const socket = io();

let selectedCharacter;
let opponent;
let lastAttack;
const myName = document.getElementById("myName");
const myLife = document.querySelector("#myBar");
const opponentName = document.getElementById("opponentName");
const opponentLife = document.querySelector("#opponentBar");
usernameInput = document.querySelector("#usernameInput");

usernameInput.value = localStorage.getItem("username");
document.querySelector("#username").textContent = usernameInput.value;
let username = "";

async function renderCharacters() {
  const response = await fetch("/dati");
  if (!response.ok) {
    throw new Error("Errore nel recupero dei dati");
  }
  const { personaggi } = await response.json();

  const container = document.getElementById("personaggiContainer");

  personaggi.forEach((character) => {
    const card = document.createElement("div");
    card.classList.add("card", "col-3");

    // const image = document.createElement("img");
    // image.src = `immagini/${character.immagine}`;
    // image.classList.add("card-img-top");
    // image.alt = character.nome;

    const body = document.createElement("div");
    body.classList.add("card-body");

    const title = document.createElement("h5");
    title.classList.add("card-title");
    title.textContent = character.nome;

    const text = document.createElement("p");
    text.classList.add("card-text");
    text.textContent = character.descrizione;
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.classList.add("btn", "btn-primary", "selectionChr");
    selectButton.dataset.character = character.id;
    selectButton.textContent = "Seleziona";
    selectButton.addEventListener("click", (event) => {
      let dataset = event.target.dataset;
      selectedCharacter = personaggi.filter(
        (ele) => ele.id == dataset.character
      );
      selectedCharacter = selectedCharacter[0];

      document.querySelector("#step2").classList.add("d-none");
      document.querySelector("#attesa").classList.remove("d-none");
      console.log("Connesso al server");

      socket.emit("readyToPlay", username, character);
    });
    const infoButton = document.createElement("button");
    infoButton.type = "button";
    infoButton.classList.add("btn", "btn-primary");
    infoButton.dataset.bsToggle = "modal";
    infoButton.dataset.bsTarget = `#exampleModal-${character.id}`;
    infoButton.textContent = "Info";

    body.appendChild(title);
    body.appendChild(text);
    body.appendChild(selectButton);
    body.appendChild(infoButton);

    // card.appendChild(image);
    card.appendChild(body);

    container.appendChild(card);

    // Modal per le informazioni
    const modal = document.createElement("div");
    modal.classList.add("modal", "fade");
    modal.id = `exampleModal-${character.id}`;
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("aria-labelledby", "exampleModalLabel");
    modal.setAttribute("aria-hidden", "true");

    const modalDialog = document.createElement("div");
    modalDialog.classList.add("modal-dialog");

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header");

    const modalTitle = document.createElement("h5");
    modalTitle.classList.add("modal-title");
    modalTitle.textContent = character.nome;

    const modalCloseButton = document.createElement("button");
    modalCloseButton.type = "button";
    modalCloseButton.classList.add("btn-close");
    modalCloseButton.dataset.bsDismiss = "modal";
    modalCloseButton.setAttribute("aria-label", "Close");

    const modalBody = document.createElement("div");
    modalBody.classList.add("modal-body");

    // Mostra le informazioni
    const abilities = document.createElement("ul");
    abilities.classList.add("list-group");
    character.abilita.forEach((abilita) => {
      const abilityItem = document.createElement("li");
      abilityItem.classList.add("list-group-item");
      abilityItem.textContent = `${abilita.azione}: ${abilita.descrizione}`;
      abilities.appendChild(abilityItem);
    });

    const life = document.createElement("p");
    life.textContent = `Vita: ${character.vita}`;

    modalBody.appendChild(abilities);
    modalBody.appendChild(life);

    const modalFooter = document.createElement("div");
    modalFooter.classList.add("modal-footer");

    const modalClose = document.createElement("button");
    modalClose.type = "button";
    modalClose.classList.add("btn", "btn-secondary");
    modalClose.dataset.bsDismiss = "modal";
    modalClose.textContent = "Close";

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalCloseButton);
    modalFooter.appendChild(modalClose);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);

    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    document.body.appendChild(modal);
  });
}

document.querySelector("#submit").addEventListener("click", function () {
  username = usernameInput.value;
  localStorage.setItem("username", username);
  document.querySelector("#step1").classList.add("d-none");
  document.querySelector("#step2").classList.remove("d-none");
  document.querySelector("#username").textContent = username;
  renderCharacters();
});

socket.on("startGame", (players) => {
  players.forEach((player) => {
    if (player.id != socket.id) {
      opponent = player;
      opponentName.textContent = player.username;
    }
  });

  myName.textContent = username;
  myLife.style.width = `${selectedCharacter.vita}%`;
  myLife.textContent = `${selectedCharacter.vita}%`;
  opponentLife.style.width = `${opponent.character.vita}%`;
  opponentLife.textContent = `${opponent.character.vita}%`;

  const actionContainer = document.getElementById("actions");
  selectedCharacter.abilita.forEach((abilita) => {
    let danno;
    if (
      parseFloat(abilita.danno) === abilita.danno &&
      !Number.isInteger(abilita.danno)
    ) {
      if (lastAttack) {
        danno = Math.ceil(abilita.danno * lastAttack);
      } else {
        const random = Math.random() * 20;

        danno = Math.ceil(abilita.danno * random);
      }
    } else {
      danno = abilita.danno;
    }
    const abilityButton = document.createElement("button");

    let interiorProgressTime = document.createElement("span");
    interiorProgressTime.classList.add("progress-bar", "bg-primary");
    interiorProgressTime.id = `time remained of ${abilita.azione}`;
    interiorProgressTime.style.width = `0%`;
    // let interiorProgressTimeStyle = getComputedStyle(interiorProgressTime);
    // console.log(`${abilita.tempo_ripetizione}`);
    interiorProgressTime.style.setProperty(
      "--time",
      `${abilita.tempo_ripetizione}ms`
    );
    const progressTime = document.createElement("span");
    progressTime.classList.add("progress", "d-none");
    progressTime.role = "progressbar";
    progressTime.ariaLabel = "time Remained";
    progressTime.ariaValueNow = "0";
    progressTime.ariaValueMin = "0";
    progressTime.ariaValueMax = "100";
    progressTime.appendChild(interiorProgressTime);
    abilityButton.type = "button";
    abilityButton.classList.add("btn", "btn-outline-primary", "btn-lg");
    abilityButton.id = abilita.azione;
    abilityButton.textContent = abilita.azione;
    abilityButton.appendChild(progressTime);

    abilityButton.addEventListener("click", (event) => {
      progressTime.classList.remove("d-none");
      socket.emit(
        "attack",
        event.target.id,
        parseInt(myLife.textContent),
        danno
      );
      interiorProgressTime.classList.add("timeAnimation");
      // interiorProgressTime.style.width = "20%";
      // ${abilita.tempo_ripetizione} linear 1
      // const intStyle = interiorProgressTime.style;
      // intStyle.animationName = `time`;
      // intStyle.animationDuration = `${abilita.tempo_ripetizione}`;
      // intStyle.animationTimingFunction = `linear`;
      // intStyle.animationIterationCount = `1`;
      // console.log(interiorProgressTime.style.animation);
      event.target.disabled = true;
      // setInterval(function () {
      //   console.log(interiorProgressTime.style.width);
      //   interiorProgressTime.style.width = `${
      //     parseInt(interiorProgressTime.style.width) + 5
      //   }%`;

      //   progressTime.ariaValueNow = `${myLife.textContent}`;
      // }, 800);
      setTimeout(() => {
        interiorProgressTime.classList.remove("timeAnimation");
        progressTime.classList.add("d-none");
        event.target.disabled = false;
        interiorProgressTime.style.animation = "";
      }, abilita.tempo_ripetizione);
    });
    actionContainer.appendChild(abilityButton);
  });

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

socket.on("recivedAttack", (attacco, life, danno) => {
  lastAttack = danno;
  document.querySelector(
    "#attacco"
  ).textContent = `l'avversario ti ha colpito ${attacco}`;
  myLife.style.width = `${parseInt(myLife.style.width) - +danno}%`;
  myLife.textContent = `${parseInt(myLife.textContent) - +danno}%`;
  myLife.parentElement.ariaValueNow = `${myLife.textContent}`;
  opponentLife.style.width = `${life}%`;
  opponentLife.textContent = `${life}%`;
  opponentLife.parentElement.ariaValueNow = `${life}`;
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
// const buttons = document.querySelectorAll("#actions button");
// buttons.forEach((butt) => {
//   butt.addEventListener("click", (event) => {
//     let danno = event.target.dataset.danno;
//     // console.log("danno", danno);
//     switch (event.target.id) {
//       case "pugno":
//         event.target.disabled = true;
//         setTimeout(() => {
//           event.target.disabled = false;
//         }, 1300);
//         break;
//       case "calcio":
//         event.target.disabled = true;
//         setTimeout(() => {
//           event.target.disabled = false;
//         }, 2500);
//         break;
//       case "schiva":
//         myLife.style.width = `${parseInt(myLife.style.width) + 2}%`;
//         myLife.textContent = `${parseInt(myLife.textContent) + 2}%`;
//         danno = "0";
//         event.target.disabled = true;
//         setTimeout(() => {
//           event.target.disabled = false;
//         }, 500);
//         break;

//       case "para":
//         danno = "0";
//         // SelectedEnemy.hp -= SelectedCharacter.power;
//         event.target.disabled = true;
//         setTimeout(() => {
//           event.target.disabled = false;
//         }, 500);
//         break;
//     }

//     // document.querySelector("#attacco").textContent = event.target.id;
//     socket.emit("attack", event.target.id, parseInt(myLife.style.width), danno);
//     opponentLife.style.width = `${
//       parseInt(opponentLife.style.width) - +danno
//     }%`;
//     opponentLife.textContent = `${
//       parseInt(opponentLife.textContent) - +danno
//     }%`;
//   });
// });

// function checkVictory(attacco) {
//   if (game.actionP1 == "pugno") {
//     switch (game.actionP2) {
//       case "schiva":
//         alert("pareggio");
//         break;
//       case "calcio":
//         alert("pareggio");
//         break;
//       case "para":
//         SelectedEnemy.hp -= SelectedCharacter.power;
//         alert("vince p1");
//         break;
//     }
//   }
//   if (game.actionP1 == "schiva") {
//     switch (game.actionP2) {
//       case "pugno":
//         alert("pareggio");
//         break;
//       case "calcio":
//         SelectedCharacter.hp -= SelectedEnemy.speed;
//         alert("vince p2");
//         break;
//       case "para":
//         alert("pareggio");
//         break;
//     }
//   }
//   if (game.actionP1 == "calcio") {
//     switch (game.actionP2) {
//       case "schiva":
//         SelectedEnemy.hp -= SelectedCharacter.speed;
//         alert("vince p1");
//         break;
//       case "pugno":
//         alert("pareggio");
//         break;
//       case "para":
//         alert("pareggio");
//         break;
//     }
//   }
//   if (game.actionP1 == "para") {
//     switch (game.actionP2) {
//       case "schiva":
//         alert("pareggio");
//         break;
//       case "pugno":
//         SelectedCharacter.hp -= SelectedEnemy.power;
//         alert("vince p2");
//         break;
//       case "calcio":
//         alert("pareggio");
//         break;
//     }
//   }
//   console.log(SelectedCharacter);
//   console.log(SelectedEnemy);
//   if (game.actionP1 == game.actionP2) {
//     alert("pareggio vince l'amicizia");
//   }
//   if (SelectedCharacter.hp <= 0) {
//     alert("ha vinto p2");
//     location.reload();
//   } else if (SelectedEnemy.hp <= 0) {
//     alert("ha vinto p1");
//     location.reload();
//   }
// }
