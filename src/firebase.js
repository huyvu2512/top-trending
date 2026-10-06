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

/**
 * Đọc dữ liệu 1 nền tảng từ Firestore
 */
export async function getRankingFromFirestore(docKey) {
    const firestore = initFirebase();
    if (!firestore) return null;

    try {
        const docRef = firestore.collection('rankings').doc(docKey);
        const snap = await docRef.get();
        if (snap.exists) {
            return snap.data();
        }
        return null;
    } catch (error) {
        console.error(`[Firebase Lỗi đọc doc ${docKey}]:`, error.message);
        return null;
    }
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
 * Đọc toàn bộ rankings từ Firestore
 */
export async function getAllRankingsFromFirestore() {
    const firestore = initFirebase();
    if (!firestore) return null;

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

        return {
            rankings,
            last_updated: latestUpdate,
            platforms_updated: platformsUpdated
        };
    } catch (error) {
        console.error('[Firebase Lỗi đọc all rankings]:', error.message);
        return null;
    }
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

