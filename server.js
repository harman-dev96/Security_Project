require("dotenv").config();

const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = 3000;

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());

const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100
});
app.use(limiter);

// =========================
// DATABASE
// =========================
const db = mysql.createConnection({
host: "localhost",
user: "root",
password: process.env.DB_PASSWORD,
database: "cuims_db"
});

db.connect((err) => {
if (err) {
console.error(err);
process.exit(1);
}
console.log("DB Connected");
});

// =========================
// HELPERS
// =========================
const allowedSubjects = [
"dbms",
"daa",
"html_css_js",
"Computer_Networking",
"Operating_System"
];

// =========================
// AUTH MIDDLEWARE
// =========================
function authenticate(req, res, next) {
const token = req.headers.authorization;


if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
} catch {
    return res.status(403).json({ success: false, message: "Invalid token" });
}


}

// ROLE CHECK
function authorize(role) {
return (req, res, next) => {
if (req.user.role !== role) {
return res.status(403).json({ success: false, message: "Access denied" });
}
next();
};
}

// =========================
// VALIDATION HELPERS
// =========================
function isValidInput(...fields) {
return fields.every(f => f && f.toString().trim() !== "");
}

// =========================
// STUDENT LOGIN
// =========================
app.post("/student-login", (req, res) => {
const { id, password } = req.body;


if (!isValidInput(id, password)) {
    return res.status(400).json({ success: false, message: "All fields required" });
}

db.query("SELECT * FROM students WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const student = results[0];
    const match = await bcrypt.compare(password, student.password);

    if (!match) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: student.id, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({
        success: true,
        token,
        student: {
            name: student.name,
            marks: {
                DBMS: student.dbms,
                DAA: student.daa,
                HTML: student.html_css_js,
                CN: student.Computer_Networking,
                OS: student.Operating_System
            }
        }
    });
});


});

// =========================
// TEACHER LOGIN
// =========================
app.post("/teacher-login", (req, res) => {
const { id, password } = req.body;


if (!isValidInput(id, password)) {
    return res.status(400).json({ success: false });
}

db.query("SELECT * FROM teachers WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
        return res.status(401).json({ success: false });
    }

    const teacher = results[0];
    const match = await bcrypt.compare(password, teacher.password);

    if (!match) {
        return res.status(401).json({ success: false });
    }

    const token = jwt.sign(
        { id: teacher.id, role: "teacher" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ success: true, token, teacher });
});


});

// =========================
// ADMIN LOGIN
// =========================
app.post("/admin-login", (req, res) => {
const { id, password } = req.body;


if (!isValidInput(id, password)) {
    return res.status(400).json({ success: false });
}

db.query("SELECT * FROM admins WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
        return res.status(401).json({ success: false });
    }

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
        return res.status(401).json({ success: false });
    }

    const token = jwt.sign(
        { id: admin.id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ success: true, token, admin });
});


});

// =========================
// TEACHER / ADMIN: GET STUDENTS
// =========================
app.get("/teacher-students/:subject", authenticate, (req, res) => {


if (!["teacher", "admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false });
}

const subject = req.params.subject;

if (!allowedSubjects.includes(subject)) {
    return res.status(400).json({ success: false, message: "Invalid subject" });
}

const sql = `SELECT id, name, ${subject} AS marks FROM students`;

db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false });

    res.json({ success: true, students: results });
});


});

// =========================
// ADMIN: GET ALL STUDENTS
// =========================
app.get("/admin/students", authenticate, authorize("admin"), (req, res) => {


db.query("SELECT * FROM students", (err, results) => {
    if (err) return res.status(500).json({ success: false });

    res.json({ success: true, students: results });
});


});

// =========================
// ADD STUDENT
// =========================
app.post("/add-student", authenticate, authorize("admin"), async (req, res) => {

const { id, name, password } = req.body;

if (!isValidInput(id, name, password)) {
    return res.status(400).json({ success: false, message: "All fields required" });
}

try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
        `INSERT INTO students (id, name, password, dbms, daa, html_css_js, Computer_Networking, Operating_System)
         VALUES (?, ?, ?, 0,0,0,0,0)`,
        [id, name, hash],
        (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Insert failed" });
            }

            res.json({ success: true, message: "Student added" });
        }
    );
} catch {
    res.status(500).json({ success: false });
}


});

// =========================
// DELETE STUDENT
// =========================
app.delete("/delete-student/:id", authenticate, authorize("admin"), (req, res) => {


db.query("DELETE FROM students WHERE id=?", [req.params.id], (err) => {
    if (err) {
        return res.status(500).json({ success: false });
    }

    res.json({ success: true, message: "Deleted" });
});


});

// =========================
// UPDATE MARKS (SECURE)
// =========================
app.post("/update-marks", authenticate, (req, res) => {


if (!["teacher", "admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false });
}

const { studentId, subject, marks } = req.body;

if (!allowedSubjects.includes(subject)) {
    return res.status(400).json({ success: false, message: "Invalid subject" });
}

if (marks < 0 || marks > 100) {
    return res.status(400).json({ success: false, message: "Invalid marks" });
}

const sql = `UPDATE students SET ${subject}=? WHERE id=?`;

db.query(sql, [marks, studentId], (err) => {
    if (err) {
        return res.status(500).json({ success: false });
    }

    res.json({ success: true, message: "Updated" });
});


});

// =========================
// UPDATE ALL MARKS (ADMIN)
// =========================
app.post("/update-all-marks", authenticate, authorize("admin"), (req, res) => {

const { studentId, marks } = req.body;

if (!marks || typeof marks !== 'object') {
    return res.status(400).json({ success: false, message: "Invalid marks" });
}

const updates = [];
const values = [];

for (const subject of allowedSubjects) {
    if (marks[subject] !== undefined) {
        const m = parseInt(marks[subject]);
        if (m < 0 || m > 100) {
            return res.status(400).json({ success: false, message: "Invalid marks" });
        }
        updates.push(`${subject}=?`);
        values.push(m);
    }
}

if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No marks to update" });
}

values.push(studentId);

const sql = `UPDATE students SET ${updates.join(', ')} WHERE id=?`;

db.query(sql, values, (err) => {
    if (err) {
        return res.status(500).json({ success: false });
    }

    res.json({ success: true, message: "Updated" });
});


});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ success: false, message: "Server error" });
});


app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});
