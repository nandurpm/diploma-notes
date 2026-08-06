import os
import re

TEMPLATE_PATH = "/home/ubuntu/diploma-notes/revision-2026/architecture.html"
OUTPUT_DIR = "/home/ubuntu/diploma-notes/revision-2026"

DEPARTMENTS = [
    {
        "code": "CO",
        "name": "Civil Engineering (Construction Technology)",
        "slug": "civil-engineering-construction-technology",
        "semesters": {
            "Semester 1": [
                ("1001", "English for Technical Communication"),
                ("1002", "Fundamentals of Engineering Mathematics"),
                ("1003", "Engineering Graphics"),
                ("1011", "Fundamentals of Civil Engineering"),
                ("1008", "Foundational IT Skills"),
                ("1009", "Health and Physical Education")
            ],
            "Semester 2": [
                ("2011", "Building Materials & Construction Techniques"),
                ("2012", "Basic Surveying"),
                ("2005", "Environmental Sustainability and Ethics"),
                ("2018", "Construction Materials Lab"),
                ("2019", "Basic Surveying Lab"),
                ("3009", "Digital 101")
            ],
            "Semester 3": [
                ("3011", "Engineering Mechanics"),
                ("3012", "Advanced Surveying"),
                ("3013", "Estimation & Costing"),
                ("3014", "Concrete Technology"),
                ("3001", "Essence of Indian Constitution"),
                ("3017", "CAD Lab"),
                ("3018", "Concrete Technology Lab"),
                ("3019", "Building Planning and Drawing")
            ],
            "Semester 4": [
                ("4011", "Design of Steel Structures"),
                ("4012", "Theory of Structures"),
                ("4511", "Advanced Construction Technology"),
                ("4001", "Entrepreneurship and Startup"),
                ("4002", "Career Readiness and Communication"),
                ("4017", "Advanced Surveying Lab"),
                ("4018", "Material Testing Lab"),
                ("4019", "Advanced CAD Lab"),
                ("5007", "Summer Internship")
            ],
            "Semester 5": [
                ("5011", "Construction Management and Safety Engineering"),
                ("5012", "Design of RCC Structures"),
                ("5013", "Hydraulics & Irrigation Engineering"),
                ("5017", "Structural Drawing with CAD"),
                ("5018", "Hydraulics & Irrigation Engineering Lab"),
                ("5008", "Seminar"),
                ("5009", "Major Project – Phase I")
            ],
            "Semester 6": [
                ("6012", "Environmental Engineering"),
                ("6018", "Environmental Engineering Lab"),
                ("6009", "Major Project – Phase II"),
                ("6007", "Internship")
            ]
        }
    },
    {
        "code": "CZ",
        "name": "Computer Science & Engineering (Artificial Intelligence & Machine Learning)",
        "slug": "computer-science-and-engineering-artificial-intelligence-and-machine-learning",
        "semesters": {
            "Semester 1": [
                ("1001", "English for Technical Communication"),
                ("1002", "Fundamentals of Engineering Mathematics"),
                ("1004", "Engineering Drawing with CAD"),
                ("1131", "Problem Solving and Python Programming"),
                ("1008", "Foundational IT Skills"),
                ("1009", "Health and Physical Education")
            ],
            "Semester 2": [
                ("2131", "Fundamentals of Electrical and Electronics Engineering"),
                ("2132", "Programming in C"),
                ("2005", "Environmental Sustainability and Ethics"),
                ("2138", "Fundamentals of Electrical and Electronics Engineering Lab"),
                ("2139", "Programming in C Lab"),
                ("3009", "Digital 101")
            ],
            "Semester 3": [
                ("3131", "Database Management Systems"),
                ("3381", "Fundamentals of Artificial Intelligence"),
                ("3571", "Object Oriented Programming Concepts"),
                ("3572", "Logic Design and Computer Organization"),
                ("3001", "Essence of Indian Constitution"),
                ("3137", "Database Management Systems Lab"),
                ("3579", "Web Design and Development Lab"),
                ("3139", "Computer Hardware and System Administration Lab")
            ],
            "Semester 4": [
                ("4571", "Data Communication and Networking"),
                ("4132", "Operating System Design"),
                ("4382", "Fundamentals of Data Mining and Machine Learning"),
                ("4001", "Entrepreneurship and Startup"),
                ("4002", "Career Readiness and Communication"),
                ("4578", "Data Analytics and Visualization Lab"),
                ("4139", "UI/UX Design Lab"),
                ("4579", "Computer Networks Engineering Lab"),
                ("5007", "Summer Internship")
            ],
            "Semester 5": [
                ("5131", "Project Management and Software Engineering"),
                ("5571", "Data Structures and Algorithms"),
                ("5382", "Deep Learning"),
                ("5579", "Data Structures and Algorithms Lab"),
                ("5388", "Deep Learning Lab"),
                ("5008", "Seminar"),
                ("5009", "Major Project – Phase I")
            ],
            "Semester 6": [
                ("6262", "Cyber Security Systems"),
                ("6268", "Cyber Security Systems Lab"),
                ("6009", "Major Project – Phase II"),
                ("6007", "Internship")
            ]
        }
    },
    {
        "code": "ES",
        "name": "Electronics Engineering (Embedded Systems)",
        "slug": "electronics-engineering-embedded-systems",
        "semesters": {
            "Semester 1": [
                ("1001", "English for Technical Communication"),
                ("1002", "Fundamentals of Engineering Mathematics"),
                ("1004", "Engineering Drawing with CAD"),
                ("1041", "Elementary Concepts of Electronics"),
                ("1008", "Foundational IT Skills"),
                ("1009", "Health and Physical Education")
            ],
            "Semester 2": [
                ("2041", "Elements of Electrical & Electronics Engineering"),
                ("2042", "Electronic Devices and Applications"),
                ("2005", "Environmental Sustainability and Ethics"),
                ("2048", "Elements of Electrical & Electronics Engineering Lab"),
                ("2049", "Electronic Devices and Applications Lab"),
                ("3009", "Digital 101")
            ],
            "Semester 3": [
                ("3041", "Electrical Technology and Instrumentation"),
                ("3042", "Digital Circuits and Systems"),
                ("3043", "Programming in C"),
                ("3044", "Analog Circuits"),
                ("3001", "Essence of Indian Constitution"),
                ("3047", "Digital Circuits and Systems Lab"),
                ("3048", "Analog Circuits Lab"),
                ("3049", "PCB & Circuit Simulation Lab")
            ],
            "Semester 4": [
                ("4521", "Embedded Systems and Programming"),
                ("4042", "Linear Integrated Circuits"),
                ("4043", "Microcontroller Programming and Applications"),
                ("4001", "Entrepreneurship and Startup"),
                ("4002", "Career Readiness and Communication"),
                ("4529", "Embedded Systems and Programming Lab"),
                ("4048", "Linear Integrated Circuits Lab"),
                ("4049", "Python Programming Lab"),
                ("5007", "Summer Internship")
            ],
            "Semester 5": [
                ("5021", "Industrial Management and Safety"),
                ("5521", "IoT and Real-Time Embedded Systems"),
                ("5522", "Fundamentals of Robotics and AI"),
                ("5528", "IoT and Real-Time Embedded Systems Lab"),
                ("5048", "Computer Hardware & Networking Lab"),
                ("5008", "Seminar"),
                ("5009", "Major Project – Phase I")
            ],
            "Semester 6": [
                ("6521", "ARM Microcontroller and Applications"),
                ("6528", "ARM Microcontroller and Applications Lab"),
                ("6009", "Major Project – Phase II"),
                ("6007", "Internship")
            ]
        }
    },
    {
        "code": "MA",
        "name": "Mechanical Engineering (Automobile Engineering)",
        "slug": "mechanical-engineering-automobile-engineering",
        "semesters": {
            "Semester 1": [
                ("1001", "English for Technical Communication"),
                ("1002", "Fundamentals of Engineering Mathematics"),
                ("1003", "Engineering Graphics"),
                ("1021", "Basic Mechanical Engineering"),
                ("1008", "Foundational IT Skills"),
                ("1009", "Health and Physical Education")
            ],
            "Semester 2": [
                ("2131", "Fundamentals of Electrical and Electronics Engineering"),
                ("2561", "Basics of Automobile Engineering"),
                ("2005", "Environmental Sustainability and Ethics"),
                ("2138", "Fundamentals of Electrical and Electronics Engineering Lab"),
                ("2569", "Basics of Automobile Engineering Lab"),
                ("3009", "Digital 101")
            ],
            "Semester 3": [
                ("3021", "Thermal Engineering"),
                ("3022", "Fluid Mechanics and Hydraulic Machines"),
                ("3561", "Automobile Electrical Systems (Lab Based Theory)"),
                ("3024", "Material Science and Manufacturing Technology"),
                ("3001", "Essence of Indian Constitution"),
                ("3028", "CADD Lab"),
                ("4027", "Mechanical Workshop"),
                ("3029", "Fluid Mechanics and Hydraulic Machines Lab")
            ],
            "Semester 4": [
                ("4021", "Strength of Materials"),
                ("4022", "Machine Tools"),
                ("4023", "Industrial Engineering"),
                ("4001", "Entrepreneurship and Startup"),
                ("4002", "Career Readiness and Communication"),
                ("4026", "Material Testing and Metallography Lab"),
                ("4027", "Mechanical Workshop"),
                ("4028", "Thermal Engineering Lab"),
                ("4029", "Computer Aided Machine Drawing"),
                ("5007", "Summer Internship")
            ],
            "Semester 5": [
                ("5021", "Industrial Management and Safety"),
                ("5022", "Design of Machine Elements"),
                ("5561", "Automobile Chassis and Transmission Systems"),
                ("5028", "Machine Shop Practice"),
                ("5008", "Seminar"),
                ("5009", "Major Project – Phase I")
            ],
            "Semester 6": [
                ("6561", "Refrigeration and HVAC"),
                ("6569", "Refrigeration and HVAC Lab"),
                ("6009", "Major Project – Phase II"),
                ("6007", "Internship")
            ]
        }
    }
]

def generate_subject_card(code, name, dept_name):
    return f'''<article class="subject-card" data-subject-code="{code}" data-revision="2026" data-semester="" data-search-text="{code} {name.lower()} {dept_name.lower()}" data-notes-href="/revision-2026-content/notes/downloadable-notes-{code}.pdf" data-lesson-href="/revision-2026-content/lessons/lessons-{code}.html" data-lesson-available="false" data-notes-available="false"><div class="subject-top"><span>2026</span><strong>{code}</strong></div><h3>{name}</h3><p>{dept_name} / Semester / Course</p><div class="action-row"><a class="action syllabus" href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&amp;course={code}" target="_blank" rel="noopener noreferrer" data-syllabus-course="{code}">Open Syllabus</a><span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span><a class="action qp" href="https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&amp;course={code}" target="_blank" rel="noopener noreferrer external" data-model-paper-course="{code}" data-scheme="REV2026">Open Model Question Paper</a></div></article>'''

def generate_semester_section(sem_name, subjects, dept_name):
    cards = "".join([generate_subject_card(code, name, dept_name) for code, name in subjects])
    return f'''<section class="semester-subject-section" data-semester-section="{sem_name}" style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>{sem_name}</h3><span data-semester-count>{len(subjects)} subjects</span></div><div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">{cards}</div></section>'''

def main():
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()

    for dept in DEPARTMENTS:
        content = template
        content = content.replace('data-programme-slug="architecture"', f'data-programme-slug="{dept["slug"]}"')
        content = content.replace('data-programme-name="Architecture"', f'data-programme-name="{dept["name"]}"')
        content = content.replace('<title>Architecture Revision 2026 Subjects | POLY PMNA</title>', f'<title>{dept["name"]} Revision 2026 Subjects | POLY PMNA</title>')
        content = content.replace('Architecture Revision 2026 Subjects', f'{dept["name"]} Revision 2026 Subjects')
        content = content.replace('Architecture semester subjects', f'{dept["name"]} semester subjects')
        content = content.replace('href="https://polypmna.dpdns.org/revision-2026/architecture.html"', f'href="https://polypmna.dpdns.org/revision-2026/{dept["slug"]}.html"')
        content = content.replace('<li><span aria-current="page">Architecture</span></li>', f'<li><span aria-current="page">{dept["name"]}</span></li>')
        content = content.replace('<h1>Architecture</h1>', f'<h1>{dept["name"]}</h1>')
        
        # Replace the subject grid content
        grid_start_marker = '<div class="subject-grid" id="subjectGrid" data-mode="department" data-revision="2026" data-static-rev2026="true">'
        grid_end_marker = '</div></section><section class="section compact" id="related-resources">'
        
        sections_html = "".join([generate_semester_section(sem, subs, dept["name"]) for sem, subs in dept["semesters"].items()])
        
        # Using regex for safer replacement
        pattern = re.escape(grid_start_marker) + r".*?" + re.escape(grid_end_marker)
        content = re.sub(pattern, grid_start_marker + sections_html + grid_end_marker, content, flags=re.DOTALL)
        
        output_path = os.path.join(OUTPUT_DIR, f"{dept['slug']}.html")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated: {output_path}")

if __name__ == "__main__":
    main()
