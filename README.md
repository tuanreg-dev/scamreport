# Website Bao Cao So Dien Thoai Xau

Ung dung web giup nguoi dung:
- Tra cuu so dien thoai da bi bao cao
- Gui bao cao so dien thoai lua dao/spam/lam phien
- Luu du lieu bao cao vao Turso (SQLite cloud)
- Xem thong ke tong hop theo tung so dien thoai

Toan bo giao dien hien thi bang tieng Viet.

## Cong nghe

- Next.js (App Router)
- React
- TailwindCSS
- Turso (`@libsql/client`)

## Cai dat

Yeu cau:
- Node.js 20+ (khuyen nghi ban LTS moi)
- npm

Thuc hien:

```bash
npm install
npm run dev
```

Sau do mo trinh duyet:

`http://localhost:3000`

Bien moi truong:

```bash
cp .env.example .env.local
```

Cap nhat gia tri:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Cac tinh nang chinh

### 1) Tab "Tim kiem"
- Nhap so dien thoai
- Bam nut "Tim kiem"
- Neu da co bao cao: hien tong so lan va danh sach danh muc
- Neu chua co bao cao: hien thong bao "So dien thoai nay chua bi bao cao."

### 2) Tab "Bao cao"
- Nhap so dien thoai can bao cao
- Chon it nhat mot danh muc:
  - Lua dao
  - Spam quang cao
  - Lam phien
  - Doi no
  - Khac
- Bam "Gui bao cao"
- He thong luu vao DB va hien thong bao thanh cong

## Luu tru du lieu

Ung dung tao bang/index tu dong tren Turso trong lan chay dau tien.

Schema tham khao:

`db/schema.sql`

## API

- `GET /api/search?phone=<so_dien_thoai>`
  - Tra ve thong ke bao cao cua so dien thoai
- `POST /api/report`
  - Body JSON:
    ```json
    {
      "phoneNumber": "0901234567",
      "categories": ["Lua dao", "Spam quang cao"]
    }
    ```

## Cau truc thu muc

- `app/page.tsx`: Giao dien chinh (2 tab Tim kiem/Bao cao)
- `app/api/search/route.ts`: API tim kiem
- `app/api/report/route.ts`: API gui bao cao
- `lib/db.ts`: Ket noi Turso va truy van du lieu

