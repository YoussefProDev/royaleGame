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
  // location.href = "/arena";

  socket.emit("readyToPlay", selectedCharacter);
});

console.log("Connesso al server");
