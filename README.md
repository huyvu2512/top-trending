<div align="center">

# Top Trending

**Theo dõi xu hướng nổi trội, cập nhật và phân tích dữ liệu thịnh hành tại Việt Nam**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla%20Dark-1572B6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[![Stars](https://img.shields.io/github/stars/huyvu2512/top-trending?style=flat-square&label=Stars&color=FFCC00)](https://github.com/huyvu2512/top-trending/stargazers)
[![Forks](https://img.shields.io/github/forks/huyvu2512/top-trending?style=flat-square&label=Forks&color=6e7681)](https://github.com/huyvu2512/top-trending/forks)
[![Issues](https://img.shields.io/github/issues/huyvu2512/top-trending?style=flat-square&label=Issues&color=f85149)](https://github.com/huyvu2512/top-trending/issues)
[![Last Commit](https://img.shields.io/github/last-commit/huyvu2512/top-trending?style=flat-square&label=Last%20Commit&color=3fb950)](https://github.com/huyvu2512/top-trending/commits/main)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=huyvu2512.top-trending&left_text=Visitors&left_color=6e7681&right_color=5865F2)

[Xem Website](https://trending.huyvu2512.io.vn/) · [Báo Lỗi](https://github.com/huyvu2512/top-trending/issues) · [Yêu Cầu Tính Năng](https://github.com/huyvu2512/top-trending/issues)

</div>

---

<div align="center">
  <img src="public/assets/preview.png?v=2" alt="Giao diện Top Trending" width="100%">
</div>

---

## Giới thiệu
Top Trending là nền tảng theo dõi xu hướng nổi trội, tự động cập nhật và phân tích dữ liệu thịnh hành tại Việt Nam theo thời gian thực trên đa nền tảng truyền thông số (YouTube, Spotify, Google Trends, Netflix). Sản phẩm được thiết kế và phát triển bởi Huy Vũ (@huyvu2512) với mục tiêu nghiên cứu chuyên sâu về kiến trúc pipeline dữ liệu, giao thức API và xây dựng giải pháp trực quan hóa số liệu trực tuyến mang lại trải nghiệm tối ưu cho người dùng.

Hệ thống tích hợp trực tiếp YouTube Data API v3, Spotify Web API, Google Trends RSS và Netflix Tudum Top 10 tại Việt Nam. Toàn bộ dữ liệu được chuẩn hóa, tính toán biến động thứ hạng (rank change), đo lường mức độ quan tâm (lượt xem, lượt stream, lưu lượng tìm kiếm) và đồng bộ trực tiếp lên Cloud Firestore theo mô hình Bucket Document nhằm tối ưu chi phí hoàn toàn miễn phí.

---

## Tính năng chính
- Bảng xếp hạng đa nền tảng - Đồng bộ đồng thời bảng xếp hạng từ 4 nền tảng lớn nhất hiện nay: YouTube Trending, Spotify Top 50, Google Trends 7 ngày qua và Netflix Top 10 Phim & TV Shows tại Việt Nam.
- Dữ liệu mới 100% - Cơ chế pipeline tự động làm mới toàn bộ dữ liệu mỗi chu kỳ quét, không sử dụng lại bất kỳ dữ liệu cũ nào, đảm bảo phản ánh chính xác nhất diễn biến thịnh hành theo thời gian thực.
- Đồng bộ Cloud Firestore - Áp dụng kiến trúc Bucket Document Pattern lưu trữ dữ liệu theo từng tài liệu riêng biệt, chỉ tiêu tốn 4-5 lượt ghi mỗi chu kỳ và vận hành hoàn toàn trong gói miễn phí của Firebase Spark.
- Tự động hóa qua GitHub Actions - Thiết lập lịch trình cron tự động chạy pipeline mỗi 3 tiếng trên GitHub Actions, tự động đồng bộ lên Database mà không tạo bất kỳ commit rác nào trong lịch sử Git.
- REST API module hóa - Cung cấp hệ thống router API riêng biệt (/api/status, /api/rankings, /api/rankings/:platform, /api/fetch, /api/sync) hỗ trợ truy vấn dữ liệu từ Firestore và kích hoạt cào dữ liệu thủ công.
- Trực quan hóa dữ liệu hiện đại - Giao diện Dark theme tối giản, bảng Spotlight tiêu điểm Top 1, bộ lọc đa danh mục linh hoạt (Tổng hợp, Âm nhạc, Trò chơi, Tin tức, Thể thao, Phim ảnh).
- Tối ưu hóa di động - Hệ thống thanh điều hướng Bottom Navigation Bar cố định chuẩn Native App trên màn hình di động, danh mục tự động xuống dòng và xử lý chống tràn chữ với hiệu ứng ellipsis.
- Chuẩn hóa SEO và Link Preview - Tích hợp đầy đủ thẻ OpenGraph, Twitter Cards, Schema.org JSON-LD, sitemap.xml và robots.txt giúp hiển thị ảnh xem trước sắc nét khi chia sẻ liên kết trên Facebook, Zalo, Telegram.

---

## Công nghệ
| Thành phần | Công nghệ |
| :--- | :--- |
| Frontend | HTML5, Vanilla JavaScript (ES6 Modules) |
| Styling | Vanilla CSS3 (Dark Theme, Glassmorphism, Responsive Mobile) |
| Backend Server | Node.js, Express.js (Modular Router) |
| Database Cloud | Google Cloud Firestore (Firebase Admin SDK) |
| Pipeline & Scrapers | Axios, Child Process, Fast XML Parser, Scraper Engine |
| Tự động hóa CI/CD | GitHub Actions (Cron Workflow) |
| Triển khai | Vercel Edge Network / VPS Node.js |

---

## Cấu trúc thư mục
```text
top-trending/
├── .github/
│   └── workflows/
│       └── update_data.yml        # Workflow Sync Data to Firebase tự động mỗi 3 tiếng
├── public/                        # Toàn bộ Frontend tĩnh và tài nguyên web (phục vụ trực tiếp)
│   ├── assets/                    # Favicon, logo thương hiệu, banner preview
│   │   ├── favicon.png
│   │   ├── logo.png
│   │   └── preview.png
│   ├── data/                      # Dữ liệu bảng xếp hạng tĩnh JSON
│   │   ├── google.json
│   │   ├── google_explore.json
│   │   ├── netflix.json
│   │   ├── platforms.json
│   │   ├── spotify.json
│   │   └── youtube.json
│   ├── views/                     # Các module giao diện render từng nền tảng
│   │   ├── google.js
│   │   ├── netflix.js
│   │   ├── overview.js
│   │   ├── spotify.js
│   │   └── youtube.js
│   ├── app.js                     # Trình điều khiển router và logic phía client
│   ├── index.html                 # Trang chủ duy nhất và thẻ meta SEO
│   ├── manifest.json              # Cấu hình PWA
│   ├── robots.txt                 # Cấu hình robot tìm kiếm
│   ├── sitemap.xml                # Sơ đồ trang web
│   └── style.css                  # Hệ thống giao diện stylesheet
├── src/                           # Toàn bộ mã nguồn logic backend và thu thập dữ liệu
│   ├── collectors/                # Bộ thu thập dữ liệu chuyên biệt từng nền tảng
│   │   ├── google_trends.js
│   │   ├── netflix.js
│   │   ├── spotify.js
│   │   └── youtube.js
│   ├── firebase.js                # Kết nối Cloud Firestore và helper DB
│   ├── pipeline.js                # Trình điều phối cào dữ liệu và ghi Firestore
│   └── server.js                  # Server Express local và REST API
├── .env.example                   # Mẫu cấu hình biến môi trường
├── .gitignore                     # Bỏ qua tệp nhạy cảm và node_modules
├── package.json                   # Cấu hình dependencies và lệnh chạy
├── vercel.json                    # Cấu hình định tuyến CDN và bảo mật headers
├── SECURITY.md                    # Chính sách bảo mật
├── LICENSE                        # Giấy phép MIT
└── README.md                      # Tài liệu hướng dẫn dự án
```

---

## Cài đặt và vận hành

### Yêu cầu môi trường
- Node.js phiên bản 18 trở lên (khuyên dùng Node.js 20 LTS)
- Trình quản lý gói npm phiên bản 9 trở lên

### Các bước cài đặt
```bash
# 1. Clone kho mã nguồn
git clone https://github.com/huyvu2512/top-trending.git
cd top-trending

# 2. Cài đặt các gói thư viện
npm install

# 3. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa file .env để điền khóa Firebase và YouTube API Key (Spotify, Google Trends và Netflix hoạt động 100% tự động không cần key)

# 4. Chạy server phát triển
npm run dev

# Mở trình duyệt tại: http://localhost:3000
```

### Chạy thủ công Pipeline cào dữ liệu
```bash
# Cào toàn bộ 4 nền tảng và đồng bộ vào Cloud Firestore và public/data/
npm run fetch
```

---

## API Overview
Hệ thống cung cấp các endpoint REST API backend phục vụ tra cứu dữ liệu và điều phối pipeline:

| Endpoint | Method | Mô tả |
| :--- | :--- | :--- |
| `/api/status` | GET | Kiểm tra trạng thái hệ thống, kết nối Firestore DB và thời gian cập nhật |
| `/api/rankings` | GET | Lấy toàn bộ bảng xếp hạng từ Firestore (kèm fallback file local) |
| `/api/rankings/:platform` | GET | Lấy bảng xếp hạng theo nền tảng cụ thể (youtube, spotify, google, netflix) |
| `/api/fetch` | GET | Kích hoạt thủ công pipeline cào dữ liệu mới 100% |
| `/api/sync` | POST | Đồng bộ dữ liệu mới và cập nhật trạng thái lên Cloud Firestore |

---

## Triển khai và Tự động hóa

### Triển khai Vercel
1. Đẩy mã nguồn dự án lên kho lưu trữ GitHub cá nhân.
2. Đăng nhập vào Vercel Dashboard và chọn Add New Project.
3. Chọn repository `top-trending`.
4. Hệ thống Vercel sẽ tự động nhận diện cấu hình thông qua `vercel.json` và `package.json`.
5. Thiết lập các biến môi trường tương ứng trong mục Environment Variables trên Vercel.
6. Nhấn Deploy để hoàn tất quy trình triển khai.

### Tự động hóa GitHub Actions
Dự án tích hợp sẵn workflow tại `.github/workflows/update_data.yml`:
- Tự động kích hoạt mỗi 3 tiếng một lần thông qua cron job `0 */3 * * *`.
- Nạp các Secrets cấu hình từ GitHub Settings (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `YOUTUBE_API_KEY`).
- Chạy pipeline cào dữ liệu sạch và ghi trực tiếp vào Cloud Firestore, đảm bảo bảng xếp hạng luôn tươi mới liên tục 24/7.

---

## Tài liệu
| Tài liệu | Nội dung |
| :--- | :--- |
| [SECURITY.md](./SECURITY.md) | Chính sách bảo mật, xử lý dữ liệu và quy trình báo cáo lỗ hổng |
| [LICENSE](./LICENSE) | Giấy phép mã nguồn mở MIT |

---

## Tuyên bố miễn trừ trách nhiệm
Dự án này được tạo ra hoàn toàn vì mục đích học tập, nghiên cứu về kiến trúc pipeline dữ liệu và giao thức web mang tính chất phi thương mại. Dự án không liên kết, không được tài trợ và không đại diện cho Google LLC, YouTube LLC, Spotify AB hoặc Netflix Inc. Mọi nhãn hiệu, logo và tên gọi nền tảng thuộc quyền sở hữu của các đơn vị tương ứng.

Mọi hành vi khai thác dữ liệu phải tuân thủ điều khoản dịch vụ và hạn mức yêu cầu của từng nền tảng cung cấp. Tác giả hoàn toàn không chịu trách nhiệm đối với bất kỳ hành vi sử dụng sai mục đích nào của người dùng.

---

## Giấy phép
Mã nguồn được phát hành theo giấy phép [MIT License](./LICENSE).
