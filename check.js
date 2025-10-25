const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const COM_PORT = 'COM69';
const BAUDRATE = 115200;
const FILE_TO_CHECK = 'call_me.amr';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkFileExists() {
    const port = new SerialPort({ path: COM_PORT, baudRate: BAUDRATE });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    const fileList = [];

    parser.on('data', data => {
        // Ví dụ EC20 trả: +QFLST: "myaudio.wav",53804
        if (data.startsWith('+QFLST:')) {
            const match = data.match(/\+QFLST:\s*"(.+?)"/);
            if (match && match[1]) {
                fileList.push(match[1]);
            }
        }
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

    // 2. Lấy danh sách file trên UFS
    await sendAT('AT+QFLST');
    await delay(1000); // chờ parser đọc toàn bộ data

    if (fileList.includes(FILE_TO_CHECK)) {
        console.log(`File "${FILE_TO_CHECK}" đã tồn tại trên UFS`);
    } else {
        console.log(`File "${FILE_TO_CHECK}" chưa có trên UFS`);
    }

    port.close();
}

checkFileExists().catch(console.error);
