# DBMS Project

Name: Harman Singh  
UID: 24BCF10046  
Section: 24BCF - 1(B)

## Description
This is a Database Management System (DBMS) project for managing student, teacher, and admin data. It includes user authentication, student mark management, and administrative controls.

## Features
- **Student Portal:** Login, view marks, logout
- **Teacher Portal:** Login, view assigned students, update marks for their subject
- **Admin Portal:** Login, add/delete students, update all marks, manage the system
- Secure authentication with JWT tokens
- MySQL database integration
- Responsive web interface

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcrypt for password hashing, Helmet for security headers

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### Steps
1. Clone the repository:
   ```
   git clone <repository-url>
   cd DBMS_Project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a MySQL database named `cuims_db`
   - Run the SQL scripts to create tables: `students`, `teachers`, `admins`
   - Update `.env` file with your database credentials:
     ```
     DB_PASSWORD=your_mysql_password
     JWT_SECRET=your_jwt_secret
     ```

4. Start the server:
   ```
   node server.js
   ```

5. Open your browser and go to `http://localhost:3000`

## Usage
- Access the main page at `http://localhost:3000`
- Use the respective login buttons for Student, Teacher, or Admin
- Follow the on-screen instructions for login and navigation

## API Endpoints
- `POST /student-login` - Student login
- `POST /teacher-login` - Teacher login
- `POST /admin-login` - Admin login
- `GET /teacher-students/:subject` - Get students for a subject (Teacher)
- `GET /admin/students` - Get all students (Admin)
- `POST /add-student` - Add a new student (Admin)
- `DELETE /delete-student/:id` - Delete a student (Admin)
- `POST /update-marks` - Update marks for a subject
- `POST /update-all-marks` - Update all marks for a student (Admin)

## Database Schema
- **students:** id, name, password (hashed), dbms, daa, html_css_js, Computer_Networking, Operating_System
- **teachers:** id, name, password (hashed), subject
- **admins:** id, name, password (hashed)

## Contributing
- Fork the repository
- Create a feature branch
- Commit your changes
- Push to the branch
- Create a Pull Request

## License
This project is for educational purposes.