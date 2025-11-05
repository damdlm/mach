// Detecta se a PWA pode ser instalada
let deferredPrompt;
const installBanner = document.createElement("div");

// Cria o banner de instalação
installBanner.innerHTML = `
  <div id="install-banner" style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: sans-serif;
  ">
      <img src="/static/icons/icon-192.png" style="width: 36px; height: 36px; border-radius: 8px;">
      <div style="flex:1;">
        <strong>Instalar MachMap</strong><br>
        <small>Adicione à tela inicial</small>
      </div>
      <button id="btnInstall" style="
          background:white;
          color:#2563eb;
          border:none;
          padding:6px 12px;
          border-radius:8px;
          font-weight:bold;
          cursor:pointer;
      ">Instalar</button>
  </div>
`;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.body.appendChild(installBanner);
});

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnInstall") {
    installBanner.remove();
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        console.log("✅ Usuário aceitou instalar o app");
      } else {
        console.log("❌ Usuário recusou instalar o app");
      }
      deferredPrompt = null;
    });
  }
});
