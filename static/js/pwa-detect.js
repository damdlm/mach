// Detecta tipo de dispositivo e navegador
const ua = navigator.userAgent.toLowerCase();
const isIOS = /iphone|ipad|ipod/.test(ua);
const isSafari = /safari/.test(ua) && !/crios|fxios|opios/.test(ua);
const isChromeIOS = /crios/.test(ua);

// Cria o container do aviso
function showBanner(message, color = "#2563eb", delay = 10000) {
  const banner = document.createElement("div");
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 14px 18px;
      border-radius: 14px;
      font-size: 14px;
      text-align: center;
      max-width: 90%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      animation: slideUp 0.4s ease-out;
    ">
      <img src="/static/icons/icon-192.png" style="width:32px;height:32px;border-radius:8px;">
      <div style="text-align:left;">${message}</div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translate(-50%, 120%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), delay);
}

// === Lógica principal ===
window.addEventListener("load", () => {
  if (isIOS && isSafari && !window.matchMedia('(display-mode: standalone)').matches) {
    // Safari no iPhone: mostra tutorial
    showBanner(
      "Para instalar o <strong>MachMap</strong>: toque no botão <span style='font-size:18px;'>⬆️</span> e escolha <strong>“Adicionar à Tela de Início”</strong>.",
      "#2563eb",
      12000
    );
  } else if (isChromeIOS) {
    // Chrome no iPhone: avisa para usar Safari
    showBanner(
      "⚠️ No iPhone, o <strong>MachMap</strong> só pode ser instalado pelo Safari.<br>Abra este link no Safari 🍏",
      "#ff6347",
      10000
    );
  }
});
