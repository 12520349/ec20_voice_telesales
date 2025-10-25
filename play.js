const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
//0799187930
const COM_PORT = 'COM69';
const BAUDRATE = 115200;
const FILE_NAME = 'call_me.amr';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoAnswerAndPlay() {
    const port = new SerialPort({ path: COM_PORT, baudRate: BAUDRATE });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', async (data) => {
        console.log('<<', data);

        // 1. Khi có cuộc gọi đến
        if (data.includes('RING')) {
            console.log('Cuộc gọi đến - tự động trả lời...');
            await sendAT('ATA'); // tự động trả lời
            await delay(2000); // đợi kết nối

            // 2. Chọn audio channel (voice call path)
            await sendAT('AT+QAUDCH=1');
            await delay(500);

            // 3. Phát file âm thanh từ UFS
            // channel=0 (voice call path), loop=0 (phát 1 lần), async=0, output=0
            //const cmd = `AT+QPSND=0,"${FILE_NAME}",0,0,0`;
            const cmd = `AT+QPSND=1,"${FILE_NAME}",0,1`;
            await sendAT(cmd);
            console.log(`Đang phát file: ${FILE_NAME}`);
        }

        // 4. Khi kết thúc cuộc gọi
        if (data.includes('NO CARRIER')) {
            console.log('Cuộc gọi kết thúc');
        }
    });

    function sendAT(command) {
        return new Promise((resolve, reject) => {
            port.write(command + '\r', err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // 5. Kiểm tra kết nối module
    await sendAT('AT');
    await delay(500);

    console.log('Đang chờ cuộc gọi đến...');
}

autoAnswerAndPlay().catch(console.error);
