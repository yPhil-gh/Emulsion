import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    sayHello: () => 'Hello World'
});
