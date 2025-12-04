const { gsap } = require('gsap');
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {

    const loadingScreen = document.getElementById('loading-screen');
    const dashboard = document.getElementById('dashboard');
    const loginOverlay = document.getElementById('login-overlay');
    const mainContent = document.getElementById('main-content');
    const btnLogin = document.getElementById('btn-login');
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const variableChips = document.getElementById('variable-chips');
    const btnPreview = document.getElementById('btn-preview');
    const btnSend = document.getElementById('btn-send');
    const sentCountEl = document.getElementById('sent-count');
    const progressBar = document.getElementById('progress-bar');

    // window controls
    document.getElementById('btn-min').addEventListener('click', () => ipcRenderer.send('window-minimize'));
    document.getElementById('btn-max').addEventListener('click', () => ipcRenderer.send('window-maximize'));
    document.getElementById('btn-close').addEventListener('click', () => ipcRenderer.send('window-close'));

    // clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
    }, 1000);

    // wait for backend
    let attempts = 0;
    let backendReady = false;
    const loadingProgress = document.getElementById('loading-progress');

    const checkBackend = setInterval(async () => {
        attempts++;
        const isReady = await ElyonAPI.checkHealth();
        if (isReady || attempts > 20) {
            backendReady = true;
            clearInterval(checkBackend);
        }
    }, 500);

    // animate loading bar then reveal
    let progress = 0;
    const animateLoading = setInterval(() => {
        if (backendReady && progress < 100) {
            progress += 5; // fast finish
        } else if (!backendReady && progress < 70) {
            progress += 2; // slow build
        }

        loadingProgress.style.width = `${progress}%`;

        if (progress >= 100) {
            clearInterval(animateLoading);
            setTimeout(revealLogin, 300);
        }
    }, 50);

    function revealLogin() {
        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                loadingScreen.style.display = 'none';
                dashboard.style.opacity = 1;
                dashboard.style.pointerEvents = 'auto';
            }
        });
    }

    let userCredentials = {};

    //login
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('smtp-email').value;
        const password = document.getElementById('smtp-password').value;
        const host = document.getElementById('smtp-host').value;
        const port = document.getElementById('smtp-port').value;
        const errorMsg = document.getElementById('login-error');

        if (!email || !password) {
            errorMsg.innerText = "MISSING CREDENTIALS";
            errorMsg.classList.remove('hidden');
            return;
        }

        btnLogin.innerText = "VERIFYING...";
        btnLogin.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            const res = await ElyonAPI.verifyCredentials(email, password, host, port);
            if (res.ok) {
                userCredentials = { email, password, host, port };

                gsap.to(loginOverlay, {
                    scale: 1.1,
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.in",
                    onComplete: () => {
                        loginOverlay.style.display = 'none';
                        gsap.to(mainContent, { opacity: 1, pointerEvents: 'auto', duration: 1 });
                    }
                });
            } else {
                const data = await res.json();
                throw new Error(data.message || "Connection Failed");
            }
        } catch (e) {
            console.error(e);
            btnLogin.innerText = "INITIALIZE CONNECTION";
            btnLogin.disabled = false;
            errorMsg.innerText = e.message.toUpperCase();
            errorMsg.classList.remove('hidden');

            gsap.fromTo(loginOverlay.querySelector('.glass-card'),
                { x: -10 },
                { x: 10, duration: 0.1, repeat: 5, yoyo: true, ease: "power1.inOut", onComplete: () => {
                    gsap.to(loginOverlay.querySelector('.glass-card'), { x: 0, duration: 0.1 });
                }}
            );
        }
    });

    //html file upload
    const btnUploadHtml = document.getElementById('btn-upload-html');
    const htmlFileInput = document.getElementById('html-file-input');
    const emailBody = document.getElementById('email-body');

    if (btnUploadHtml && htmlFileInput) {
        btnUploadHtml.addEventListener('click', () => {
            htmlFileInput.click();
        });

        htmlFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    emailBody.value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
    }

    //csv upload
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('border-cyan-500');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('border-cyan-500'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('border-cyan-500');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    const dataPreviewOverlay = document.getElementById('data-preview-overlay');
    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');
    const emailColumnSelect = document.getElementById('email-column-select');
    const btnClosePreview = document.getElementById('btn-close-preview');

    dataPreviewOverlay.addEventListener('click', (e) => e.stopPropagation());

    btnClosePreview.addEventListener('click', (e) => {
        e.stopPropagation();
        dataPreviewOverlay.classList.add('hidden');
    });

    const previewModal = document.getElementById('preview-modal');
    const previewFrame = document.getElementById('preview-frame');
    const btnClosePreviewModal = document.getElementById('btn-close-preview-modal');

    btnClosePreviewModal.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });

    btnPreview.addEventListener('click', async () => {
        const body = document.getElementById('email-body').value;
        const subject = document.getElementById('email-subject').value;

        try {
            const res = await ElyonAPI.renderPreview(body, subject);
            previewModal.style.display = 'block';
            const doc = previewFrame.contentWindow.document;
            doc.open();
            doc.write(res.preview);
            doc.close();
        } catch (e) {
            console.error(e);
        }
    });

    async function handleFile(file) {
        uploadZone.innerHTML = `<div class="animate-pulse text-cyan-500">UPLOADING...</div>`;

        try {
            const res = await ElyonAPI.uploadCSV(file);
            if (res.status === 'success') {
                uploadZone.innerHTML = `
                    <div class="text-3xl text-cyan-500 font-mono">${res.count}</div>
                    <div class="text-xs text-gray-400">RECORDS LOADED</div>
                    <div class="flex gap-2 mt-4 z-30">
                        <button id="btn-show-preview" class="px-3 py-1 border border-cyan-500/50 rounded text-[10px] text-cyan-500 hover:bg-cyan-500/10 transition-colors">VIEW DATA</button>
                        <button id="btn-reset-upload" class="px-3 py-1 border border-red-500/50 rounded text-[10px] text-red-500 hover:bg-red-500/10 transition-colors">NEW FILE</button>
                    </div>
                `;
                uploadZone.appendChild(fileInput);

                document.getElementById('target-count').innerText = res.count;
                document.getElementById('sent-count').innerText = '0';
                progressBar.style.width = '0%';

                btnSend.innerText = "INITIATE SEQUENCE";
                btnSend.disabled = false;
                btnSend.classList.remove('bg-green-500', 'bg-red-500', 'text-white');

                document.getElementById('btn-show-preview').addEventListener('click', (e) => {
                    e.stopPropagation();
                    dataPreviewOverlay.classList.remove('hidden');
                });

                btnClosePreview.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dataPreviewOverlay.classList.add('hidden');
                });

                document.getElementById('btn-reset-upload').addEventListener('click', (e) => {
                    e.stopPropagation();
                    uploadZone.innerHTML = `
                        <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform z-10">
                            <svg class="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <h3 class="text-lg font-light mb-2 z-10">INGEST DATA</h3>
                        <p class="text-xs text-gray-500 font-mono z-10">DROP CSV FILE HERE</p>
                    `;
                    uploadZone.appendChild(fileInput);

                    document.getElementById('target-count').innerText = '0';
                    document.getElementById('sent-count').innerText = '0';
                    progressBar.style.width = '0%';
                    variableChips.innerHTML = '';
                    if (window.visualizer) window.visualizer.updateToGrid(0);
                });

                document.getElementById('target-count').innerText = res.count;

                if (window.visualizer) {
                    window.visualizer.updateToGrid(res.count);
                }

                variableChips.innerHTML = '';
                res.columns.forEach(col => {
                    const chip = document.createElement('div');
                    chip.className = 'px-2 py-1 bg-white/10 rounded text-[10px] font-mono cursor-pointer hover:bg-cyan-500/20 text-cyan-500';
                    chip.innerText = `{{ ${col} }}`;
                    chip.addEventListener('click', () => {
                        const textarea = document.getElementById('email-body');
                        textarea.value += ` {{ ${col} }}`;
                    });
                    variableChips.appendChild(chip);
                });

                emailColumnSelect.innerHTML = '';
                let bestMatch = '';
                res.columns.forEach(col => {
                    const option = document.createElement('option');
                    option.value = col;
                    option.innerText = col;
                    emailColumnSelect.appendChild(option);

                    if (col.toLowerCase().includes('email')) {
                        bestMatch = col;
                    }
                });
                if (bestMatch) emailColumnSelect.value = bestMatch;

                if (res.preview && res.preview.length > 0) {
                    previewHeader.innerHTML = '';
                    res.columns.forEach(col => {
                        const th = document.createElement('th');
                        th.className = 'px-2 py-1 border-b border-white/10';
                        th.innerText = col;
                        previewHeader.appendChild(th);
                    });

                    previewBody.innerHTML = '';
                    res.preview.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.className = 'border-b border-white/5 hover:bg-white/5';
                        res.columns.forEach(col => {
                            const td = document.createElement('td');
                            td.className = 'px-2 py-1 truncate max-w-[100px]';
                            td.innerText = row[col] || '';
                            tr.appendChild(td);
                        });
                        previewBody.appendChild(tr);
                    });
                }

                dataPreviewOverlay.classList.remove('hidden');
            }
        } catch (e) {
            uploadZone.innerHTML = `<div class="text-red-500">ERROR</div>`;
            uploadZone.appendChild(fileInput);
            console.error(e);
        }
    }

    //send emails
    btnSend.addEventListener('click', async () => {
        const body = document.getElementById('email-body').value;
        const subject = document.getElementById('email-subject').value;
        const emailColumn = emailColumnSelect.value;

        btnSend.disabled = true;
        btnSend.innerText = "DEPLOYING...";

        let sent = 0;
        const total = parseInt(document.getElementById('target-count').innerText) || 1;

        try {
            const response = await ElyonAPI.getEventSource(body, subject, userCredentials, emailColumn);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                lines.forEach(line => {
                    if (line.startsWith('data: ')) {
                        const msg = line.replace('data: ', '');
                        console.log(msg);

                        if (msg.startsWith('Sent')) {
                            sent++;
                            sentCountEl.innerText = sent;
                            const pct = (sent / total) * 100;
                            progressBar.style.width = `${pct}%`;

                            if (window.visualizer) {
                                window.visualizer.shootLaser();
                            }
                        } else if (msg.startsWith('Error') || msg.startsWith('Critical')) {
                            console.error("EMAIL ERROR:", msg);
                        }
                    }
                });
            }

            btnSend.innerText = "DEPLOYMENT COMPLETE";
            btnSend.classList.add('bg-green-500', 'text-white');

        } catch (e) {
            console.error(e);
            btnSend.innerText = "FAILURE";
            btnSend.classList.add('bg-red-500');
        }
    });

});
