# Chính Sách Bảo Mật (Security Policy)

## Phạm vi và Mục đích

Dự án Top Trending được xây dựng với mục đích theo dõi, tổng hợp và phân tích dữ liệu xu hướng truyền thông số mang tính chất học tập, nghiên cứu kỹ thuật phi thương mại. Hệ thống sử dụng các API chính thức (YouTube Data API v3, Spotify Web API) và các nguồn dữ liệu công khai (Google Trends RSS, Netflix Tudum) tuân thủ quy định của nhà cung cấp dịch vụ.

## Quản lý Thông tin và Khóa Bảo mật

1. **Không lưu trữ Secret Key trên kho mã nguồn:** Toàn bộ thông tin xác thực nhạy cảm (Firebase Private Key, YouTube API Key, Spotify Client Secret) chỉ được quản lý thông qua biến môi trường local (.env) và hệ thống GitHub Actions Secrets. File .env và các file chứa khóa dịch vụ được cấu hình chặn tuyệt đối trong .gitignore.
2. **Cơ chế lưu trữ Cloud an toàn:** Dữ liệu bảng xếp hạng trên Cloud Firestore được tổ chức theo mô hình Bucket Document (chỉ ghi đè dữ liệu mới nhất, không lưu trữ bất kỳ thông tin định danh người dùng cá nhân nào).
3. **Kết nối mã hóa HTTPS:** Toàn bộ luồng giao tiếp giữa client, server backend, pipeline thu thập dữ liệu và các hệ thống API bên ngoài đều được mã hóa toàn trình qua kết nối HTTPS / TLS tiêu chuẩn.
4. **Tiêu đề bảo mật:** Hệ thống cấu hình sẵn các tiêu đề bảo mật trên mạng lưới phân phối Vercel Edge Network và Express middleware.

## Báo cáo Lỗ hổng Bảo mật

Nếu bạn phát hiện bất kỳ vấn đề bảo mật tiềm ẩn nào liên quan đến mã nguồn hoặc cơ chế xử lý dữ liệu của dự án này, vui lòng thực hiện theo các bước sau:

1. Tuyệt đối không công khai lỗ hổng qua hệ thống Issue công khai của GitHub.
2. Gửi thông tin chi tiết về lỗ hổng kèm các bước tái hiện tới kênh liên hệ cá nhân của tác giả:
   - Trang thông tin: https://huyvu2512.io.vn
   - Hồ sơ GitHub: https://github.com/huyvu2512
3. Tác giả sẽ tiếp nhận, đánh giá mức độ nghiêm trọng và phát hành bản cập nhật vá lỗi trong thời gian sớm nhất.
