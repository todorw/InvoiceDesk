const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadInvoices: () => ipcRenderer.invoke('load-invoices'),
  saveInvoices: (data) => ipcRenderer.invoke('save-invoices', data),
  exportPdf: (invoiceId) => ipcRenderer.invoke('export-pdf', invoiceId),
  onInjectPrintData: (cb) => ipcRenderer.once('inject-print-data', (_, id) => cb(id)),
  sendPrintData: (html) => ipcRenderer.send('print-data-ready', html),
});
