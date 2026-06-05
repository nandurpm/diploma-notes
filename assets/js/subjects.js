const SUBJECTS = [
  { code: "1001", name: "Communication Skills in English", department: "First Year", semester: "Semester 1", type: "Theory" },
  { code: "1002", name: "Mathematics I", department: "First Year", semester: "Semester 1", type: "Theory" },
  { code: "1003", name: "Applied Physics I", department: "First Year", semester: "Semester 1", type: "Theory" },
  { code: "1004", name: "Applied Chemistry", department: "First Year", semester: "Semester 1", type: "Theory" },
  { code: "1005", name: "Engineering Graphics", department: "First Year", semester: "Semester 1", type: "Drawing" },
  { code: "2002", name: "Mathematics II", department: "First Year", semester: "Semester 2", type: "Theory" },
  { code: "2003", name: "Applied Physics II", department: "First Year", semester: "Semester 2", type: "Theory" },
  { code: "2031", name: "Fundamentals of Electrical and Electronics Engineering", department: "Electrical and Electronics Engineering", semester: "Semester 2", type: "Theory" },
  { code: "3031", name: "Analog and Digital Circuits", department: "Electrical and Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { code: "3032", name: "DC Machines and Transformers", department: "Electrical and Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { code: "4032", name: "Electrical Installation Design and Estimation", department: "Electrical and Electronics Engineering", semester: "Semester 4", type: "Theory" },
  { code: "5032", name: "Electricity Generation, Transmission and Distribution", department: "Electrical and Electronics Engineering", semester: "Semester 5", type: "Theory" },
  { code: "6038", name: "Industrial Automation Lab", department: "Electrical and Electronics Engineering", semester: "Semester 6", type: "Lab" },
  { code: "2041", name: "Basic Electronics", department: "Electronics Engineering", semester: "Semester 2", type: "Theory" },
  { code: "3042", name: "Principles of Electronic Communication", department: "Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { code: "3044", name: "Digital Electronics", department: "Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { code: "4041", name: "Microcontroller and Applications", department: "Electronics Engineering", semester: "Semester 4", type: "Theory" },
  { code: "5041", name: "Embedded Systems", department: "Electronics Engineering", semester: "Semester 5", type: "Theory" },
  { code: "6048", name: "Computer Hardware and Data Communication Lab", department: "Electronics Engineering", semester: "Semester 6", type: "Lab" },
  { code: "5001", name: "Industrial Management and Safety", department: "Common", semester: "Semester 5", type: "Theory" },
  { code: "6001", name: "Entrepreneurship and Startup", department: "Common", semester: "Semester 6", type: "Theory" },
  { code: "6009", name: "Major Project", department: "Common", semester: "Semester 5 / 6", type: "Project" }
];

const SITTTR_SYLLABUS_BASE = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=";
const SITTTR_MODEL_QP_BASE = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=";

function syllabusLink(subjectCode) {
  return SITTTR_SYLLABUS_BASE + encodeURIComponent(subjectCode);
}

function modelQuestionPaperLink(subjectCode) {
  return SITTTR_MODEL_QP_BASE + encodeURIComponent(subjectCode);
}
