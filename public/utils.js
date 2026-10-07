/**
 * Định dạng mốc thời gian ISO sang chuỗi hiển thị chuẩn Việt Nam: HH:mm DD/MM/YYYY (múi giờ GMT+7, hệ 24h)
 */
export function formatUpdateTime(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;

    try {
        const formatter = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const map = {};
        for (const part of parts) {
            map[part.type] = part.value;
        }
        return `${map.hour}:${map.minute} ${map.day}/${map.month}/${map.year}`;
    } catch (_) {
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const vnDate = new Date(utc + (7 * 3600000));
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(vnDate.getHours())}:${pad(vnDate.getMinutes())} ${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)}/${vnDate.getFullYear()}`;
    }
}

