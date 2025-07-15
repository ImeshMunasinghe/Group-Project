// ==== BLUETOOTH FUNCTIONALITY ====
let bluetoothDevice = null;
let bluetoothCharacteristic = null;
let isConnected = false;

const ROBOT_SERVICE_UUID = '12345678-1234-5678-9abc-123456789abc';
const ROBOT_CHARACTERISTIC_UUID = '87654321-4321-8765-cba9-987654321cba';

async function connectToRobot() {
    if (!navigator.bluetooth) {
        alert('Bluetooth not supported in this browser. Use Chrome or Edge.');
        return;
    }

    try {
        console.log('Requesting Bluetooth Device...');
        updateConnectionStatus('🔄 Connecting...', '#ff9800');

        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [ROBOT_SERVICE_UUID]
        });

        console.log('Selected device:', bluetoothDevice.name);

        const server = await bluetoothDevice.gatt.connect();
        console.log('Connected to GATT server');

        const service = await server.getPrimaryService(ROBOT_SERVICE_UUID);
        bluetoothCharacteristic = await service.getCharacteristic(ROBOT_CHARACTERISTIC_UUID);

        isConnected = true;

        updateConnectionStatus(`🔗 Connected: ${bluetoothDevice.name}`, '#4CAF50');
        updateBluetoothButton(true);

        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    } catch (error) {
        console.error('Connection failed:', error);
        updateConnectionStatus('❌ Connection Failed', '#f44336');
        updateBluetoothButton(false);

        if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
        }

        bluetoothDevice = null;
        bluetoothCharacteristic = null;
        isConnected = false;
    }
}

function onDisconnected() {
    console.log('Robot disconnected');
    isConnected = false;
    bluetoothCharacteristic = null;
    bluetoothDevice = null;
    updateConnectionStatus('❌ Robot Disconnected', '#f44336');
    updateBluetoothButton(false);
}

async function sendRobotCommand(command) {
    if (!isConnected || !bluetoothCharacteristic) {
        console.log(`Robot not connected - simulating command:`, command);
        return;
    }
    try {
        const commandBytes = new TextEncoder().encode(command);
        await bluetoothCharacteristic.writeValue(commandBytes);
        console.log(`Command sent: ${command}`);
    } catch (error) {
        console.error(`Failed to send command:`, error);
    }
}

function updateConnectionStatus(message, color) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = message;
    statusElement.style.color = color;
}

function updateBluetoothButton(connected) {
    const btn = document.getElementById('bluetoothBtn');
    if (connected) {
        btn.classList.add('connected');
        btn.innerHTML = `<span>☑ Connected to ${bluetoothDevice?.name || 'Robot'}</span>`;
    } else {
        btn.classList.remove('connected');
        btn.innerHTML = `<span>☒ Connect Robot</span>`;
    }
}

// ==== The Rest of Your Script Remains Unchanged ====
