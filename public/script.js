document.addEventListener("DOMContentLoaded", () => {


// =========================
// HOME BUTTONS
// =========================
const studentBtn = document.getElementById("student"); 
const teacherBtn = document.getElementById("teacher");
const adminBtn = document.getElementById("admin");

if (studentBtn) studentBtn.onclick = () => window.location.href = "student-login.html";
if (teacherBtn) teacherBtn.onclick = () => window.location.href = "teacher-login.html";
if (adminBtn) adminBtn.onclick = () => window.location.href = "admin-login.html";


// =========================
// COMMON FUNCTION (SAFE FETCH)
// =========================
async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);

        if (res.status === 401 || res.status === 403) {
            logout();
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
        return null;
    }
}


// =========================
// STUDENT LOGIN
// =========================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
    loginBtn.onclick = async () => {
        const id = document.getElementById("studentId").value.trim();
        const password = document.getElementById("studentPassword").value.trim();

        if (!id || !password) {
            alert("Please fill all fields");
            return;
        }

        const loginData = await safeFetch("/student-login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ id, password })
        });

        if (!loginData) return;

        if (loginData.success) {
            localStorage.setItem("token", loginData.token);
            localStorage.setItem("studentData", JSON.stringify(loginData.student));
            window.location.href = "dashboard.html";
        } else {
            alert(loginData.message || "Invalid login");
        }
    };
}


// =========================
// STUDENT DASHBOARD
// =========================
const dashboardContent = document.getElementById("dashboardContent");

if (dashboardContent) {
    const student = JSON.parse(localStorage.getItem("studentData"));
    const token = localStorage.getItem("token");

    if (!student || !token) {
        logout();
        return;
    }

    let html = `<h2>Welcome ${student.name}</h2><br>`;

    for (let subject in student.marks) {
        html += `<p><strong>${subject}</strong>: ${student.marks[subject]}</p>`;
    }

    html += `<br><button onclick="logout()">Logout</button>`;
    dashboardContent.innerHTML = html;
}


// =========================
// TEACHER LOGIN
// =========================
const teacherLoginBtn = document.getElementById("teacherLoginBtn");

if (teacherLoginBtn) {
    teacherLoginBtn.onclick = async () => {
        const id = document.getElementById("teacherId").value.trim();
        const password = document.getElementById("teacherPassword").value.trim();

        if (!id || !password) {
            alert("Please fill all fields");
            return;
        }

        const teacherLoginData = await safeFetch("/teacher-login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ id, password })
        });

        if (!teacherLoginData) return;

        if (teacherLoginData.success) {
            localStorage.setItem("token", teacherLoginData.token);
            localStorage.setItem("teacherData", JSON.stringify(teacherLoginData.teacher));
            window.location.href = "teacher-dashboard.html";
        } else {
            alert(teacherLoginData.message || "Invalid login");
        }
    };
}


// =========================
// TEACHER DASHBOARD
// =========================
const studentsTable = document.getElementById("studentsTable");

if (studentsTable) {
    const teacher = JSON.parse(localStorage.getItem("teacherData"));
    const token = localStorage.getItem("token");

    if (!teacher || !token) {
        logout();
        return;
    }

    document.getElementById("teacherInfo").innerText =
        `${teacher.name} | Subject: ${teacher.subject}`;

    safeFetch(`/teacher-students/${teacher.subject}`, {
        headers: { Authorization: token }
    })
    .then(data => {
        if (!data) return;

        let html = `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Marks</th>
                    <th>Action</th>
                </tr>
        `;

        data.students.forEach(s => {
            html += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td><input type="number" min="0" max="100" id="m-${s.id}" value="${s.marks}"></td>
                    <td><button onclick="updateMarks('${s.id}', '${teacher.subject}')">Update</button></td>
                </tr>
            `;
        });

        html += `</table><br><button onclick="logout()">Logout</button>`;
        studentsTable.innerHTML = html;
    });
}


// =========================
// ADMIN LOGIN
// =========================
const adminLoginBtn = document.getElementById("adminLoginBtn");

if (adminLoginBtn) {
    adminLoginBtn.onclick = async () => {
        const id = document.getElementById("adminId").value.trim();
        const password = document.getElementById("adminPassword").value.trim();

        if (!id || !password) {
            alert("Please fill all fields");
            return;
        }

        const adminLoginData = await safeFetch("/admin-login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ id, password })
        });

        if (!adminLoginData) return;

        if (adminLoginData.success) {
            localStorage.setItem("token", adminLoginData.token);
            window.location.href = "admin-dashboard.html";
        } else {
            alert(adminLoginData.message || "Invalid admin login");
        }
    };
}


// =========================
// ADMIN DASHBOARD
// =========================
const adminPanel = document.getElementById("adminPanel");

if (adminPanel) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    loadStudents();
}


});

// =========================
// UPDATE MARKS (SAFE)
// =========================
async function updateMarks(studentId, subject) {
const token = localStorage.getItem("token");
let marks = document.getElementById(`m-${studentId}`).value;


if (marks < 0 || marks > 100) {
    alert("Marks must be between 0 and 100");
    return;
}

const updateData = await fetch("/update-marks", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": token
    },
    body: JSON.stringify({ studentId, subject, marks })
}).then(res => res.json()).catch(() => null);

if (!updateData) return;

if (updateData.success) {
    alert("✅ Updated successfully");
} else {
    alert("❌ " + (updateData.message || "Update failed"));
}

}

// =========================
// LOAD STUDENTS
// =========================
async function loadStudents() {
const token = localStorage.getItem("token");

const studentsData = await fetch("/admin/students", {
    headers: { Authorization: token }
}).then(res => res.json()).catch(() => null);

if (!studentsData) {
    document.getElementById("adminPanel").innerHTML = `<p>Unable to load admin dashboard. Please login again or refresh.</p>`;
    return;
}

let html = `
    <h2>Admin Dashboard</h2>

    <h3>Add Student</h3>
    <input id="newId" placeholder="ID">
    <input id="newName" placeholder="Name">
    <input id="newPassword" type="password" placeholder="Password">
    <button onclick="addStudent()">Add</button>

    <br><br>

    <table>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>DBMS</th>
            <th>DAA</th>
            <th>HTML</th>
            <th>CN</th>
            <th>OS</th>
            <th>Actions</th>
        </tr>
`;

studentsData.students.forEach(s => {
    html += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td><input id="dbms-${s.id}" value="${s.dbms}"></td>
            <td><input id="daa-${s.id}" value="${s.daa}"></td>
            <td><input id="html_css_js-${s.id}" value="${s.html_css_js}"></td>
            <td><input id="Computer_Networking-${s.id}" value="${s.Computer_Networking}"></td>
            <td><input id="Operating_System-${s.id}" value="${s.Operating_System}"></td>
            <td>
                <button onclick="updateAllMarks('${s.id}')">Update</button>
                <button onclick="deleteStudent('${s.id}')">Delete</button>
            </td>
        </tr>
    `;
});

html += `</table><br><button onclick="logout()">Logout</button>`;
document.getElementById("adminPanel").innerHTML = html;

}

// =========================
// ADD STUDENT (VALIDATED)
// =========================
async function addStudent() {
const token = localStorage.getItem("token");

const id = document.getElementById("newId").value.trim();
const name = document.getElementById("newName").value.trim();
const password = document.getElementById("newPassword").value.trim();

if (!id || !name || !password) {
    alert("All fields required");
    return;
}

const addData = await fetch("/add-student", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": token
    },
    body: JSON.stringify({ id, name, password })
}).then(res => res.json()).catch(() => null);

if (!addData) return;

if (addData.success) {
    alert("✅ Student added");
    loadStudents();
} else {
    alert("❌ " + (addData.message || "Failed"));
}


}

// =========================
// DELETE STUDENT
// =========================
async function deleteStudent(id) {
const token = localStorage.getItem("token");


if (!confirm("Are you sure?")) return;

await fetch(`/delete-student/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
});

alert("Student deleted");
loadStudents();


}

// =========================
// UPDATE ALL MARKS (ADMIN)
// =========================
async function updateAllMarks(studentId) {
const token = localStorage.getItem("token");

const marks = {
    dbms: document.getElementById(`dbms-${studentId}`).value,
    daa: document.getElementById(`daa-${studentId}`).value,
    html_css_js: document.getElementById(`html_css_js-${studentId}`).value,
    Computer_Networking: document.getElementById(`Computer_Networking-${studentId}`).value,
    Operating_System: document.getElementById(`Operating_System-${studentId}`).value
};

const updateAllData = await fetch("/update-all-marks", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": token
    },
    body: JSON.stringify({ studentId, marks })
}).then(res => res.json()).catch(() => null);

if (!updateAllData) return;

if (updateAllData.success) {
    alert("✅ Updated successfully");
} else {
    alert("❌ " + (updateAllData.message || "Update failed"));
}
}


function logout() {
localStorage.clear();
window.location.href = "index.html";
}
