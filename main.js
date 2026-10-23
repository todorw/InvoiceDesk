const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#f8f7f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Save invoices to disk ──────────────────────────────────────────────
const dataPath = () => path.join(app.getPath('userData'), 'invoices.json');

ipcMain.handle('load-invoices', () => {
  try {
    if (fs.existsSync(dataPath())) {
      return JSON.parse(fs.readFileSync(dataPath(), 'utf8'));
    }
  } catch (e) {}
  return [];
});

ipcMain.handle('save-invoices', (_, data) => {
  try {
    fs.writeFileSync(dataPath(), JSON.stringify(data, null, 2), 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── IPC: Export PDF via Chromium print ─────────────────────────────────────
ipcMain.handle('export-pdf', async (_, invoiceId, html) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${invoiceId}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!filePath) return { ok: false };

  // Open a hidden print window with just the invoice
  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true },
  });

  await printWin.loadFile(path.join(__dirname, 'src', 'print.html'));
  await printWin.webContents.executeJavaScript(
    `document.getElementById('root').innerHTML = ${JSON.stringify(String(html || ''))};`
  );

  const pdfBuffer = await printWin.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { top: 0.4, bottom: 0.4, left: 0.5, right: 0.5 },
  });

  fs.writeFileSync(filePath, pdfBuffer);
  printWin.close();
  shell.openPath(filePath);
  return { ok: true, path: filePath };
});
