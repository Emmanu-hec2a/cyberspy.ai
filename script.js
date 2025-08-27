// Audio context for typing sounds
        let audioContext;
        let isTyping = false;

        function initAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Audio not supported');
            }
        }

        function playTypingSound() {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a subtle typing sound
            oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }

        function typewriterEffect(element, text, callback = null) {
            if (!audioContext) initAudio();
            
            element.textContent = '';
            isTyping = true;
            let i = 0;
            
            function typeChar() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    playTypingSound();
                    i++;
                    setTimeout(typeChar, 20 + Math.random() * 30);
                } else {
                    isTyping = false;
                    if (callback) callback();
                }
            }
            
            typeChar();
        }

        function addToTerminalWithEffect(text, callback = null) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            
            typewriterEffect(line, text, callback);
        }

        // Cryptography Functions
        function caesarShift(text, shift, decrypt = false) {
            if (decrypt) shift = -shift;
            return text.replace(/[A-Za-z]/g, function(char) {
                const start = char <= 'Z' ? 65 : 97;
                return String.fromCharCode((char.charCodeAt(0) - start + shift + 26) % 26 + start);
            });
        }

        function vigenereShift(text, key, decrypt = false) {
            key = key.toUpperCase().replace(/[^A-Z]/g, '');
            if (!key) return text;
            
            let result = '';
            let keyIndex = 0;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (/[A-Za-z]/.test(char)) {
                    const start = char <= 'Z' ? 65 : 97;
                    const shift = key.charCodeAt(keyIndex % key.length) - 65;
                    const actualShift = decrypt ? -shift : shift;
                    result += String.fromCharCode((char.charCodeAt(0) - start + actualShift + 26) % 26 + start);
                    keyIndex++;
                } else {
                    result += char;
                }
            }
            return result;
        }

        function getFrequencyAnalysis(text) {
            const freq = {};
            const letters = text.replace(/[^A-Za-z]/g, '').toUpperCase();
            
            for (let char of letters) {
                freq[char] = (freq[char] || 0) + 1;
            }
            
            return freq;
        }

        function caesarEncrypt() {
            const input = document.getElementById('caesarInput').value;
            const shift = parseInt(document.getElementById('caesarShift').value) || 3;
            const result = caesarShift(input, shift);
            
            typewriterEffect(document.getElementById('caesarOutput'), 
                `Encrypted: ${result}\nShift: ${shift}`);
        }

        function caesarDecrypt() {
            const input = document.getElementById('caesarInput').value;
            const shift = parseInt(document.getElementById('caesarShift').value) || 3;
            const result = caesarShift(input, shift, true);
            
            typewriterEffect(document.getElementById('caesarOutput'), 
                `Decrypted: ${result}\nShift: ${shift}`);
        }

        function caesarBruteForce() {
            const input = document.getElementById('caesarInput').value;
            const output = document.getElementById('caesarOutput');
            
            let results = "BRUTE FORCE ATTACK - ALL POSSIBLE SHIFTS:\n";
            results += "=" .repeat(40) + "\n";
            
            for (let i = 1; i <= 25; i++) {
                const decrypted = caesarShift(input, i, true);
                results += `Shift ${i.toString().padStart(2)}: ${decrypted}\n`;
            }
            
            typewriterEffect(output, results);
        }

        function vigenereEncrypt() {
            const input = document.getElementById('vigenereInput').value;
            const key = document.getElementById('vigenereKey').value;
            if (!key) {
                typewriterEffect(document.getElementById('vigenereOutput'), 'Error: Please enter a key');
                return;
            }
            
            const result = vigenereShift(input, key);
            typewriterEffect(document.getElementById('vigenereOutput'), 
                `Encrypted: ${result}\nKey: ${key.toUpperCase()}`);
        }

        function vigenereDecrypt() {
            const input = document.getElementById('vigenereInput').value;
            const key = document.getElementById('vigenereKey').value;
            if (!key) {
                typewriterEffect(document.getElementById('vigenereOutput'), 'Error: Please enter a key');
                return;
            }
            
            const result = vigenereShift(input, key, true);
            typewriterEffect(document.getElementById('vigenereOutput'), 
                `Decrypted: ${result}\nKey: ${key.toUpperCase()}`);
        }

        function vigenereAnalyze() {
            const input = document.getElementById('vigenereInput').value;
            const output = document.getElementById('vigenereOutput');
            
            let analysis = "VIGENÈRE CIPHER ANALYSIS\n";
            analysis += "=" .repeat(30) + "\n";
            analysis += "Attempting key length detection...\n\n";
            
            // Simple key length analysis using Index of Coincidence
            const cleanText = input.replace(/[^A-Za-z]/g, '').toUpperCase();
            
            for (let keyLen = 2; keyLen <= 10; keyLen++) {
                let ic = 0;
                for (let i = 0; i < keyLen; i++) {
                    let substring = '';
                    for (let j = i; j < cleanText.length; j += keyLen) {
                        substring += cleanText[j];
                    }
                    const freq = getFrequencyAnalysis(substring);
                    const n = substring.length;
                    if (n > 1) {
                        let sum = 0;
                        for (let char in freq) {
                            sum += freq[char] * (freq[char] - 1);
                        }
                        ic += sum / (n * (n - 1));
                    }
                }
                ic /= keyLen;
                analysis += `Key length ${keyLen}: IC = ${ic.toFixed(4)} ${ic > 0.06 ? '(Possible!)' : ''}\n`;
            }
            
            typewriterEffect(output, analysis);
        }

        function performFrequencyAnalysis() {
            const input = document.getElementById('frequencyInput').value;
            const freq = getFrequencyAnalysis(input);
            const chart = document.getElementById('frequencyChart');
            const output = document.getElementById('frequencyOutput');
            
            // Create frequency chart
            chart.innerHTML = '';
            const maxFreq = Math.max(...Object.values(freq));
            
            for (let i = 0; i < 26; i++) {
                const char = String.fromCharCode(65 + i);
                const count = freq[char] || 0;
                const percentage = maxFreq > 0 ? (count / maxFreq) * 100 : 0;
                
                const bar = document.createElement('div');
                bar.className = 'freq-bar';
                bar.innerHTML = `<div class="freq-letter">${char}</div><div class="freq-count" style="height: ${percentage}%"></div><div style="font-size: 8px;">${count}</div>`;
                chart.appendChild(bar);
            }
            
            // Analysis text
            const total = Object.values(freq).reduce((a, b) => a + b, 0);
            let analysis = "FREQUENCY ANALYSIS RESULTS\n";
            analysis += "=" .repeat(30) + "\n";
            analysis += `Total letters analyzed: ${total}\n\n`;
            analysis += "Most frequent letters:\n";
            
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            sorted.slice(0, 5).forEach(([char, count]) => {
                const percent = ((count / total) * 100).toFixed(1);
                analysis += `${char}: ${count} (${percent}%)\n`;
            });
            
            analysis += "\nEnglish frequency: E(12.7%) T(9.1%) A(8.2%) O(7.5%) I(7.0%)";
            
            typewriterEffect(output, analysis);
        }

        function hybridCrack() {
            const input = document.getElementById('hybridInput').value;
            const output = document.getElementById('hybridOutput');
            
            if (!input.trim()) {
                typewriterEffect(output, 'Error: Please enter text to crack');
                return;
            }
            
            output.innerHTML = '';
            let resultCount = 0;
            
            function addResult(method, result, confidence) {
                resultCount++;
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `<strong>${method}</strong> (${confidence}): ${result}`;
                div.onclick = () => {
                    navigator.clipboard.writeText(result);
                    addToTerminalWithEffect(`Copied to clipboard: ${result.substring(0, 50)}...`);
                };
                output.appendChild(div);
            }
            
            // Try Caesar cipher brute force
            for (let shift = 1; shift <= 25; shift++) {
                const result = caesarShift(input, shift, true);
                const englishness = calculateEnglishness(result);
                if (englishness > 0.3) {
                    addResult(`Caesar Shift ${shift}`, result, `${(englishness * 100).toFixed(0)}% match`);
                }
            }
            
            // Try common Vigenère keys
            const commonKeys = ['THE', 'AND', 'KEY', 'SECRET', 'CIPHER', 'CODE', 'WORD', 'PASS', 'LOCK'];
            commonKeys.forEach(key => {
                const result = vigenereShift(input, key, true);
                const englishness = calculateEnglishness(result);
                if (englishness > 0.2) {
                    addResult(`Vigenère Key: ${key}`, result, `${(englishness * 100).toFixed(0)}% match`);
                }
            });
            
            if (resultCount === 0) {
                addResult('No matches', 'Unable to crack with common methods. Try manual analysis.', 'Low');
            }
        }

        function calculateEnglishness(text) {
            const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'DAY', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'WAY', 'SAY', 'EACH', 'WHICH', 'THEIR'];
            const words = text.toUpperCase().replace(/[^A-Z\s]/g, '').split(/\s+/);
            const matches = words.filter(word => commonWords.includes(word)).length;
            return matches / Math.max(words.length, 1);
        }
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");

        const fontSize = 10;
        const columns = canvas.width / fontSize;

        const drops = [];
        for(let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px arial';

            for(let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 35);

        // User Guide System
        const userGuideContent = `
<div class="guide-section">
    <div class="guide-section-title">🔐 CAESAR CIPHER MODULE</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Basic Operations</div>
        <div class="guide-feature-desc">The Caesar cipher shifts each letter by a fixed number of positions in the alphabet.</div>
        <ul class="guide-steps">
            <li>Enter your message in the text area</li>
            <li>Set shift value (1-25) - default is 3</li>
            <li>Click 'Encrypt' to encode or 'Decrypt' to decode</li>
            <li>Use 'Brute Force' to try all possible shifts</li>
        </ul>
        <div class="guide-tip">💡 TIP: Common Caesar shift values are 3, 13 (ROT13), and 21.</div>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">📜 VIGENÈRE CIPHER MODULE</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Advanced Polyalphabetic Encryption</div>
        <div class="guide-feature-desc">Uses a keyword to create multiple Caesar ciphers, making it much stronger than simple substitution.</div>
        <ul class="guide-steps">
            <li>Enter your message in the text area</li>
            <li>Provide a keyword (letters only, no spaces)</li>
            <li>Choose 'Encrypt' or 'Decrypt' operation</li>
            <li>Use 'Key Analysis' to detect possible key lengths</li>
        </ul>
        <div class="guide-tip">💡 TIP: Longer keys provide better security. Avoid dictionary words.</div>
        <div class="guide-warning">⚠️ WARNING: Key analysis works best with texts longer than 100 characters.</div>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">🕵️ FREQUENCY ANALYSIS MODULE</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Cryptanalysis Tool</div>
        <div class="guide-feature-desc">Analyzes letter frequency patterns to break substitution ciphers.</div>
        <ul class="guide-steps">
            <li>Paste encrypted text into the analysis area</li>
            <li>Click 'Analyze' to generate frequency chart</li>
            <li>Compare results with English letter frequencies</li>
            <li>Most common English letters: E(12.7%), T(9.1%), A(8.2%)</li>
        </ul>
        <div class="guide-tip">💡 TIP: Works best with longer cipher texts (200+ characters).</div>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">🖥️ TERMINAL INTERFACE</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Command Line Operations</div>
        <div class="guide-feature-desc">Access advanced cryptographic functions through terminal commands.</div>
        <ul class="guide-steps">
            <li>Type 'help' to see all available commands</li>
            <li>Use 'caesar encrypt/decrypt/crack [text] [shift]'</li>
            <li>Use 'vigenere encrypt/decrypt [text] [key]'</li>
            <li>Use 'frequency [text]' for quick analysis</li>
            <li>Use 'crack [ciphertext]' for auto-decryption</li>
        </ul>
        <div class="guide-tip">💡 TIP: Terminal provides faster access to crypto functions.</div>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">📊 MONITORING DASHBOARD</div>
    <div class="guide-feature">
        <div class="guide-feature-title">System Status Overview</div>
        <div class="guide-feature-desc">Real-time monitoring of network, security, and system resources.</div>
        <ul class="guide-steps">
            <li>Network Monitor: Shows active connections and traffic</li>
            <li>Security Status: Displays firewall and threat levels</li>
            <li>System Resources: Monitors CPU, memory, and disk usage</li>
            <li>All metrics update automatically every 3 seconds</li>
        </ul>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">🎯 EDUCATIONAL OBJECTIVES</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Learning Goals</div>
        <div class="guide-feature-desc">Master fundamental cybersecurity and cryptography concepts.</div>
        <ul class="guide-steps">
            <li>Understand classical cipher mechanisms</li>
            <li>Learn cryptanalysis techniques</li>
            <li>Practice ethical hacking methodologies</li>
            <li>Develop security awareness skills</li>
            <li>Explore network monitoring concepts</li>
        </ul>
        <div class="guide-warning">⚠️ ETHICS: Always use these skills responsibly and legally!</div>
    </div>
</div>

<div class="guide-section">
    <div class="guide-section-title">🚀 GETTING STARTED</div>
    <div class="guide-feature">
        <div class="guide-feature-title">Quick Start Guide</div>
        <div class="guide-feature-desc">Begin your cybersecurity journey with these recommended steps:</div>
        <ul class="guide-steps">
            <li>Start with Caesar cipher - encrypt "HELLO WORLD" with shift 5</li>
            <li>Try decrypting "MJQQT BTWQI" using brute force</li>
            <li>Experiment with Vigenère using key "SECRET"</li>
            <li>Analyze frequency of "WKLV LV D WHVW PHVVDJH"</li>
            <li>Explore terminal commands with 'mission' command</li>
        </ul>
        <div class="guide-tip">💡 TIP: Practice with short messages first, then try longer texts!</div>
    </div>
</div>
        `;

        function showUserGuide() {
            const overlay = document.getElementById('guideOverlay');
            const content = document.getElementById('guideContent');
            
            overlay.style.display = 'flex';
            
            setTimeout(() => {
                const loadingProgress = document.getElementById('loadingProgress');
                if (loadingProgress) {
                    loadingProgress.style.width = '100%';
                }
            }, 100);
            
            setTimeout(() => {
                content.innerHTML = '<div class="blinking-cursor"></div>';
                typewriterEffectHTML(content, userGuideContent);
            }, 3000);
        }

        function closeGuide() {
            document.getElementById('guideOverlay').style.display = 'none';
        }

        // Terminal functionality
        const terminalOutput = document.getElementById('terminalOutput');
        const commandInput = document.getElementById('commandInput');

        const commands = {
            help: {
                description: "Show available commands",
                execute: () => {
                    return [
                        "Available Commands:",
                        "==================",
                        "help         - Show this help menu",
                        "scan         - Perform network scan",
                        "status       - Show system status",
                        "nmap         - Simulate network mapping",
                        "whoami       - Display current user",
                        "ls           - List directory contents",
                        "pwd          - Show current directory",
                        "ping         - Ping a target (educational)",
                        "encrypt      - Encrypt a message",
                        "decrypt      - Decrypt a message",
                        "caesar       - Caesar cipher tools",
                        "vigenere     - Vigenère cipher tools", 
                        "frequency    - Frequency analysis",
                        "crack        - Auto-crack cipher",
                        "clear        - Clear terminal",
                        "matrix       - Toggle matrix effect",
                        "mission      - Show mission briefing"
                    ];
                }
            },
            scan: {
                description: "Perform network scan",
                execute: () => {
                    const results = [
                        "Initiating network scan...",
                        "Scanning ports 1-1000...",
                        "Port 22/tcp  open  ssh",
                        "Port 80/tcp  open  http",
                        "Port 443/tcp open  https",
                        "Port 3306/tcp closed mysql",
                        "Scan completed. 3 open ports found."
                    ];
                    return results;
                }
            },
            nmap: {
                description: "Simulate network mapping",
                execute: (args) => {
                    const target = args[0] || "127.0.0.1";
                    return [
                        `Starting Nmap scan on ${target}...`,
                        "Host is up (0.00050s latency).",
                        "PORT     STATE SERVICE",
                        "22/tcp   open  ssh",
                        "80/tcp   open  http",
                        "443/tcp  open  https",
                        "MAC Address: 00:14:22:01:23:45 (Dell Inc.)",
                        "Nmap scan completed."
                    ];
                }
            },
            whoami: {
                description: "Display current user",
                execute: () => ["cyberspy-agent"]
            },
            pwd: {
                description: "Show current directory",
                execute: () => ["/home/cyberspy/mission"]
            },
            ls: {
                description: "List directory contents",
                execute: () => [
                    "mission_briefing.txt",
                    "tools/",
                    "logs/",
                    "encrypted_files/",
                    "network_data.pcap"
                ]
            },
            ping: {
                description: "Ping a target",
                execute: (args) => {
                    const target = args[0] || "google.com";
                    return [
                        `PING ${target} (8.8.8.8): 56 data bytes`,
                        "64 bytes from 8.8.8.8: icmp_seq=0 ttl=117 time=12.1 ms",
                        "64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=11.9 ms",
                        "64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=12.3 ms",
                        "--- ping statistics ---",
                        "3 packets transmitted, 3 received, 0% packet loss"
                    ];
                }
            },
            status: {
                description: "Show system status",
                execute: () => [
                    "System Status Report:",
                    "=====================",
                    "Firewall: ACTIVE",
                    "Antivirus: UP TO DATE",
                    "Network: SECURE",
                    "Encryption: AES-256",
                    "Mission Status: 78% COMPLETE",
                    "Agent Level: INTERMEDIATE"
                ]
            },
            encrypt: {
                description: "Encrypt a message",
                execute: (args) => {
                    const message = args.join(' ') || "Hello World";
                    const encrypted = btoa(message);
                    return [
                        `Original: ${message}`,
                        `Encrypted (Base64): ${encrypted}`,
                        "Encryption complete."
                    ];
                }
            },
            decrypt: {
                description: "Decrypt a message",
                execute: (args) => {
                    const encrypted = args[0] || "SGVsbG8gV29ybGQ=";
                    try {
                        const decrypted = atob(encrypted);
                        return [
                            `Encrypted: ${encrypted}`,
                            `Decrypted: ${decrypted}`,
                            "Decryption complete."
                        ];
                    } catch (e) {
                        return ["Error: Invalid encrypted message"];
                    }
                }
            },
            clear: {
                description: "Clear terminal",
                execute: () => {
                    terminalOutput.innerHTML = '<div class="terminal-line">Terminal cleared.</div>';
                    return [];
                }
            },
            matrix: {
                description: "Toggle matrix effect",
                execute: () => {
                    const canvas = document.getElementById('matrixCanvas');
                    canvas.style.opacity = canvas.style.opacity === '0' ? '0.1' : '0';
                    return ["Matrix effect toggled."];
                }
            },
            mission: {
                description: "Show mission briefing",
                execute: () => [
                    "MISSION BRIEFING - CLASSIFICATION: EDUCATIONAL",
                    "==============================================",
                    "Objective: Learn cybersecurity fundamentals",
                    "Skills to master:",
                    "• Network scanning and reconnaissance",
                    "• Encryption and decryption techniques",
                    "• System monitoring and analysis",
                    "• Security best practices",
                    "• Advanced cryptanalysis",
                    "• Cipher breaking techniques",
                    "",
                    "New Skills Unlocked:",
                    "• Caesar cipher cryptanalysis",
                    "• Vigenère cipher breaking",
                    "• Frequency analysis",
                    "• Hybrid cipher cracking",
                    "",
                    "Remember: Always use these skills ethically!",
                    "Good luck, Agent!"
                ]
            },
            caesar: {
                description: "Caesar cipher educational tool",
                execute: (args) => {
                    if (args.length < 2) {
                        return ["Usage: caesar <encrypt/decrypt/crack> <text> [shift]"];
                    }
                    const action = args[0];
                    const text = args.slice(1, -1).join(' ') || args[1];
                    const shift = parseInt(args[args.length - 1]) || 3;
                    
                    if (action === 'encrypt') {
                        return [`Caesar Encrypted: ${caesarShift(text, shift)}`];
                    } else if (action === 'decrypt') {
                        return [`Caesar Decrypted: ${caesarShift(text, shift, true)}`];
                    } else if (action === 'crack') {
                        const results = [];
                        for (let i = 1; i <= 25; i++) {
                            results.push(`Shift ${i}: ${caesarShift(text, i, true)}`);
                        }
                        return results;
                    }
                    return ["Invalid action. Use: encrypt, decrypt, or crack"];
                }
            },
            vigenere: {
                description: "Vigenère cipher educational tool",
                execute: (args) => {
                    if (args.length < 3) {
                        return ["Usage: vigenere <encrypt/decrypt> <text> <key>"];
                    }
                    const action = args[0];
                    const key = args[args.length - 1];
                    const text = args.slice(1, -1).join(' ');
                    
                    if (action === 'encrypt') {
                        return [`Vigenère Encrypted: ${vigenereShift(text, key)}`];
                    } else if (action === 'decrypt') {
                        return [`Vigenère Decrypted: ${vigenereShift(text, key, true)}`];
                    }
                    return ["Invalid action. Use: encrypt or decrypt"];
                }
            },
            frequency: {
                description: "Perform frequency analysis",
                execute: (args) => {
                    const text = args.join(' ');
                    if (!text) return ["Usage: frequency <text to analyze>"];
                    
                    const freq = getFrequencyAnalysis(text);
                    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                    const results = ["Frequency Analysis:", "=================="];
                    sorted.slice(0, 10).forEach(([char, count]) => {
                        results.push(`${char}: ${count} occurrences`);
                    });
                    return results;
                }
            },
            crack: {
                description: "Auto-crack unknown cipher",
                execute: (args) => {
                    const text = args.join(' ');
                    if (!text) return ["Usage: crack <encrypted text>"];
                    
                    const results = ["Auto-cracking cipher...", "======================"];
                    
                    // Try Caesar
                    for (let i = 1; i <= 25; i++) {
                        const attempt = caesarShift(text, i, true);
                        if (calculateEnglishness(attempt) > 0.3) {
                            results.push(`Possible Caesar (shift ${i}): ${attempt}`);
                        }
                    }
                    
                    // Try common Vigenère keys
                    const keys = ['KEY', 'SECRET', 'CIPHER', 'CODE'];
                    keys.forEach(key => {
                        const attempt = vigenereShift(text, key, true);
                        if (calculateEnglishness(attempt) > 0.2) {
                            results.push(`Possible Vigenère (key ${key}): ${attempt}`);
                        }
                    });
                    
                    if (results.length === 2) {
                        results.push("No clear matches found. Manual analysis recommended.");
                    }
                    
                    return results;
                }
            }
        };

        function addToTerminal(text) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = text;
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }

        commandInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const input = commandInput.value.trim();
                if (input) {
                    addToTerminal(`cyberspy@education:~$ ${input}`);
                    
                    const args = input.split(' ');
                    const command = args[0].toLowerCase();
                    const commandArgs = args.slice(1);

                    if (commands[command]) {
                        const output = commands[command].execute(commandArgs);
                        if (Array.isArray(output)) {
                            let i = 0;
                            function showNextLine() {
                                if (i < output.length) {
                                    addToTerminalWithEffect(output[i], () => {
                                        i++;
                                        setTimeout(showNextLine, 100);
                                    });
                                }
                            }
                            showNextLine();
                        }
                    } else {
                        addToTerminalWithEffect(`Command not found: ${command}. Type 'help' for available commands.`);
                    }
                }
                commandInput.value = '';
            }
        });

        // Update time
        function updateTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
                now.toLocaleTimeString('en-US', { hour12: false });
        }
        setInterval(updateTime, 1000);
        updateTime();

        // Simulate dynamic data updates
        function updateMetrics() {
            document.getElementById('connections').textContent = Math.floor(Math.random() * 100) + 20;
            document.getElementById('packets').textContent = (Math.floor(Math.random() * 2000) + 500).toLocaleString();
            document.getElementById('bandwidth').textContent = (Math.random() * 100).toFixed(1) + ' MB/s';
            document.getElementById('cpu').textContent = Math.floor(Math.random() * 60) + 20 + '%';
            document.getElementById('memory').textContent = Math.floor(Math.random() * 40) + 50 + '%';
            
            // Update progress bars
            document.getElementById('networkProgress').style.width = (Math.random() * 100) + '%';
            document.getElementById('securityProgress').style.width = '85%';
            document.getElementById('systemProgress').style.width = (Math.random() * 100) + '%';
            document.getElementById('missionProgressBar').style.width = '78%';
        }

        setInterval(updateMetrics, 3000);
        updateMetrics();

        // Resize canvas on window resize
        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Focus on terminal input
        commandInput.focus();