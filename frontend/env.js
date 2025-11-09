import os from "os";
import fs from "fs";

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

const ip = getLocalIp();
const content = `VITE_NARI_HOST=http://${ip}:5000\n`;
fs.writeFileSync(".env", content);
console.log("✅ .env generated:", content);
