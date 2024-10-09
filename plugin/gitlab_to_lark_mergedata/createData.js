const { writeFileSync } = require('./fsData');

const getOrders = (num) => new Array(num).fill(null)
    .map(() => {
        const specialChars = ['*', ';', '.'];
        const allowedChars = [...Array(26).keys()].map(i => String.fromCharCode(65 + i)).concat([...Array(10).keys()].map(String));
        let orderNumber = '';
        for (let j = 0; j < 10; j++) {
            const randomIndex = Math.floor(Math.random() * (allowedChars.length + specialChars.length));
            orderNumber += randomIndex < allowedChars.length ? allowedChars[randomIndex] : specialChars[randomIndex - allowedChars.length];
        }
        return orderNumber;
    })
    .filter((value, index, self) => self.indexOf(value) === index);

function generateRandomStrings(number) {
    // 定义可能的字符集
    const chars = 'ABCDMHuvwxyz0123456789!#;,.';
    let result = [];

    for (let i = 0; i < number; i++) {
        let lineLength = Math.floor(Math.random() * 12) + 1; // 确定每行的长度为1到12
        let line = '';

        for (let j = 0; j < lineLength; j++) {
            let randomIndex = Math.floor(Math.random() * chars.length); // 从字符集中随机选择一个字符
            line += chars[randomIndex];
        }

        result.push(line); // 将生成的行添加到结果数组中
    }

    return result.join('\n'); // 将数组转换为字符串，每行用换行符分隔
}

// 示例：生成5行随机字符串

const morck = generateRandomStrings(30000)
console.log('start write');
writeFileSync(morck, 5);
console.log('write success');