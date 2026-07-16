const http = require("http");
http.get("http://127.0.0.1:9232/json/list", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    const page = JSON.parse(data).find((target) => target.type === "page");
    if (!page) { console.log("NO_PAGE"); process.exit(1); }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "JSON.stringify({menubar: !!document.querySelector('.app-menubar'), triggers: [...document.querySelectorAll('.app-menubar__trigger')].map((button) => button.textContent)})", returnByValue: true } }));
    });
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id !== 1) return;
      console.log("INSTALLED:", payload.result?.result?.value);
      ws.close();
      process.exit(0);
    });
  });
});
