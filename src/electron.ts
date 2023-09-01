import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import axios from "axios";
import { Midi } from "@tonejs/midi";
import { closer, player, stopper } from ".";

let currentMidi: Midi;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 516,
    height: 238,

    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  win.loadFile(join(__dirname, "..", "static", "index.html"));

  ipcMain.handle("url", (e, url: string) => {
    axios
      .get(url, {
        responseType: "arraybuffer",
      })
      .then((v) => {
        currentMidi = new Midi(v.data);
        e.sender.send("state", "Fetching done!");
      });
  });

  ipcMain.handle("midi", (e, data: any) => {
    currentMidi = JSON.parse(data);
  });

  ipcMain.handle("play", (e) => {
    stopper();
    player(currentMidi);
  });

  ipcMain.handle("stop", () => {
    stopper();
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopper();
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  closer();
});
