console.log("Document ready");
const socket = io();

usernameInput.value = localStorage.getItem("username");
document.querySelector("#username").textContent = usernameInput.value;
let username = "";
document.querySelector("#submit").addEventListener("click", function () {
  username = usernameInput.value;
  localStorage.setItem("username", username);
  document.querySelector("#step1").classList.add("d-none");
  document.querySelector("#step2").classList.remove("d-none");
  document.querySelector("#username").textContent = username;
  renderCharacters();
});

let selectedCharacter;
let opponent;
let lastAttack = 25;
let danno = false;
const myName = document.getElementById("myName");
const myLifeBar = document.querySelector("#myBar");
const opponentName = document.getElementById("opponentName");
const opponentLifeBar = document.querySelector("#opponentBar");
let opponentLife, myLife;
let attackDanno = false;
let textView = document.querySelector("#attacco");
let attaccoName;
usernameInput = document.querySelector("#usernameInput");

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

    const image = document.createElement("img");
    image.src =
      "https://media.brawltime.ninja/brawlers/jessie/model.png?size=400";
    // image.src = `immagini/${character.immagine}`;
    image.classList.add("card-img-top");
    image.alt = character.nome;

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
      myLife = selectedCharacter.vita;
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

    card.appendChild(image);
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

socket.on("startGame", (players) => {
  players.forEach((player) => {
    if (player.id != socket.id) {
      opponent = player;
      opponentLife = opponent.character.vita;
      opponentName.textContent = player.username;
    }
  });

  myName.textContent = username;
  myLifeBar.style.width = `${myLife}%`;
  myLifeBar.textContent = `${myLife}%`;
  opponentLifeBar.style.width = `${opponentLife}%`;
  opponentLifeBar.textContent = `${opponentLife}%`;

  const actionContainer = document.getElementById("actions");
  selectedCharacter.abilita.forEach((ability) => {
    const abilityButton = document.createElement("button");

    abilityButton.type = "button";
    abilityButton.classList.add("btn", "btn-outline-primary", "btn-lg");
    abilityButton.id = ability.azione;
    abilityButton.textContent = `${ability.azione} con danno ${ability.danno}`;

    abilityButton.addEventListener("click", (event) => {
      let abilit = selectedCharacter.abilita.filter(
        (ele) => ele.azione === event.target.id
      );
      abilit = abilit[0];
      if (
        parseFloat(abilit.danno) === abilit.danno &&
        !Number.isInteger(abilit.danno)
      ) {
        danno = Math.ceil(abilit.danno * lastAttack);
      } else {
        danno = abilit.danno;
      }

      // progressTime.classList.remove("d-none");
      socket.emit("attack", event.target.id, parseInt(myLife), danno);

      actionContainer.childNodes.forEach((button) => (button.disabled = true));

      setTimeout(() => {
        actionContainer.childNodes.forEach(
          (button) => (button.disabled = false)
        );
      }, ability.tempo_ripetizione);
    });
    actionContainer.appendChild(abilityButton);
  });

  document.querySelector("#attesa").classList.add("d-none");
  document.querySelector("#step3").classList.remove("d-none");

  setInterval(() => {
    document.getElementById("time").classList.add("timeAnimation");
  }, -3000);
  const interval = setInterval(() => {
    document.getElementById("time").classList.remove("timeAnimation");
    let finalAttack;
    if (attackDanno && danno) {
      finalAttack = attackDanno - danno;

      if (finalAttack < 0) {
        textView.textContent = `hai vinto tu e l'avversario ti ha colpito ${attaccoName}`;

        opponentLife = opponentLife + finalAttack;
        opponentLifeBar.style.width = `${opponentLife}%`;
        opponentLifeBar.textContent = `${opponentLife}%`;
        opponentLifeBar.parentElement.ariaValueNow = `${opponentLife}`;

        finalAttack = 0;
      } else {
        textView.textContent = `non eri abbastanza forte e l'avversario ti ha colpito ${attaccoName}`;
      }
    } else {
      if (attackDanno) {
        textView.textContent = `tu non hai attacato e l'avversario ti ha colpito ${attaccoName}`;
        finalAttack = attackDanno;
      } else {
        if (danno) {
          finalAttack = 0;
          textView.textContent = `hai vinto tu perche l'avversario non ha attacato`;

          opponentLife = opponentLife - danno;
          opponentLifeBar.style.width = `${opponentLife}%`;
          opponentLifeBar.textContent = `${opponentLife}%`;
          opponentLifeBar.parentElement.ariaValueNow = `${opponentLife}`;
        } else {
          textView.textContent = "nessuno ha attacato";
          finalAttack = 0;
        }
      }
    }
    myLife = myLife - finalAttack;
    myLifeBar.style.width = `${myLife}%`;
    myLifeBar.textContent = `${myLife}%`;
    myLifeBar.parentElement.ariaValueNow = `${myLife}`;
    if (myLife < 1) {
      document.querySelector("#step3").classList.add("d-none");
      document.querySelector("#fineText").textContent = `Hai Perso`;

      document.querySelector("#fine").classList.remove("d-none");
      socket.emit("perso");
      clearInterval(interval);
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
    attackDanno = false;
    danno = false;
  }, 3000);
});

socket.on("recivedAttack", (attacco, life, attaccoDanno) => {
  opponentLife = life;
  attackDanno = attaccoDanno;
  attaccoName = attacco;
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
