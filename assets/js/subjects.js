const SUBJECTS = [
  { revision: "2021", code: "1001", name: "Communication Skills in English", department: "First Year / Common", semester: "Semester 1", type: "Theory" },
  { revision: "2021", code: "1002", name: "Mathematics I", department: "First Year / Common", semester: "Semester 1", type: "Theory" },
  { revision: "2021", code: "1003", name: "Applied Physics I", department: "First Year / Common", semester: "Semester 1", type: "Theory" },
  { revision: "2021", code: "1004", name: "Applied Chemistry", department: "First Year / Common", semester: "Semester 1", type: "Theory" },
  { revision: "2021", code: "1005", name: "Engineering Graphics", department: "First Year / Common", semester: "Semester 1", type: "Drawing" },
  { revision: "2021", code: "2001", name: "Environmental Science", department: "First Year / Common", semester: "Semester 2", type: "Theory" },
  { revision: "2021", code: "2002", name: "Mathematics II", department: "First Year / Common", semester: "Semester 2", type: "Theory" },
  { revision: "2021", code: "2003", name: "Applied Physics II", department: "First Year / Common", semester: "Semester 2", type: "Theory" },
  { revision: "2021", code: "2031", name: "Fundamentals of Electrical and Electronics Engineering", department: "Electrical and Electronics Engineering", semester: "Semester 2", type: "Theory" },
  { revision: "2021", code: "3031", name: "Analog and Digital Circuits", department: "Electrical and Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { revision: "2021", code: "3032", name: "DC Machines and Transformers", department: "Electrical and Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { revision: "2021", code: "4032", name: "Electrical Installation Design and Estimation", department: "Electrical and Electronics Engineering", semester: "Semester 4", type: "Theory" },
  { revision: "2021", code: "5032", name: "Electricity Generation, Transmission and Distribution", department: "Electrical and Electronics Engineering", semester: "Semester 5", type: "Theory" },
  { revision: "2021", code: "6038", name: "Industrial Automation Lab", department: "Electrical and Electronics Engineering", semester: "Semester 6", type: "Lab" },
  { revision: "2021", code: "2041", name: "Basic Electronics", department: "Electronics Engineering", semester: "Semester 2", type: "Theory" },
  { revision: "2021", code: "3042", name: "Principles of Electronic Communication", department: "Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { revision: "2021", code: "3044", name: "Digital Electronics", department: "Electronics Engineering", semester: "Semester 3", type: "Theory" },
  { revision: "2021", code: "4041", name: "Microcontroller and Applications", department: "Electronics Engineering", semester: "Semester 4", type: "Theory" },
  { revision: "2021", code: "5041", name: "Embedded Systems", department: "Electronics Engineering", semester: "Semester 5", type: "Theory" },
  { revision: "2021", code: "6048", name: "Computer Hardware and Data Communication Lab", department: "Electronics Engineering", semester: "Semester 6", type: "Lab" },
  { revision: "2015", code: "1001", name: "English and Communication Skills", department: "2015 First Year Materials", semester: "First Year", type: "Material" },
  { revision: "2015", code: "1002", name: "Mathematics", department: "2015 First Year Materials", semester: "First Year", type: "Material" },
  { revision: "2015", code: "1003", name: "Physics", department: "2015 First Year Materials", semester: "First Year", type: "Material" },
  { revision: "2015", code: "1004", name: "Chemistry", department: "2015 First Year Materials", semester: "First Year", type: "Material" },
  { revision: "2015", code: "1005", name: "Engineering Graphics", department: "2015 First Year Materials", semester: "First Year", type: "Material" },
  { revision: "2015", code: "3031", name: "Electrical and Electronics Materials", department: "2015 Department Materials", semester: "Department", type: "Material" },
  { revision: "2015", code: "3041", name: "Electronics Engineering Materials", department: "2015 Department Materials", semester: "Department", type: "Material" },
  { revision: "2015", code: "3001", name: "Workshop and Lab Materials", department: "2015 Study Materials", semester: "Common", type: "Material" }
];

const MATERIALS_2015 = {
  firstYear: [
    { label: "Text Books", url: "https://drive.google.com/folderview?id=1VEew2WIrFxMTDlnW0dBN4Xqgf1RbL-3K" },
    { label: "Basics", url: "https://drive.google.com/folderview?id=1Dr4oLoVyrYIIlMDkNdJ-UJwTTNL9c3_l" },
    { label: "Chemistry", url: "https://drive.google.com/folderview?id=1DQHjhtlOrATnUC4-JDC5Yhf-56tiW7aW" },
    { label: "Physics", url: "https://drive.google.com/folderview?id=1DR2FFJANWHFtDYQxo9hDhv8bZtNOTLY4" },
    { label: "Maths", url: "https://drive.google.com/folderview?id=1DVBNFb8aC5eQMXvY2XDOdNEt3h1cO2rB" },
    { label: "Engineering Graphics", url: "https://drive.google.com/folderview?id=1TXGnpAtXZ6q6d_mKiKUaECVPvYZVTlHA" },
    { label: "English", url: "https://drive.google.com/folderview?id=1Dp0etmpdHf3ZmiNXJII13I_o5RQvQWdH" }
  ],
  departments: [
    { label: "Computer Engineering", url: "https://drive.google.com/folderview?id=1y2R20N2GZsKnUEf5z0hHHyHHjrkCflRO" },
    { label: "Automobile Engineering", url: "https://drive.google.com/open?id=1xxhQxogYOZbK_P2N7Vq1fHpqNtT0Qlvt" },
    { label: "Electronics Engineering Short Notes", url: "https://polypmna.blogspot.com/p/covidotronicz.html?m=1" },
    { label: "Electrical, Electronics, Civil, Mechanical Materials", url: "https://polypmna.blogspot.com/p/and-struggle-semester.html" }
  ],
  studyMaterials: [
    { label: "Workshop Material", url: "https://drive.google.com/drive/u/0/mobile/folders/1-2gRIIqomlp6-OLYjTeJKaoVAZBzV8Lb" },
    { label: "Lab Manual CE / EE / EL / ME", url: "https://drive.google.com/folderview?id=18Jp0qjhH-Oe_vKrMCbkeMPcwjEWwSqYH" },
    { label: "Lab Manual Set 2", url: "https://polyndkm.blogspot.com/p/lab-manual.html?m=1" }
  ],
  questionPapers: [
    { label: "Question Paper Availability", url: "https://drive.google.com/file/d/1pgfggWTCouquaTPglpK4FfgLTC_9bdYq/view?usp=drivesdk" },
    { label: "Official REV2021 Model QP Reference", url: "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2021" }
  ]
};

const SITTTR_SYLLABUS_BASE = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=";
const SITTTR_MODEL_QP_BASE = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=";

function syllabusLink(subjectCode) {
  return SITTTR_SYLLABUS_BASE + encodeURIComponent(subjectCode);
}

function modelQuestionPaperLink(subjectCode) {
  return SITTTR_MODEL_QP_BASE + encodeURIComponent(subjectCode);
}

function lessonLink(subject) {
  const prefix = window.location.pathname.includes("/revision-2021/") ? "../" : "";
  return `${prefix}lessons.html?revision=${encodeURIComponent(subject.revision)}&subject=${encodeURIComponent(subject.code)}#lessons`;
}
