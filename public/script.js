const socket = io();

console.log("Document ready");
usernameInput = document.querySelector("#usernameInput");

usernameInput.value = localStorage.getItem("username");
let username = "";

document.querySelector("#submit").addEventListener("click", function () {
  username = usernameInput.value;
  localStorage.setItem("username", username);
  document.querySelector("#step1").classList.add("d-none");
  document.querySelector("#step3").classList.remove("d-none");
});
const form = document.querySelector("#characterForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedCharacter = document.getElementById("character").value;
  fetch("/arena", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ character: selectedCharacter }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Character selection sent successfully");
        location.href = "/arena";
        // Puoi eventualmente fare qualcosa qui, come reindirizzare il client alla pagina dell'arena
      } else {
        console.error("Failed to send character selection");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

console.log("Connesso al server");
// arenaSocket = io("/arena");
// document.querySelector("#step3>button").addEventListener("click", (e) => {
//   // window.location.href = "/arena";
//   // const arena = io.of("/arena");
//   // console.log( io.of("/arena").emit("readyToPlay"));
//   // io.of("/arena").emit("readyToPlay");
// });
