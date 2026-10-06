/**
 * Định dạng mốc thời gian ISO sang chuỗi hiển thị chuẩn Việt Nam: HH:mm DD/MM/YYYY
 */
export function formatUpdateTime(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    const pad = (n) => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    return `${hh}:${mm} ${DD}/${MM}/${YYYY}`;
}
