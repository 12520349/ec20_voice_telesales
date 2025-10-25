const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');

const COM_PORT = 'COM69';
const BAUDRATE = 115200;
const FILE_PATH = 'D:\\PROJECT_2025\\arm_audio_demo\\call_me.amr';
const UFS_FILENAME = 'call_me.amr';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadFile() {
    const port = new SerialPort({ path: COM_PORT, baudRate: BAUDRATE });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', data => {
        console.log('<<', data);
    });

    function sendAT(command) {
        return new Promise((resolve, reject) => {
            port.write(command + '\r', err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // 1. Kiểm tra kết nối
    await sendAT('AT');
    await delay(500);

    // 2. Đọc file WAV
    const fileData = fs.readFileSync(FILE_PATH);
    const fileSize = fileData.length;
    console.log('File size:', fileSize, 'bytes');

    // 3. Gửi lệnh upload
    await sendAT(`AT+QFUPL="${UFS_FILENAME}",${fileSize},60`);
    await delay(500);

    console.log('>> Bắt đầu gửi dữ liệu nhị phân file...');
    port.write(fileData, err => {
        if (err) console.error('Error sending file:', err);
        else console.log('File data sent.');
    });
}

uploadFile().catch(console.error);
