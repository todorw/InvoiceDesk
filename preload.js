const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadInvoices: () => ipcRenderer.invoke('load-invoices'),
  saveInvoices: (data) => ipcRenderer.invoke('save-invoices', data),
  exportPdf: (invoiceId, html) => ipcRenderer.invoke('export-pdf', invoiceId, html),
});
