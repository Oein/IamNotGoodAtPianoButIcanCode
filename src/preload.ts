import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  invoke: (chanel: string, ...datas: any) =>
    ipcRenderer.invoke(chanel, ...datas),
  once: (chanel: string, listener: any) => ipcRenderer.once(chanel, listener),
  on: (chanel: string, listener: any) => ipcRenderer.on(chanel, listener),
});
