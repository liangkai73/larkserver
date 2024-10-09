const fs = require('fs');
const path = require('path');

const dataJsonPath = path.join(__dirname, 'data.json');
const dataArrJsonPath = path.join(__dirname, 'dataArr.json');
const errorJsonPath = path.join(__dirname, 'error.json');
const logsJsonPath = path.join(__dirname, 'dlogs.json');
const textPath = path.join(__dirname, 'longdata.txt');

// 根据传入的url路径读取文件内容
function readFileSync(url) {
    try {
        const data = fs.readFileSync(url, 'utf8');
        const obj = JSON.parse(data);
        return obj;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// 在dataJsonPath路径的文件里添加data数据
function writeFileSync(data, type = 1) {
    let path = '';
    switch (type) {
        case 1:
            path = dataJsonPath;
            break;
        case 2:
            path = dataArrJsonPath;
            break;
        case 3:
            path = errorJsonPath;
            break;
        case 4:
            path = logsJsonPath;
            break;
        case 5:
            path = textPath;
            break;
    }
    try {
        // let baseData = readFileSync(path) || [];
        // baseData.push(data);
        // const mergeData = JSON.stringify(baseData);
        let baseData = readFileSync(path) || '';
        baseData += data;
        // const mergeData = JSON.stringify(baseData);
        fs.writeFileSync(path, baseData);
    } catch (err) {
        console.error('写入失败:', err);
    }
}

module.exports = { writeFileSync }