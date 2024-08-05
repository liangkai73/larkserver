'use strict';

let SEQSTARTDATE = 0;
let SEQ = 1000

/**
 * @desc: 根据传入的时间戳过滤成日期格式
 * @param: date | any // new Date(param).getTime()
 * @param: type | Number // 类型 0 1 2
 */
function getDateStr(date, type = 0) {
    let time;
    if (date instanceof Date) {
        time = date;
    } else {
        if (!date || isNaN(date * 1)) {
            return date;
        }
        time = new Date(date * 1);
    }
    const Y = time.getFullYear().toString();
    let M = (time.getMonth() * 1 + 1).toString();
    let D = time.getDate().toString();
    let H = time.getHours().toString();
    let Mi = time.getMinutes().toString();
    let S = time.getSeconds().toString();
    let dateStr;
    if (M.length == 1) {
        M = "0" + M;
    }
    if (D.length == 1) {
        D = "0" + D;
    }
    if (H.length == 1) {
        H = "0" + H;
    }
    if (Mi.length == 1) {
        Mi = "0" + Mi;
    }
    if (S.length == 1) {
        S = "0" + S;
    }
    if (type == 0) {
        dateStr = `${Y}/${M}/${D}`;
    } else if (type == 1) {
        dateStr = `${Y}/${M}/${D} ${H}:${Mi}`;
    } else if (type == 2) {
        dateStr = `${Y}-${M}-${D} ${H}:${Mi}:${S}`;
    } else if (type == 3) {
        dateStr = `${Y}${M}`;
    } else if (type == 4) {
        dateStr = `${Y}-${M}-${D}`;
    } else if (type == 5) {
        dateStr = `${Y}-${M}`;
    } else if (type == 6) {
        dateStr = `${Y}-${M}-${D} ${H}:${Mi}`;
    } else if (type == 7) {
        dateStr = `${H}:${Mi}`;
    } else if (type == 8) {
        dateStr = `${Y}-${M}-${D}T${H}:${Mi}:${S}Z`;
    } else if (type == 9) {
        dateStr = `${Y}${M}${D}${H}${Mi}${S}`;
    }

    return dateStr;
}

/**
 * @desc: 获取自增序列 1000ms充值
 *
 */

function getSEQ() {
    let date1

    if (SEQSTARTDATE === 0) {
        SEQSTARTDATE = new Date().getTime()
    } else {
        date1 = new Date().getTime()
        if (date1 - SEQSTARTDATE <= 1000) {
            SEQ += 1
        } else {
            SEQ = 1000
        }
        SEQSTARTDATE = date1
    }

    return SEQ
}

/**
 * @desc: 获取包含签名结果的postParams
 * @param: obj
*/

function getCryptoParams(obj) {
    if (!obj) {
        return
    }

}

module.exports = {
    getDateStr,
    getSEQ
}