const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
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
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141413' : '#f8f7f4',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // never open new electron windows or navigate away, send links to the browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', e => e.preventDefault());
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
      const parsed = JSON.parse(fs.readFileSync(dataPath(), 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    // keep a copy of the broken file instead of overwriting it on next save
    try { fs.copyFileSync(dataPath(), dataPath() + `.broken-${Date.now()}`); } catch (_) {}
  }
  return [];
});

ipcMain.handle('save-invoices', (_, data) => {
  try {
    // write to a temp file first so a crash mid-write can't corrupt the data
    const tmp = dataPath() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, dataPath());
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
    webPreferences: { contextIsolation: true, sandbox: true },
  });

  try {
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
    shell.openPath(filePath);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    if (!printWin.isDestroyed()) printWin.close();
  }
});
