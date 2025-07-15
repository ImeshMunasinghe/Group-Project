// ==== BLUETOOTH FUNCTIONALITY ====
let bluetoothDevice = null;
let bluetoothCharacteristic = null;
let isConnected = false;

// IMPORTANT: Replace these with your robot's actual UUIDs
const ROBOT_SERVICE_UUID = '12345678-1234-5678-9abc-123456789abc';
const ROBOT_CHARACTERISTIC_UUID = '87654321-4321-8765-cba9-987654321cba';

// Connect to robot via Bluetooth
async function connectToRobot() {
    if (!navigator.bluetooth) {
        alert('Bluetooth not supported in this browser. Use Chrome or Edge.');
        return;
    }

    try {
        console.log('Requesting Bluetooth Device...');
        updateConnectionStatus('$ Connecting...', '#ff9800');

        // Request device - you might need to change this based on your robot
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [ROBOT_SERVICE_UUID]
        });

        console.log('Selected device:', bluetoothDevice.name);

        // Connect to GATT server
        const server = await bluetoothDevice.gatt.connect();
        console.log('Connected to GATT server');

        // Get service and characteristic
        const service = await server.getPrimaryService(ROBOT_SERVICE_UUID);
        bluetoothCharacteristic = await service.getCharacteristic(ROBOT_CHARACTERISTIC_UUID);

        isConnected = true;
        updateConnectionStatus('$ Robot Connected', '#4CAF50');
        updateBluetoothButton(true);

        console.log('Robot connected successfully!');

        // Handle disconnection
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    } catch (error) {
        console.error('Connection failed:', error);
        updateConnectionStatus('X Connection Failed', '#f44336');
        updateBluetoothButton(false);
    }
}

// Handle disconnection
function onDisconnected() {
    console.log('Robot disconnected');
    isConnected = false;
    bluetoothCharacteristic = null;
    updateConnectionStatus('X Robot Disconnected', '#f44336');
    updateBluetoothButton(false);
}

// Send command to robot
async function sendRobotCommand(command) {
    if (!isConnected || !bluetoothCharacteristic) {
        console.log(`Robot not connected - simulating command:`, command);
        return;
    }
    try {
        // Convert command to bytes - adjust format based on your robot's protocol
        const commandBytes = new TextEncoder().encode(command);
        await bluetoothCharacteristic.writeValue(commandBytes);
        console.log(`Command sent: ${command}`);
    } catch (error) {
        console.error(`Failed to send command:`, error);
    }
}

// Update connection status display
function updateConnectionStatus(message, color) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = message;
    statusElement.style.color = color;
}

// Update bluetooth button appearance
function updateBluetoothButton(connected) {
    const btn = document.getElementById('bluetoothBtn');
    if (connected) {
        btn.classList.add('connected');
        btn.innerHTML = '<span>☑ Connected<span>';
    } else {
        btn.classList.remove('connected');
        btn.innerHTML = '<span>☒ Connect Robot<span>';
    }
}

// ==== VOICE RECOGNITION FUNCTIONALITY ====
let recognition = null;
let isListening = false;

// Voice command mapping
const VOICE_COMMANDS = {
    'forward': 'up',
    'move forward': 'up',
    'go forward': 'up',
    'up': 'up',

    'backward': 'down',
    'move backward': 'down',
    'go backward': 'down',
    'back': 'down',
    'down': 'down',

    'left': 'left',
    'turn left': 'left',
    'go left': 'left',

    'right': 'right',
    'turn right': 'right',
    'go right': 'right',

    'stop': 'stop',
    'halt': 'stop',
    'freeze': 'stop',
    'pause': 'stop'
};

// Initialize speech recognition
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition not supported');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isListening = true;
        updateMicStatus('Listening for commands...');
        console.log('Speech recognition started');
    };

    recognition.onresult = function(event) {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            processVoiceCommand(finalTranscript.toLowerCase().trim());
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        updateMicStatus('X Voice recognition error');
        isListening = false;
        const micButton = document.getElementById('micButton');
        micButton.classList.remove('active');
    };

    recognition.onend = function() {
        isListening = false;
        updateMicStatus('Tap microphone to start');
        const micButton = document.getElementById('micButton');
        micButton.classList.remove('active');
    };

    return true;
}

// Process voice command
function processVoiceCommand(command) {
    console.log('Voice command received:', command);

    // Check if command matches any of our voice commands
    for (const [phrase, action] of Object.entries(VOICE_COMMANDS)) {
        if (command.includes(phrase)) {
            updateMicStatus(`☑ Command: "${phrase}" - ${action.toUpperCase()}`);
            sendRobotCommand(action);
            return;
        }
    }

    updateMicStatus(`X Unknown command: "${command}"`);
}

// Toggle microphone
function toggleMic() {
    const micButton = document.getElementById('micButton');

    if (!recognition) {
        if (!initializeSpeechRecognition()) {
            updateMicStatus('X Speech recognition not supported');
            return;
        }
    }

    if (isListening) {
        recognition.stop();
        micButton.classList.remove('active');
        updateMicStatus('Tap microphone to start');
    } else {
        recognition.start();
        micButton.classList.add('active');
    }
}

// Update microphone status
function updateMicStatus(message) {
    document.getElementById('micStatus').textContent = message;
}

// ==== NAVIGATION FUNCTIONS ====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function goHome() {
    showScreen('home');
}

function goToModeSelection() {
    showScreen('mode');
}

function goToGameMode() {
    showScreen('game');
}

function goToPlayMode() {
    showScreen('play');
}

function goToParentMode() {
    showScreen('parent');
}

function goToMicScreen() {
    showScreen('mic');
    // Initialize speech recognition when entering mic screen
    if (!recognition) {
        initializeSpeechRecognition();
    }
}

function goToEntertainmentMode() {
    showScreen('entertainment');
}

function goToSongs() {
    showScreen('songs');
}

function goToStories() {
    showScreen('stories');
}

function goToLullabies() {
    showScreen('lullabies');
}

// ==== CONTROL FUNCTIONS ====
function buttonPress(button, direction) {
    // Visual feedback
    button.style.background = 'rgba(76, 175, 80, 0.8)';
    setTimeout(() => {
        button.style.background = 'rgba(255, 255, 255, 0.2)';
    }, 200);

    // Send command to robot
    sendRobotCommand(direction);
    console.log(`Control pressed: ${direction}`);
}

// Camera toggle functions
let cameraEnabled = false;
function toggleCamera() {
    const cameraBtn = document.getElementById('cameraBtn');
    cameraEnabled = !cameraEnabled;

    if (cameraEnabled) {
        cameraBtn.style.background = 'rgba(76, 175, 80, 0.8)';
        sendRobotCommand('camera_on');
    } else {
        cameraBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        sendRobotCommand('camera_off');
    }
}

function toggleParentCamera() {
    const cameraBtn = document.getElementById('parentCameraBtn');
    cameraEnabled = !cameraEnabled;

    if (cameraEnabled) {
        cameraBtn.style.background = 'rgba(76, 175, 80, 0.8)';
        sendRobotCommand('camera_on');
    } else {
        cameraBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        sendRobotCommand('camera_off');
    }
}

// ==== PLAYLIST FUNCTIONS ====
let currentlyPlaying = null;

function playItem(item, type) {
    // Stop previous item
    if (currentlyPlaying) {
        currentlyPlaying.querySelector('.status-indicator').classList.remove('active');
    }

    // Start new item
    const indicator = item.querySelector('.status-indicator');
    indicator.classList.add('active');
    currentlyPlaying = item;

    // Get item name
    const itemName = item.querySelector('span:nth-child(2)').textContent;

    // Send command to robot
    sendRobotCommand(`play_${type}_${itemName.replace(/\s+/g, '_').toLowerCase()}`);
    console.log(`Playing ${type}: ${itemName}`);

    // Simulate playback ending after 30 seconds
    setTimeout(() => {
        if (currentlyPlaying === item) {
            indicator.classList.remove('active');
            currentlyPlaying = null;
        }
    }, 30000);
}

// ==== INITIALIZATION ====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sparkle Pet Robot Interface Loaded');

    // Initialize speech recognition
    initializeSpeechRecognition();

    // Set initial connection status
    updateConnectionStatus('X Robot Disconnected','#f44336');
});

// ==== KEYBOARD SHORTCUTS ====
document.addEventListener('keydown', function(event) {
    // Only allow keyboard controls in play and parent modes
    const currentScreen = document.querySelector('.screen.active').id;

    if (currentScreen !== 'play' && currentScreen !== 'parent') {
        return;
    }

    switch(event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            event.preventDefault();
            sendRobotCommand('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            event.preventDefault();
            sendRobotCommand('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            event.preventDefault();
            sendRobotCommand('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            event.preventDefault();
            sendRobotCommand('right');
            break;
        case ' ':
        case 'Escape':
            event.preventDefault();
            sendRobotCommand('stop');
            break;
    }
});