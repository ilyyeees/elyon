const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// disable sandbox for packaged builds
if (app.isPackaged) {
    app.commandLine.appendSwitch('no-sandbox');
}

let pythonProcess;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200, height: 800,
        frame: false,
        icon: path.join(__dirname, 'src', 'assets', 'logo icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.loadFile('src/index.html');

    const { ipcMain } = require('electron');
    ipcMain.on('window-minimize', () => win.minimize());
    ipcMain.on('window-maximize', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
    ipcMain.on('window-close', () => win.close());
}

function startPython() {
    let pythonExecutable;

    if (app.isPackaged) {
        // Production: use compiled binary from resources
        pythonExecutable = path.join(process.resourcesPath, 'backend', 'backend');
        if (process.platform === 'win32') {
            pythonExecutable += '.exe';
        }
    } else {
        // Development: use venv python
        pythonExecutable = path.join(__dirname, 'python_backend', 'venv', 'bin', 'python');
    }

    const args = app.isPackaged ? [] : [path.join(__dirname, 'python_backend', 'app.py')];

    console.log(`Starting Python process: ${pythonExecutable} ${args.join(' ')}`);

    pythonProcess = spawn(pythonExecutable, args);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

app.whenReady().then(() => {
    startPython();
    createWindow();
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
