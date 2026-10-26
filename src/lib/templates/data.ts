export type SectionId = "summary" | "skills" | "experience" | "projects" | "education";
export type Role = { title: string; org: string; dates: string; bullets: string[] };
export type Project = { name: string; dates: string; bullets: string[] };
export type Edu = { degree: string; school: string; dates: string; detail?: string };

export type Template = {
  id: string;
  name: string;
  level: string;
  tagline: string;
  educationFirst?: boolean;
  resume: {
    summary: string;
    skills: { label: string; items: string }[];
    experience: Role[];
    projects: Project[];
    education: Edu[];
  };
  jd: { title: string; text: string; keySkills: string[] };
};

export const NAME = "Your Name";
export const CONTACT = "you@email.com | +91 98765 43210 | linkedin.com/in/yourname | City, Country";

export const HEADINGS: Record<SectionId, string> = {
  summary: "Summary", skills: "Skills", experience: "Experience", projects: "Projects", education: "Education",
};

export function sectionOrder(t: Template): SectionId[] {
  const body: SectionId[] = [];
  if (t.resume.experience.length) body.push("experience");
  if (t.resume.projects.length) body.push("projects");
  const head: SectionId[] = ["summary", "skills"];
  return t.educationFirst ? [...head, "education", ...body] : [...head, ...body, "education"];
}

export const TEMPLATES: Template[] = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    level: "2–5 years",
    tagline: "Web and backend roles. Shows shipped features, performance and testing.",
    resume: {
      summary:
        "Software engineer with 3+ years of experience building and scaling web applications in React, Node.js and PostgreSQL. Focused on reliable APIs, clean code and measurable performance gains.",
      skills: [
        { label: "Languages", items: "JavaScript, TypeScript, Python, SQL" },
        { label: "Frameworks", items: "React, Next.js, Node.js, Express" },
        { label: "Tools", items: "Git, Docker, AWS, PostgreSQL, Jest, GitHub Actions" },
      ],
      experience: [
        {
          title: "Software Engineer", org: "Company Name, City", dates: "Jun 2022 – Present",
          bullets: [
            "Built REST APIs in Node.js and PostgreSQL serving 120,000 daily requests with 99.9% uptime.",
            "Reduced average page load time by 38% by adding code splitting and caching in React and Next.js.",
            "Automated build and deploy pipelines with GitHub Actions and Docker, cutting release time from 2 hours to 15 minutes.",
            "Mentored 3 junior developers through code reviews, raising Jest test coverage from 55% to 82%.",
          ],
        },
        {
          title: "Junior Developer", org: "Company Name, City", dates: "Jul 2021 – May 2022",
          bullets: [
            "Developed 12 customer-facing features in React and TypeScript that lifted trial-to-paid conversion by 9%.",
            "Resolved 80+ production bugs and added unit tests that lowered recurring incidents by 30%.",
            "Migrated 4 legacy services from JavaScript to TypeScript, reducing user-reported errors by 25%.",
          ],
        },
      ],
      projects: [],
      education: [{ degree: "B.Tech in Computer Science", school: "University Name", dates: "2017 – 2021" }],
    },
    jd: {
      title: "Software Engineer",
      keySkills: ["JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "PostgreSQL", "Git", "Docker", "CI/CD", "Jest", "AWS", "Next.js"],
      text: `Software Engineer

We are hiring a Software Engineer to build and maintain customer-facing web applications and the APIs behind them. You will work with product and design to ship reliable features, review code and improve performance.

Requirements
- 2+ years of professional software development experience
- Strong skills in JavaScript or TypeScript, React and Node.js
- Experience designing REST APIs and working with PostgreSQL or similar databases
- Familiarity with Git, Docker and CI/CD pipelines
- Unit testing with Jest or similar tools

Nice to have
- Experience with AWS
- Next.js
- Mentoring junior developers`,
    },
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    level: "1–4 years",
    tagline: "Analytics and BI roles. Shows SQL depth, dashboards and business impact.",
    resume: {
      summary:
        "Data analyst with 2+ years of experience turning large datasets into decisions using SQL, Python and Tableau. Skilled at experiment design and explaining findings to non-technical teams.",
      skills: [
        { label: "Analysis", items: "SQL, Python, Pandas, Excel, Statistics" },
        { label: "BI tools", items: "Tableau, Power BI, Google Analytics" },
        { label: "Methods", items: "A/B testing, ETL, Data cleaning, Git" },
      ],
      experience: [
        {
          title: "Data Analyst", org: "Company Name, City", dates: "Feb 2023 – Present",
          bullets: [
            "Built 15 Tableau dashboards used by 6 business teams, replacing 20 hours of weekly manual reporting.",
            "Wrote SQL queries over 40 million rows to find churn drivers, helping retention improve by 11% in two quarters.",
            "Designed A/B tests for checkout changes using Python and statistics, lifting conversion by 6.5%.",
            "Automated monthly reporting with Python and Pandas, cutting turnaround from 3 days to 4 hours.",
          ],
        },
        {
          title: "Junior Analyst", org: "Company Name, City", dates: "Jul 2021 – Jan 2023",
          bullets: [
            "Cleaned and merged 8 data sources in Excel and SQL, raising report accuracy to 98%.",
            "Presented weekly insights to 5 stakeholders, leading to 3 pricing changes that added 4% revenue.",
            "Tracked 25 KPIs in Power BI and flagged anomalies that stopped an estimated 2% revenue leakage.",
          ],
        },
      ],
      projects: [],
      education: [{ degree: "B.Sc. in Statistics", school: "University Name", dates: "2018 – 2021" }],
    },
    jd: {
      title: "Data Analyst",
      keySkills: ["SQL", "Python", "Excel", "Tableau", "Power BI", "A/B testing", "statistics", "dashboards", "stakeholders"],
      text: `Data Analyst

Join our analytics team to turn product and customer data into clear recommendations. You will build dashboards, run experiments and present findings to business stakeholders.

Requirements
- 1+ years of experience in a data analysis role
- Strong SQL skills, including joins and window functions over large tables
- Proficiency in Python or R and Excel
- Experience building dashboards in Tableau or Power BI
- Solid understanding of statistics and A/B testing
- Clear communication with non-technical stakeholders

Nice to have
- Google Analytics
- ETL experience`,
    },
  },
  {
    id: "product-manager",
    name: "Product Manager",
    level: "3–6 years",
    tagline: "Shows ownership, prioritization and outcomes, not just features shipped.",
    resume: {
      summary:
        "Product manager with 4+ years of experience owning roadmaps for consumer fintech products. Combines user research, data and clear prioritization to ship features that move retention and revenue.",
      skills: [
        { label: "Product", items: "Roadmapping, PRDs, Prioritization (RICE), User research" },
        { label: "Analytics", items: "SQL, Mixpanel, A/B testing, Funnel analysis" },
        { label: "Tools", items: "Jira, Figma, Confluence, Agile and Scrum" },
      ],
      experience: [
        {
          title: "Product Manager", org: "Company Name, City", dates: "Mar 2022 – Present",
          bullets: [
            "Owned the roadmap for a payments product used by 250,000 customers, growing monthly active users by 22%.",
            "Prioritized 40 backlog items with RICE scoring, aligning engineering, design and sales on 3 quarterly goals.",
            "Ran 12 user interviews and 6 A/B tests, raising onboarding completion from 54% to 71%.",
            "Wrote PRDs and managed Jira sprints for a team of 9 engineers, shipping 14 releases on schedule.",
          ],
        },
        {
          title: "Associate Product Manager", org: "Company Name, City", dates: "Jun 2020 – Feb 2022",
          bullets: [
            "Analyzed funnel data with SQL and Mixpanel to find a checkout drop-off, then fixed it to add 8% more completed orders.",
            "Partnered with design in Figma to launch a redesigned settings page, cutting support tickets by 18%.",
            "Coordinated launches with marketing and support across 3 regions, reaching 30,000 users in the first month.",
          ],
        },
      ],
      projects: [],
      education: [
        { degree: "MBA", school: "University Name", dates: "2018 – 2020" },
        { degree: "B.Tech in Electronics", school: "University Name", dates: "2014 – 2018" },
      ],
    },
    jd: {
      title: "Product Manager",
      keySkills: ["roadmap", "prioritization", "user research", "SQL", "A/B testing", "PRDs", "Jira", "Agile", "stakeholders", "metrics"],
      text: `Product Manager

We are looking for a Product Manager to own the roadmap for our payments product. You will work with engineering and design to define, ship and measure features that improve retention and revenue.

Requirements
- 3+ years of product management experience
- Track record of owning a roadmap and shipping features end to end
- Strong prioritization and stakeholder management skills
- Comfortable with SQL and product analytics, and running A/B tests
- Experience writing PRDs and working in Agile teams with Jira

Nice to have
- User research experience
- Fintech background`,
    },
  },
  {
    id: "marketing",
    name: "Marketing",
    level: "2–5 years",
    tagline: "Digital marketing roles. Leads with channels, budgets and conversion results.",
    resume: {
      summary:
        "Digital marketer with 3+ years of experience growing traffic and leads through SEO, paid search and email. Data-driven, comfortable owning budgets and reporting campaign ROI.",
      skills: [
        { label: "Channels", items: "SEO, Google Ads, Email marketing, Social media, Content strategy" },
        { label: "Tools", items: "Google Analytics, HubSpot, SEMrush, Meta Ads Manager, Canva" },
        { label: "Methods", items: "A/B testing, Campaign reporting, Audience segmentation" },
      ],
      experience: [
        {
          title: "Digital Marketing Specialist", org: "Company Name, City", dates: "Apr 2022 – Present",
          bullets: [
            "Grew organic traffic by 85% in 12 months through SEO audits and a content plan of 60 articles.",
            "Managed a Google Ads budget of $15,000 per month, lowering cost per lead by 27%.",
            "Built HubSpot email workflows for 40,000 contacts, lifting open rates from 18% to 31%.",
            "Reported campaign ROI in Google Analytics each week, helping leadership shift 20% of budget to top channels.",
          ],
        },
        {
          title: "Marketing Executive", org: "Company Name, City", dates: "Jun 2020 – Mar 2022",
          bullets: [
            "Launched 5 social media campaigns that added 18,000 followers and 1,200 qualified leads.",
            "Ran A/B tests on 30 landing page variants, improving conversion rate by 14%.",
            "Organized 8 webinars with 2,500 total registrants, generating 150 sales opportunities.",
          ],
        },
      ],
      projects: [],
      education: [{ degree: "B.B.A. in Marketing", school: "University Name", dates: "2017 – 2020" }],
    },
    jd: {
      title: "Digital Marketing Specialist",
      keySkills: ["SEO", "Google Ads", "email marketing", "Google Analytics", "HubSpot", "content strategy", "A/B testing", "ROI"],
      text: `Digital Marketing Specialist

Our growth team is hiring a Digital Marketing Specialist to plan and run campaigns across search, email and social. You will own a monthly budget and report results to leadership.

Requirements
- 2+ years of digital marketing experience
- Hands-on SEO and Google Ads experience
- Email marketing and automation, ideally in HubSpot
- Strong Google Analytics and reporting skills
- Content strategy and A/B testing experience
- Ability to measure and explain campaign ROI

Nice to have
- SEMrush
- Meta Ads Manager`,
    },
  },
  {
    id: "fresher",
    name: "Fresher / Entry-level",
    level: "0–1 years",
    tagline: "Any field. Leads with education, projects and internships instead of job history.",
    educationFirst: true,
    resume: {
      summary:
        "Recent graduate with hands-on project and internship experience, strong analytical skills and a record of delivering work on time in team settings. Seeking an entry-level role to apply and grow these skills.",
      skills: [
        { label: "Technical", items: "Excel, Python, SQL, PowerPoint, Data analysis" },
        { label: "Professional", items: "Communication, Teamwork, Time management, Problem solving" },
      ],
      experience: [
        {
          title: "Intern", org: "Company Name, City", dates: "Jun 2024 – Aug 2024",
          bullets: [
            "Analyzed 2,000 customer survey responses in Excel and presented 5 findings that shaped a new service checklist.",
            "Prepared weekly reports for a team of 8, reducing preparation time by 3 hours each week.",
            "Coordinated with 4 departments to collect data and finished the project 1 week ahead of schedule.",
          ],
        },
      ],
      projects: [
        {
          name: "Campus Sales Dashboard", dates: "Jan 2024 – Apr 2024",
          bullets: [
            "Built an Excel and Python dashboard tracking 500 monthly sales records, helping a student club find its 3 best-selling products.",
            "Presented results to 40 members, leading to a 15% increase in event ticket sales.",
          ],
        },
        {
          name: "Library Database Capstone", dates: "Aug 2023 – Dec 2023",
          bullets: [
            "Developed a SQL database for 300 library records and wrote 20 queries that automated overdue book reports.",
            "Led a team of 4 students through 6 weekly sprints and delivered the project 2 days early.",
          ],
        },
      ],
      education: [
        {
          degree: "B.Sc. in Your Major", school: "University Name", dates: "2020 – 2024",
          detail: "GPA 8.4/10. Relevant coursework: Data Structures, Statistics, Database Systems.",
        },
      ],
    },
    jd: {
      title: "Graduate Trainee - Business Analyst",
      keySkills: ["Excel", "SQL", "communication", "teamwork", "data analysis", "Python", "presentation"],
      text: `Graduate Trainee - Business Analyst

We are hiring graduates to join our analytics team for a 12-month training program. You will support reporting, clean data and present findings to the team while learning on the job.

Requirements
- Bachelor's degree in any quantitative or business field
- Working knowledge of Excel and basic SQL
- Strong communication and teamwork skills
- Ability to analyze data and explain what it shows
- Eagerness to learn and take ownership of tasks

Nice to have
- Python
- Internship or project experience
- Presentation skills`,
    },
  },
  {
    id: "career-changer",
    name: "General / Career-changer",
    level: "Any level",
    tagline: "For switching fields. Leads with transferable skills and results.",
    resume: {
      summary:
        "Operations professional with 8+ years of experience coordinating vendors, teams and budgets, now moving into project coordination. Proven at planning work, tracking risks and keeping stakeholders informed.",
      skills: [
        { label: "Transferable", items: "Project planning, Stakeholder communication, Budgeting, Training, Reporting" },
        { label: "Tools", items: "Excel, Asana, Google Workspace, PowerPoint, Jira" },
      ],
      experience: [
        {
          title: "Operations Coordinator", org: "Company Name, City", dates: "Jan 2019 – Present",
          bullets: [
            "Coordinated 25 vendor contracts worth $400,000 per year and negotiated terms that saved 12% annually.",
            "Planned and tracked 10 cross-team projects in Asana, delivering 9 of them on time and within budget.",
            "Trained 30 new staff on processes and tools, cutting onboarding time from 6 weeks to 4 weeks.",
            "Reported weekly progress to 4 department heads using Excel dashboards, helping reduce delays by 20%.",
          ],
        },
        {
          title: "Team Lead", org: "Company Name, City", dates: "Jun 2016 – Dec 2018",
          bullets: [
            "Led a team of 12 through a system migration and finished 1 week early with zero data loss.",
            "Resolved 200+ customer escalations per quarter, raising satisfaction from 82% to 91%.",
            "Documented 15 standard procedures that helped new hires reach full productivity 25% faster.",
          ],
        },
      ],
      projects: [],
      education: [
        { degree: "B.A. in Business Administration", school: "University Name", dates: "2012 – 2016" },
        { degree: "Google Project Management Certificate", school: "Coursera", dates: "2024" },
      ],
    },
    jd: {
      title: "Project Coordinator",
      keySkills: ["project planning", "schedules", "budgets", "stakeholder", "Excel", "Asana", "Jira", "documentation", "reporting", "risk"],
      text: `Project Coordinator

We need a Project Coordinator to support our delivery team. You will maintain project plans, track budgets and risks, and keep stakeholders updated on progress.

Requirements
- 2+ years of experience coordinating projects, teams or vendors
- Strong project planning and scheduling skills
- Experience tracking budgets and reporting progress to stakeholders
- Proficiency in Excel and a tool such as Asana or Jira
- Clear documentation and communication skills

Nice to have
- CAPM, PMP or similar certification
- Agile experience`,
    },
  },
];