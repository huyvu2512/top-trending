import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db = null;

/**
 * Khởi tạo Firebase Admin SDK một cách an toàn
 * Nếu chưa cấu hình biến môi trường, hệ thống sẽ bỏ qua và chỉ lưu vào public/data.json
 */
export function initFirebase() {
    if (db) return db;

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        privateKey = privateKey.trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
    }

    if (!projectId || !clientEmail || !privateKey) {
        console.log('[Firebase]: Chưa cấu hình đầy đủ biến môi trường trong .env. Dữ liệu sẽ lưu cục bộ tại public/data.json.');
        return null;
    }

    try {
        if (!getApps().length) {
            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        }
        db = getFirestore();
        console.log('[Firebase]: Kết nối Firestore thành công!');
        return db;
    } catch (error) {
        console.error('[Firebase Lỗi]: Không thể kết nối Firebase:', error.message);
        return null;
    }
}

/**
 * Lưu 1 bảng xếp hạng vào Firestore theo Document Bucket Pattern
 * ĐẢM BẢO: Ghi đè file mới tinh, xóa bỏ toàn bộ data cũ của doc
 * @param {string} docKey - ví dụ: "youtube", "spotify", "google", "netflix"
 * @param {Array} items - danh sách các item xu hướng mới nhất
 * @param {Object} metadata - thông tin bổ sung (platform, region, category)
 */
export async function saveRankingToFirestore(docKey, items, metadata = {}) {
    const firestore = initFirebase();
    if (!firestore) return false;

    try {
        const docRef = firestore.collection('rankings').doc(docKey);
        // Ghi đè mới 100%, KHÔNG dùng merge để tránh lẫn data cũ
        await docRef.set({
            ...metadata,
            docKey,
            lastUpdated: new Date().toISOString(),
            totalItems: items.length,
            items: items
        });

        console.log(`[Firebase]: Đã lưu mới 100% doc "${docKey}" (${items.length} items).`);
        return true;
    } catch (error) {
        console.error(`[Firebase Lỗi ghi doc ${docKey}]:`, error.message);
        return false;
    }
}

function parseFirestoreRestValue(val) {
    if (!val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('booleanValue' in val) return val.booleanValue;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) return (val.arrayValue.values || []).map(parseFirestoreRestValue);
    if ('mapValue' in val) {
        const obj = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            obj[k] = parseFirestoreRestValue(v);
        }
        return obj;
    }
    return null;
}

/**
 * Đọc dữ liệu 1 nền tảng từ Firestore (hỗ trợ Admin SDK + REST API fallback)
 */
export async function getRankingFromFirestore(docKey) {
    const firestore = initFirebase();
    if (firestore) {
        try {
            const docRef = firestore.collection('rankings').doc(docKey);
            const snap = await docRef.get();
            if (snap.exists) {
                return snap.data();
            }
        } catch (error) {
            console.error(`[Firebase Lỗi đọc Admin SDK doc ${docKey}]:`, error.message);
        }
    }

    // Fallback qua Firestore REST API công khai
    try {
        const pId = process.env.FIREBASE_PROJECT_ID?.trim();
        if (!pId) return null;
        const url = `https://firestore.googleapis.com/v1/projects/${pId}/databases/(default)/documents/rankings/${docKey}`;
        const res = await fetch(url);
        if (res.ok) {
            const doc = await res.json();
            const fields = doc.fields || {};
            const result = {};
            for (const [k, v] of Object.entries(fields)) {
                result[k] = parseFirestoreRestValue(v);
            }
            return result;
        }
    } catch (restErr) {
        console.error(`[Firebase REST fallback doc ${docKey}]:`, restErr.message);
    }

    return null;
}

/**
 * Lưu metadata tổng hợp toàn hệ thống vào Firestore
 */
export async function saveMetadataToFirestore(metadata = {}) {
    const firestore = initFirebase();
    if (!firestore) return false;

    try {
        const docRef = firestore.collection('rankings').doc('metadata');
        await docRef.set({
            ...metadata,
            last_updated: metadata.last_updated || new Date().toISOString()
        });
        console.log('[Firebase]: Đã cập nhật doc "metadata" mốc hoàn tất tổng hợp.');
        return true;
    } catch (error) {
        console.error('[Firebase Lỗi ghi doc metadata]:', error.message);
        return false;
    }
}

/**
 * Đọc toàn bộ rankings từ Firestore (hỗ trợ Admin SDK + REST API fallback)
 */
export async function getAllRankingsFromFirestore() {
    const firestore = initFirebase();
    if (firestore) {
        try {
            const colRef = firestore.collection('rankings');
            const snap = await colRef.get();
            const rankings = {};
            const platformsUpdated = {};
            let latestUpdate = null;

            snap.forEach(doc => {
                const data = doc.data();
                const key = doc.id;
                if (key === 'metadata') {
                    if (data.last_updated) {
                        latestUpdate = data.last_updated;
                    }
                } else {
                    rankings[key] = data.items || [];
                    if (data.lastUpdated) {
                        platformsUpdated[key] = data.lastUpdated;
                        if (!latestUpdate || data.lastUpdated > latestUpdate) {
                            latestUpdate = data.lastUpdated;
                        }
                    }
                }
            });

            if (Object.keys(rankings).length > 0) {
                return {
                    rankings,
                    last_updated: latestUpdate,
                    platforms_updated: platformsUpdated
                };
            }
        } catch (error) {
            console.error('[Firebase Lỗi đọc all rankings qua Admin SDK]:', error.message);
        }
    }

    // Fallback qua Firestore REST API công khai
    try {
        const pId = process.env.FIREBASE_PROJECT_ID?.trim();
        if (!pId) return null;
        const url = `https://firestore.googleapis.com/v1/projects/${pId}/databases/(default)/documents/rankings`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const rankings = {};
            const platformsUpdated = {};
            let latestUpdate = null;

            for (const doc of data.documents || []) {
                const key = doc.name.split('/').pop();
                const fields = doc.fields || {};
                const lastUp = fields.lastUpdated?.stringValue || fields.last_updated?.stringValue;
                if (key === 'metadata') {
                    if (lastUp) latestUpdate = lastUp;
                } else {
                    if (lastUp) {
                        platformsUpdated[key] = lastUp;
                        if (!latestUpdate || lastUp > latestUpdate) {
                            latestUpdate = lastUp;
                        }
                    }
                    if (fields.items) {
                        rankings[key] = parseFirestoreRestValue(fields.items);
                    }
                }
            }

            if (Object.keys(rankings).length > 0) {
                return {
                    rankings,
                    last_updated: latestUpdate,
                    platforms_updated: platformsUpdated
                };
            }
        }
    } catch (restErr) {
        console.error('[Firebase Lỗi đọc all rankings qua REST fallback]:', restErr.message);
    }

    return null;
}

/**
 * Kiểm tra trạng thái kết nối Firebase
 */
export function getFirebaseStatus() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    const hasConfig = Boolean(projectId && clientEmail && privateKey);
    const connected = Boolean(db);

    return {
        configured: hasConfig,
        connected: connected || hasConfig, // nếu đã cấu hình, initFirebase sẵn sàng
        projectId: projectId || null,
        clientEmail: clientEmail || null
    };
}

