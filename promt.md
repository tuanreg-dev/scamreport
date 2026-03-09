Create a complete web application with the following requirements:

PROJECT PURPOSE
The website is used to report and search scam, spam, or harmful phone numbers. Users can report suspicious phone numbers and check whether a phone number has been reported by others.

LANGUAGE
The entire website interface must be in Vietnamese.

CORE FEATURES

1. Landing Page
The homepage should contain two tabs:

- Tab 1: Tìm kiếm (Search)
- Tab 2: Báo cáo (Report)

The UI must be clean, modern, simple, and easy for anyone to use.

2. Search Tab (Tìm kiếm)

This tab allows users to check if a phone number has been reported.

UI Elements:
- A phone number input field
- A "Tìm kiếm" (Search) button

Behavior:
- When the user searches a phone number:
  - If the phone number exists in the database:
      Display:
      - Total number of reports
      - Categories of reports
      - A simple summary like:
        "Số điện thoại này đã bị báo cáo X lần"
        and show categories (lừa đảo, spam, làm phiền, khác).
  - If the phone number has never been reported:
      Display message:
      "Số điện thoại này chưa bị báo cáo."

3. Report Tab (Báo cáo)

This tab allows users to report a phone number.

UI Elements:
- Phone number input field
- A checkbox list of report categories:
  - Lừa đảo
  - Spam quảng cáo
  - Làm phiền
  - Đòi nợ
  - Khác

- A "Gửi báo cáo" (Submit Report) button

Validation:
- If the phone number is empty → show error message
- If no category is selected → show error message
- Show user-friendly Vietnamese validation messages.

After successful submission:
- Save data to database
- Show confirmation message:
  "Báo cáo đã được gửi thành công."

DATABASE

Use a database to store report data.

Suggested table structure:

reports
- id
- phone_number
- category
- created_at

The system should be able to count how many reports each phone number has.

TECH STACK (preferred)

Frontend:
- Next.js or React
- TailwindCSS for modern UI

Backend:
- Node.js API routes

Database:
- PostgreSQL or SQLite

The project should run locally with simple setup.

USER EXPERIENCE

The website must:
- Be fast and responsive
- Work well on both desktop and mobile
- Keep the reporting and searching process extremely simple and quick.

DESIGN

Use a modern minimal design:
- Clean layout
- Soft colors
- Clear buttons
- Mobile-friendly

DEPLOYMENT

The project should include:
- Complete source code
- Database schema
- Installation instructions
- README explaining how to run the project locally

GOAL

Produce a ready-to-run project where users can:
- Search a phone number
- Report a phone number
- Store reports in a database
- View report statistics.