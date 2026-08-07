# /assets/images/

Lưu ảnh tự host tại đây (thay vì dùng link ngoài như picsum.photos).

CHỈ dùng WebP (không dùng jpg/png) — nhẹ hơn, load nhanh hơn.

## Cấu trúc thư mục con

```
assets/images/
├── ui/          logo, hero-bg, các ảnh giao diện chung
├── articles/    ảnh đại diện + ảnh trong thân bài viết
├── authors/     ảnh tác giả (nếu có)
└── icons/       icon rời (không phải favicon — favicon.svg vẫn ở assets/)
```

Quy ước đặt tên trong `articles/`: trùng slug bài viết, ví dụ:
  - canva-review.webp        -> ảnh đại diện bài "canva-review"
  - canva-review-2.webp      -> ảnh phụ thứ 2 trong thân bài (nếu cần)
  - canva-review-3.webp      -> ảnh phụ thứ 3, v.v.

Nếu một bài có rất nhiều ảnh, có thể tách tiếp thành thư mục riêng:
  articles/canva-review/featured.webp
  articles/canva-review/1.webp
  articles/canva-review/2.webp

Sau khi thêm ảnh vào đây, trỏ đường dẫn trong JSON dạng:
  "image": "/assets/images/articles/canva-review.webp"

Convert ảnh sang WebP trước khi upload, ví dụ bằng cwebp:
  cwebp -q 82 canva-review.jpg -o canva-review.webp

Lazy-load: toàn bộ ảnh card trên trang chủ/category dùng native
loading="lazy" (xem js/main.js, hàm cardHTML) — không cần JS riêng.
Ảnh đại diện (featured) trên trang chi tiết bài (article.html) KHÔNG
gắn loading="lazy" để hiển thị ngay (eager mặc định).

Nhớ cập nhật field "image" ở TẤT CẢ các nơi có bản copy của bài viết đó:
  - data/articles/meta/<slug>.json
  - data/latest/page-N.json
  - data/categories/<cat>/page-N.json
  - data/featured/page-N.json (nếu bài nằm trong Featured)

Khuyến nghị resize/nén ảnh trước khi upload (ảnh card không cần rộng quá 800px)
vì thư mục này không tự tạo nhiều kích cỡ như picsum.photos từng làm qua query ?w=.
