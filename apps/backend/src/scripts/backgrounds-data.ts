/**
 * Danh sách nền dựng sẵn — sinh tự động, đừng sửa tay.
 * Ảnh nằm trong storefront tại public/backgrounds/.
 * Nguồn: Unsplash & Pexels License (dùng thương mại, không cần ghi nguồn).
 */
export type BackgroundPreset = {
  image_url: string
  name: string
  theme: string
  opacity: number
  saturate: number
  sort_order: number
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { image_url: "/backgrounds/01-banh-tong-kem.webp", name: "Bánh trung thu tông kem", theme: "trung-thu", opacity: 30, saturate: 80, sort_order: 0 },
  { image_url: "/backgrounds/02-banh-deo-hoa-van.webp", name: "Bánh dẻo hoa văn", theme: "trung-thu", opacity: 42, saturate: 100, sort_order: 1 },
  { image_url: "/backgrounds/03-banh-nuong-vang.webp", name: "Bánh nướng vàng", theme: "trung-thu", opacity: 38, saturate: 100, sort_order: 2 },
  { image_url: "/backgrounds/04-den-long-hoi-an.webp", name: "Đèn lồng Hội An", theme: "trung-thu", opacity: 20, saturate: 90, sort_order: 3 },
  { image_url: "/backgrounds/05-trang-may.webp", name: "Trăng mây", theme: "trung-thu", opacity: 26, saturate: 95, sort_order: 4 },
  { image_url: "/backgrounds/06-banh-deo-trang.webp", name: "Bánh dẻo trắng tinh", theme: "trung-thu", opacity: 45, saturate: 100, sort_order: 5 },
  { image_url: "/backgrounds/07-ban-tra-am.webp", name: "Bàn trà ấm", theme: "trung-thu", opacity: 22, saturate: 90, sort_order: 6 },
  { image_url: "/backgrounds/08-trang-ram-sao.webp", name: "Trăng rằm đầy sao", theme: "trung-thu", opacity: 18, saturate: 100, sort_order: 7 },
  { image_url: "/backgrounds/09-hoa-tra-nen-toi.webp", name: "Hoa và trà nền tối", theme: "trung-thu", opacity: 20, saturate: 95, sort_order: 8 },
  { image_url: "/backgrounds/10-ca-chep-vang.webp", name: "Cá chép vàng", theme: "trung-thu", opacity: 22, saturate: 95, sort_order: 9 },
  { image_url: "/backgrounds/trungthu-11-tra-va-banh.webp", name: "Rót trà bên bánh", theme: "trung-thu", opacity: 22, saturate: 90, sort_order: 10 },
  { image_url: "/backgrounds/trungthu-12-banh-tren-tham.webp", name: "Bánh trên thớt gỗ", theme: "trung-thu", opacity: 32, saturate: 95, sort_order: 11 },
  { image_url: "/backgrounds/trungthu-13-mam-banh.webp", name: "Mâm bánh cổ truyền", theme: "trung-thu", opacity: 26, saturate: 95, sort_order: 12 },
  { image_url: "/backgrounds/trungthu-14-banh-dia-den.webp", name: "Bánh trên đĩa sẫm", theme: "trung-thu", opacity: 22, saturate: 95, sort_order: 13 },
  { image_url: "/backgrounds/trungthu-15-banh-hong-trang.webp", name: "Bánh hồng trắng", theme: "trung-thu", opacity: 40, saturate: 100, sort_order: 14 },
  { image_url: "/backgrounds/trungthu-16-den-long-do.webp", name: "Đèn lồng cam treo", theme: "trung-thu", opacity: 22, saturate: 90, sort_order: 15 },
  { image_url: "/backgrounds/trungthu-17-den-giay.webp", name: "Đèn giấy thủ công", theme: "trung-thu", opacity: 20, saturate: 85, sort_order: 16 },
  { image_url: "/backgrounds/trungthu-18-den-pho-co.webp", name: "Đèn lồng phố cổ", theme: "trung-thu", opacity: 20, saturate: 88, sort_order: 17 },
  { image_url: "/backgrounds/trungthu-19-den-tren-cay.webp", name: "Đèn lồng trên cây", theme: "trung-thu", opacity: 22, saturate: 88, sort_order: 18 },
  { image_url: "/backgrounds/trungthu-20-banh-tra-set.webp", name: "Bánh và ấm trà trắng", theme: "trung-thu", opacity: 26, saturate: 95, sort_order: 19 },
  { image_url: "/backgrounds/trungthu-21-banh-xep-chong.webp", name: "Bánh xếp chồng", theme: "trung-thu", opacity: 26, saturate: 95, sort_order: 20 },
  { image_url: "/backgrounds/trungthu-22-banh-dia-su.webp", name: "Bánh trên đĩa sứ", theme: "trung-thu", opacity: 26, saturate: 95, sort_order: 21 },
  { image_url: "/backgrounds/trungthu-23-banh-hoa-van.webp", name: "Bánh hoa văn tinh xảo", theme: "trung-thu", opacity: 30, saturate: 95, sort_order: 22 },
  { image_url: "/backgrounds/trungthu-24-banh-tuyet.webp", name: "Bánh dẻo tuyết", theme: "trung-thu", opacity: 38, saturate: 100, sort_order: 23 },
  { image_url: "/backgrounds/trungthu-25-banh-chieu-tre.webp", name: "Bánh trên chiếu tre", theme: "trung-thu", opacity: 24, saturate: 95, sort_order: 24 },
  { image_url: "/backgrounds/saffron-01-soi-thia-go.webp", name: "Sợi saffron trên thìa gỗ", theme: "saffron", opacity: 30, saturate: 100, sort_order: 25 },
  { image_url: "/backgrounds/saffron-02-hoa-bat-kim.webp", name: "Hoa saffron trong bát", theme: "saffron", opacity: 26, saturate: 95, sort_order: 26 },
  { image_url: "/backgrounds/saffron-03-hoa-bat-go.webp", name: "Hoa nghệ tây bát gỗ", theme: "saffron", opacity: 28, saturate: 95, sort_order: 27 },
  { image_url: "/backgrounds/saffron-04-nhuy-cam.webp", name: "Nhuỵ cam nổi bật", theme: "saffron", opacity: 28, saturate: 95, sort_order: 28 },
  { image_url: "/backgrounds/saffron-05-cho-gia-vi.webp", name: "Sạp gia vị chợ", theme: "saffron", opacity: 24, saturate: 90, sort_order: 29 },
  { image_url: "/backgrounds/saffron-06-hoa-dat-kho.webp", name: "Hoa trên đất khô", theme: "saffron", opacity: 28, saturate: 95, sort_order: 30 },
  { image_url: "/backgrounds/saffron-07-canh-dong.webp", name: "Cánh đồng nghệ tây", theme: "saffron", opacity: 26, saturate: 92, sort_order: 31 },
  { image_url: "/backgrounds/saffron-08-hoa-la-thu.webp", name: "Hoa giữa lá thu", theme: "saffron", opacity: 26, saturate: 92, sort_order: 32 },
  { image_url: "/backgrounds/saffron-09-hoa-suong.webp", name: "Hoa đọng sương", theme: "saffron", opacity: 30, saturate: 92, sort_order: 33 },
  { image_url: "/backgrounds/saffron-10-hoa-no-ro.webp", name: "Hoa nở rộ", theme: "saffron", opacity: 26, saturate: 92, sort_order: 34 },
  { image_url: "/backgrounds/saffron-11-hoa-vuon.webp", name: "Hoa trong vườn", theme: "saffron", opacity: 26, saturate: 92, sort_order: 35 },
  { image_url: "/backgrounds/saffron-12-hoa-can-canh.webp", name: "Hoa cận cảnh", theme: "saffron", opacity: 26, saturate: 92, sort_order: 36 },
  { image_url: "/backgrounds/saffron-13-hoa-tu-nhien.webp", name: "Hoa giữa thiên nhiên", theme: "saffron", opacity: 26, saturate: 92, sort_order: 37 },
  { image_url: "/backgrounds/saffron-14-soi-tren-nuoc.webp", name: "Sợi saffron trên nước", theme: "saffron", opacity: 30, saturate: 100, sort_order: 38 },
  { image_url: "/backgrounds/saffron-15-hu-thuy-tinh.webp", name: "Hũ saffron thuỷ tinh", theme: "saffron", opacity: 30, saturate: 100, sort_order: 39 },
  { image_url: "/backgrounds/saffron-16-hu-gia-vi.webp", name: "Hũ sứ đựng gia vị", theme: "saffron", opacity: 34, saturate: 95, sort_order: 40 },
  { image_url: "/backgrounds/saffron-17-sac-do-nau.webp", name: "Sắc đỏ nâu", theme: "saffron", opacity: 26, saturate: 92, sort_order: 41 },
  { image_url: "/backgrounds/saffron-18-nen-am.webp", name: "Nền vân ấm", theme: "saffron", opacity: 34, saturate: 95, sort_order: 42 },
  { image_url: "/backgrounds/saffron-19-hoa-tim-toi.webp", name: "Hoa tím nền tối", theme: "saffron", opacity: 20, saturate: 90, sort_order: 43 },
  { image_url: "/backgrounds/saffron-20-hoa-tim-sang.webp", name: "Hoa tím nền sáng", theme: "saffron", opacity: 28, saturate: 90, sort_order: 44 },
  { image_url: "/backgrounds/tet-01-li-xi-mai-vang.webp", name: "Lì xì và mai vàng", theme: "tet", opacity: 30, saturate: 95, sort_order: 45 },
  { image_url: "/backgrounds/tet-02-trang-tri-do.webp", name: "Trang trí đỏ rực", theme: "tet", opacity: 22, saturate: 88, sort_order: 46 },
  { image_url: "/backgrounds/tet-03-den-long-tet.webp", name: "Đèn lồng ngày Tết", theme: "tet", opacity: 22, saturate: 88, sort_order: 47 },
  { image_url: "/backgrounds/tet-04-mai-vang.webp", name: "Mai vàng khoe sắc", theme: "tet", opacity: 28, saturate: 95, sort_order: 48 },
  { image_url: "/backgrounds/tet-05-cho-hoa.webp", name: "Chợ hoa ngày Tết", theme: "tet", opacity: 24, saturate: 90, sort_order: 49 },
  { image_url: "/backgrounds/tet-06-cho-ruc-ro.webp", name: "Chợ Tết rực rỡ", theme: "tet", opacity: 22, saturate: 88, sort_order: 50 },
  { image_url: "/backgrounds/tet-07-pho-ha-noi.webp", name: "Phố Hà Nội ngày Tết", theme: "tet", opacity: 22, saturate: 88, sort_order: 51 },
  { image_url: "/backgrounds/tet-08-cho-tet.webp", name: "Phiên chợ Tết", theme: "tet", opacity: 22, saturate: 88, sort_order: 52 },
  { image_url: "/backgrounds/tet-09-trang-tri-cho.webp", name: "Trang trí chợ Tết", theme: "tet", opacity: 22, saturate: 88, sort_order: 53 },
  { image_url: "/backgrounds/tet-10-den-treo-pho.webp", name: "Đèn treo dọc phố", theme: "tet", opacity: 22, saturate: 88, sort_order: 54 },
  { image_url: "/backgrounds/tet-11-hoi-cho.webp", name: "Hội chợ ngày Tết", theme: "tet", opacity: 22, saturate: 88, sort_order: 55 },
  { image_url: "/backgrounds/tet-12-cho-dem.webp", name: "Chợ đêm đèn lồng", theme: "tet", opacity: 20, saturate: 88, sort_order: 56 },
  { image_url: "/backgrounds/tet-13-ngoai-troi.webp", name: "Trang trí ngoài trời", theme: "tet", opacity: 24, saturate: 90, sort_order: 57 },
  { image_url: "/backgrounds/tet-14-sac-tet.webp", name: "Sắc Tết", theme: "tet", opacity: 24, saturate: 90, sort_order: 58 },
  { image_url: "/backgrounds/tet-15-phong-bao-do.webp", name: "Phong bao trên nền đỏ", theme: "tet", opacity: 22, saturate: 88, sort_order: 59 },
  { image_url: "/backgrounds/tet-16-den-do-vang.webp", name: "Đèn đỏ vàng", theme: "tet", opacity: 22, saturate: 88, sort_order: 60 },
  { image_url: "/backgrounds/tet-17-gio-qua-do.webp", name: "Giỏ quà đỏ vàng", theme: "tet", opacity: 26, saturate: 92, sort_order: 61 },
  { image_url: "/backgrounds/tet-18-thiep-vang-do.webp", name: "Thiệp vàng trên đỏ", theme: "tet", opacity: 24, saturate: 90, sort_order: 62 },
  { image_url: "/backgrounds/tet-19-den-cau-do.webp", name: "Đèn cầu đỏ", theme: "tet", opacity: 22, saturate: 88, sort_order: 63 },
  { image_url: "/backgrounds/tet-20-den-nhieu-mau.webp", name: "Đèn lồng nhiều màu", theme: "tet", opacity: 20, saturate: 85, sort_order: 64 },
]
