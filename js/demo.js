// Crosscourse AI Partner Co-Design Simulation Engine
// Replaces static pre-packaged demos with an interactive co-design experience
// where the user partners with an AI professor from a random international university.
import * as S from './store.js';

export const AI_PARTNER_PERSONAS = [
  {
    key: 'senegal',
    name: 'Dr. Amara Diallo',
    email: 'a.diallo@ucad.edu.sn',
    institution: 'Cheikh Anta Diop University',
    country: 'Senegal',
    city: 'Dakar',
    timezone: 'Africa/Dakar',
    language: 'French',
    flag: 'SN',
    workStart: '08:30',
    workEnd: '17:30',
    flexStart: '07:30',
    flexEnd: '20:30',
    bio: 'Associate Professor specializing in community health systems, environmental health, and participatory grassroots inquiry.',
    studentProfile: 'Public university cohort with extensive field experience in urban community health posts; bilingual in French and Wolof with intermediate English reading skills; mobile-first digital access.',
    contributes: 'Field data from Dakar community health posts, participatory action research methods, and West African health governance frameworks.',
    tech: 'WhatsApp for coordination, Moodle LMS, Google Meet for synchronous meetings',
    techRestrictions: 'Limited high-speed campus broadband; mobile-first and low-bandwidth alternatives preferred.',
    assessmentObligations: 'Institutional requirements include continuous assessment (Controle Continu 40%) and a final written evaluation (60%).',
    breaks: [
      { label: 'Independence Day break', offsetDays: 45, durationDays: 4 },
      { label: 'Mid-term study week', offsetDays: 75, durationDays: 5 }
    ],
    localOutcomes: [
      'Analyser les determinants communautaires et environnementaux de la sante.',
      'Evaluer les protocoles d intervention sanitaire en contexte de ressources limitees.',
      'Formuler des recommandations fondees sur la participation communautaire.'
    ]
  },
  {
    key: 'brazil',
    name: 'Profa. Mariana Silva',
    email: 'mariana.silva@usp.br',
    institution: 'Universidade de Sao Paulo (USP)',
    country: 'Brazil',
    city: 'Sao Paulo',
    timezone: 'America/Sao_Paulo',
    language: 'Portuguese',
    flag: 'BR',
    workStart: '08:00',
    workEnd: '18:00',
    flexStart: '07:00',
    flexEnd: '21:00',
    bio: 'Professor of Urban Planning and Environmental Policy with research focusing on social vulnerability, transit equity, and participatory budgeting.',
    studentProfile: 'Evening degree students who work during daytime hours; strong critical reading skills in English; vibrant traditions of peer critique and social advocacy.',
    contributes: 'Case archives from Sao Paulo urban planning agencies, participatory mapping methodologies, and comparative Latin American environmental policy data.',
    tech: 'Moodle, Google Meet, WhatsApp for group communication',
    techRestrictions: 'Evening availability (19:00 to 22:00 local time); university policy discourages mandatory proprietary platforms.',
    assessmentObligations: 'Grades awarded on a 0 to 10 scale; two formal assessment cycles (N1 and N2) required by department regulations.',
    breaks: [
      { label: 'Semana Santa and Recesso', offsetDays: 30, durationDays: 6 },
      { label: 'Mid-semester break', offsetDays: 68, durationDays: 4 }
    ],
    localOutcomes: [
      'Analisar politicas publicas urbanas sob a otica da justica socioambiental.',
      'Mapear atores e conflitos territoriais utilizando metodologias participativas.',
      'Propor intervencoes sustentaveis articulando evidencias locais e diretrizes globais.'
    ]
  },
  {
    key: 'japan',
    name: 'Prof. Kenji Takahashi',
    email: 'k.takahashi@kyoto-u.ac.jp',
    institution: 'Kyoto University',
    country: 'Japan',
    city: 'Kyoto',
    timezone: 'Asia/Tokyo',
    language: 'Japanese',
    flag: 'JP',
    workStart: '09:00',
    workEnd: '18:00',
    flexStart: '08:00',
    flexEnd: '21:00',
    bio: 'Professor of Technology Ethics and Systems Engineering focusing on algorithmic accountability, robotics governance, and human-technology interfaces.',
    studentProfile: 'Undergraduate and early graduate seminar cohort; highly skilled in quantitative analysis and algorithmic design; students appreciate structured written preparation prior to live discussions.',
    contributes: 'Technical case studies in robotics governance, ethical impact assessment matrices, and Asian perspectives on technology and human well-being.',
    tech: 'Pandas / Python toolkits, Slack, Zoom, institutional LMS (PandA)',
    techRestrictions: 'Fast gigabit broadband; calendar aligns strictly with Japanese academic semesters (April-July and October-January).',
    assessmentObligations: 'Grades awarded on A/B/C/D scale based on individual technical critique and team project deliverable.',
    breaks: [
      { label: 'Golden Week national holiday', offsetDays: 40, durationDays: 7 },
      { label: 'University Foundation Days', offsetDays: 80, durationDays: 3 }
    ],
    localOutcomes: [
      'Evaluate algorithmic systems using ethical impact criteria and verification logs.',
      'Critique international policy frameworks for automated decision systems.',
      'Collaborate in multicultural technical teams to draft verifiable governance standards.'
    ]
  },
  {
    key: 'italy',
    name: 'Prof. Elena Rossi',
    email: 'elena.rossi@unibo.it',
    institution: 'University of Bologna',
    country: 'Italy',
    city: 'Bologna',
    timezone: 'Europe/Rome',
    language: 'Italian',
    flag: 'IT',
    workStart: '09:00',
    workEnd: '17:30',
    flexStart: '08:00',
    flexEnd: '20:00',
    bio: 'Associate Professor in Comparative Law and Cultural Policy with extensive experience in European Union regulatory design and heritage preservation.',
    studentProfile: 'European and international master cohort; fluent in English; strong legal philosophy and historical comparative analysis traditions.',
    contributes: 'European regulatory dossiers, comparative jurisprudence, and cultural preservation archives.',
    tech: 'Virtuale (Moodle), Microsoft Teams, Zoom',
    techRestrictions: 'GDPR compliance is non-negotiable; all student personal data and coursework must reside on EU-compliant servers.',
    assessmentObligations: 'Grades on a 30-point scale (18/30 passing); combines continuous portfolio assessment with oral defense.',
    breaks: [
      { label: 'Spring Easter Recess', offsetDays: 35, durationDays: 6 },
      { label: 'National Liberation Holidays', offsetDays: 60, durationDays: 3 }
    ],
    localOutcomes: [
      'Valutare criticamente quadri normativi comparati alla luce dei principi di equita.',
      'Applicare metodologie di analisi giuridica a casi di studio transfrontalieri.',
      'Negoziare soluzioni di governance condivise rispettando i vincoli di sovranita.'
    ]
  },
  {
    key: 'uae',
    name: 'Dr. Tariq Al-Mansoor',
    email: 'talmansoor@aus.edu',
    institution: 'American University of Sharjah',
    country: 'United Arab Emirates',
    city: 'Sharjah',
    timezone: 'Asia/Dubai',
    language: 'Arabic',
    flag: 'AE',
    workStart: '08:30',
    workEnd: '17:00',
    flexStart: '07:30',
    flexEnd: '19:30',
    bio: 'Associate Professor of Sustainable Supply Chains and Smart City Architecture in the College of Engineering.',
    studentProfile: 'Highly cosmopolitan student body representing over 45 nationalities; English is the primary medium of university instruction; high technological fluency.',
    contributes: 'Regional smart city data sets, desert green building audits, and global logistics hub case studies.',
    tech: 'Blackboard Learn, Microsoft Teams, Cisco Webex, Miro',
    techRestrictions: 'Weekend schedule is Friday afternoon through Sunday; Monday to Thursday are standard working days.',
    assessmentObligations: 'Letter grades with GPA weighting; requires individual analytical report worth 30% of total course grade.',
    breaks: [
      { label: 'Mid-term break', offsetDays: 42, durationDays: 5 },
      { label: 'National celebrations', offsetDays: 78, durationDays: 3 }
    ],
    localOutcomes: [
      'Evaluate circular supply chain resilience under extreme climatic and logistical constraints.',
      'Model material flow loops using lifecycle assessment and sustainability KPIs.',
      'Present strategic enterprise recommendations in multinational executive formats.'
    ]
  },
  {
    key: 'india',
    name: 'Dr. Priya Sharma',
    email: 'psharma@cse.iitd.ac.in',
    institution: 'Indian Institute of Technology Delhi',
    country: 'India',
    city: 'New Delhi',
    timezone: 'Asia/Kolkata',
    language: 'Hindi',
    flag: 'IN',
    workStart: '09:00',
    workEnd: '18:30',
    flexStart: '08:00',
    flexEnd: '21:30',
    bio: 'Professor of Public Systems Engineering and Frugal Innovation, working on affordable renewable energy systems and rural digital governance.',
    studentProfile: 'Rigorous engineering and policy students; exceptionally strong quantitative modelling skills; high interest in low-cost, scalable community innovations.',
    contributes: 'Data from rural micro-grid pilots, open-source hardware designs, and frugal innovation frameworks developed across Indian states.',
    tech: 'Moodle, Google Meet, GitHub for shared documentation and code',
    techRestrictions: 'High academic workload across parallel courses; synchronous sessions must be planned well in advance.',
    assessmentObligations: 'Continuous evaluation with minor exam (30%), major exam (40%), and project component (30%).',
    breaks: [
      { label: 'Mid-semester recess', offsetDays: 40, durationDays: 6 },
      { label: 'Festival holiday', offsetDays: 70, durationDays: 3 }
    ],
    localOutcomes: [
      'Formulate frugal engineering solutions to systemic infrastructure bottlenecks.',
      'Model system reliability under resource-constrained rural operational conditions.',
      'Demonstrate cross-cultural technical communication and ethical stakeholder engagement.'
    ]
  },
  {
    key: 'colombia',
    name: 'Prof. Carlos Mendoza',
    email: 'cmendozag@unal.edu.co',
    institution: 'Universidad Nacional de Colombia',
    country: 'Colombia',
    city: 'Bogota',
    timezone: 'America/Bogota',
    language: 'Spanish',
    flag: 'CO',
    workStart: '08:00',
    workEnd: '17:00',
    flexStart: '07:00',
    flexEnd: '20:00',
    bio: 'Professor of Environmental Economics and Territorial Governance specializing in watershed stewardship, biodiversity, and peacebuilding.',
    studentProfile: 'Diverse student body from across Andean and Pacific regions; strong commitment to social justice and participatory ecological governance; Spanish primary with English reading comprehension.',
    contributes: 'Watershed field studies, indigenous and community land-stewardship documentation, and Colombian biodiversity monitoring protocols.',
    tech: 'Google Workspace, Moodle, WhatsApp for student field teams',
    techRestrictions: 'Prefers open-source and mobile-accessible platforms without expensive proprietary licensing.',
    assessmentObligations: 'Qualitative rubric with numerical grade scale 0.0 to 5.0 (3.0 passing); includes participatory community validation.',
    breaks: [
      { label: 'Semana Universitaria', offsetDays: 45, durationDays: 5 },
      { label: 'Regional field trip period', offsetDays: 72, durationDays: 4 }
    ],
    localOutcomes: [
      'Analizar conflictos por recursos hidricos y biodiversidad desde la economia ecologica.',
      'Formular propuestas de gestion comunitaria fundamentadas en el dialogo de saberes.',
      'Sintetizar evidencias socioambientales para la toma de decisiones territoriales.'
    ]
  },
  {
    key: 'sweden',
    name: 'Prof. Ingrid Lindstrom',
    email: 'ingrid.lindstrom@lucsusc.lu.se',
    institution: 'Lund University',
    country: 'Sweden',
    city: 'Lund',
    timezone: 'Europe/Stockholm',
    language: 'Swedish',
    flag: 'SE',
    workStart: '08:30',
    workEnd: '17:00',
    flexStart: '07:30',
    flexEnd: '19:00',
    bio: 'Professor of Sustainability Science and Circular Economy focusing on EU climate policy, participatory governance, and industrial symbiosis.',
    studentProfile: 'International multidisciplinary seminar cohort; entirely English-medium; strong self-direction and consensus-based teamwork expectations.',
    contributes: 'Nordic municipal circular economy audits, industrial symbiosis network data, and deliberative governance frameworks.',
    tech: 'Canvas LMS, Zoom, Miro, Google Docs',
    techRestrictions: 'Respects strict work-life balance boundaries; weekend emails are not answered until Monday morning.',
    assessmentObligations: 'Pass with Distinction (VG), Pass (G), or Fail (U); relies on continuous reflective portfolio and collaborative synthesis.',
    breaks: [
      { label: 'Spring reading week', offsetDays: 38, durationDays: 5 },
      { label: 'Valborg national recess', offsetDays: 65, durationDays: 3 }
    ],
    localOutcomes: [
      'Assess municipal circular economy transition pathways using systems thinking.',
      'Critique policy instruments across contrasting geopolitical and institutional regimes.',
      'Facilitate deliberative co-creation in multidisciplinary cross-border cohorts.'
    ]
  }
];

export const TOPIC_PRESETS = [
  {
    key: 'health',
    title: 'Global Health & Epidemic Preparedness',
    discipline: 'Public Health and Community Epidemiology',
    challenge: 'Evaluating community-based epidemic preparedness and vaccination equity across diverse health systems',
    question: 'How can health systems balance centralized surveillance protocols with grassroots community trust and local health knowledge?',
    whyInternational: 'One cohort investigates centralized institutional surveillance while the other brings participatory community health networks and local trust dynamics.',
    counterfactual: 'Without international collaboration, students evaluate only their domestic healthcare model without confronting how historical trust and community networks dictate public compliance.',
    homeCourseTitle: 'Global Health Policy and Systems',
    homeCourseCode: 'GHP 410',
    partnerCourseTitle: 'Epidemiologie Communautaire et Sante Publique',
    partnerCourseCode: 'ESP 302',
    commonTheme: 'Both courses analyze how public health interventions depend on community trust and situated health communication.',
    glossary: [
      { term: 'community surveillance', defs: { English: 'Systematic tracking of health indicators through local health posts and community monitors.', French: 'surveillance a base communautaire: veille sanitaire ancree dans les relais de quartier.' }, note: 'Carries strong grassroots autonomy connotations in West Africa.' },
      { term: 'vaccine equity', defs: { English: 'Fair distribution of vaccines prioritizing high-risk populations regardless of purchasing power.', French: 'equite vaccinale' }, note: 'Focuses on global supply chain access vs local delivery bottlenecks.' }
    ]
  },
  {
    key: 'ai',
    title: 'Artificial Intelligence, Ethics & Society',
    discipline: 'Computer Science and Public Policy',
    challenge: 'Auditing algorithmic bias, surveillance, and civic agency across contrasting legal and cultural governance frameworks',
    question: 'When automated decision systems impact citizens across borders, how should fairness and accountability be defined across contrasting social and regulatory traditions?',
    whyInternational: 'Students compare contrasting data protection regulations, algorithmic deployment in public services, and differing cultural conceptions of privacy and public good.',
    counterfactual: 'Without the partner cohort, students assume their local regulatory framework (such as market-driven compliance or central regulation) is universal.',
    homeCourseTitle: 'Artificial Intelligence and Public Policy',
    homeCourseCode: 'CS 480',
    partnerCourseTitle: 'Ethics of Autonomous Systems and Algorithmic Auditing',
    partnerCourseCode: 'ETH 504',
    commonTheme: 'Both professors want students to question unexamined assumptions about objectivity in machine learning training data.',
    glossary: [
      { term: 'algorithmic accountability', defs: { English: 'The principle that automated system designers and deployers remain responsible for decisions affecting humans.', Japanese: 'arugorizumu sekinin (algorithmic accountability and transparency obligations)' }, note: 'Involves distinct legal standards in different jurisdictions.' },
      { term: 'data provenance', defs: { English: 'The documented lineage and collection circumstances of training and evaluation datasets.', Japanese: 'deta no shorai' }, note: 'Crucial for verifying consent and representativeness.' }
    ]
  },
  {
    key: 'sustainability',
    title: 'Sustainable Cities & Urban Mobility Transitions',
    discipline: 'Urban Planning and Environmental Sustainability',
    challenge: 'Designing inclusive transit and carbon-neutral mobility solutions under contrasting geographical and economic constraints',
    question: 'How can cities transition to low-carbon urban mobility without displacing or economically penalizing vulnerable commuter populations?',
    whyInternational: 'Combines high-density transit models from one continent with decentralized, informal transit and community mobility solutions from another.',
    counterfactual: 'Students design technical interventions that would fail in informal or geographically constrained transit ecosystems without partner critique.',
    homeCourseTitle: 'Urban Sustainability and Infrastructure Systems',
    homeCourseCode: 'URB 320',
    partnerCourseTitle: 'Desenvolvimento Sustentavel e Mobilidade Urbana',
    partnerCourseCode: 'DSM 204',
    commonTheme: 'Both cohorts examine how transportation policy either deepens or resolves territorial inequality.',
    glossary: [
      { term: 'transit equity', defs: { English: 'Fair distribution of accessible, affordable transportation options to all socioeconomic segments.', Portuguese: 'equidade no transporte publico' }, note: 'Involves consideration of informal transit operators and peripheral commuter routes.' },
      { term: 'participatory planning', defs: { English: 'Urban decision-making that directly incorporates resident co-design and budgeting.', Portuguese: 'planejamento participativo' }, note: 'Established tradition in Latin American municipal governance.' }
    ]
  },
  {
    key: 'water',
    title: 'Cross-Border Water Resource Governance & Environmental Justice',
    discipline: 'Environmental Policy and Water Resource Stewardship',
    challenge: 'Managing shared river basins and coastal aquifers under escalating climate stress and competing agricultural, industrial, and community claims',
    question: 'Whose claims, evidence, and historical rights take precedence when shared water supplies face acute seasonal deficits?',
    whyInternational: 'Brings contrasting water rights jurisprudence, community stewardship accounts, and upstream-downstream geopolitical tensions.',
    counterfactual: 'Without partner data and stakeholder testimony, students produce unilateral engineering solutions that ignore cross-border treaties and human rights.',
    homeCourseTitle: 'Environmental Policy and Watershed Management',
    homeCourseCode: 'ENV 360',
    partnerCourseTitle: 'Gobernanza del Agua y Gestion Territorial',
    partnerCourseCode: 'GUA 401',
    commonTheme: 'Both courses investigate why purely technical water models fail when disconnected from historical and indigenous rights.',
    glossary: [
      { term: 'ecological flow', defs: { English: 'The minimum water quantity and timing required to sustain freshwater and estuarine ecosystems.', Spanish: 'caudal ecologico' }, note: 'Frequently contested between agricultural irrigators and environmental regulators.' },
      { term: 'territorial water rights', defs: { English: 'Legal and customary entitlements to water access rooted in land tenure and community treaties.', Spanish: 'derechos territoriales del agua' }, note: 'Embodies constitutional and ancestral protections in Andean jurisdictions.' }
    ]
  },
  {
    key: 'supplychain',
    title: 'Circular Economy, Supply Chains & Global Trade',
    discipline: 'Business Administration and Circular Supply Chains',
    challenge: 'Restructuring international supply chains for circularity, labor dignity, and zero waste',
    question: 'How can multinational supply chains transition to circular loops without imposing uncompensated compliance costs on suppliers in the Global South?',
    whyInternational: 'Directly bridges consumer market regulations with origin-country manufacturing realities, material sourcing, and informal recycling networks.',
    counterfactual: 'Students formulate corporate sustainability guidelines that look exemplary in corporate reports but prove unworkable or punitive on the ground.',
    homeCourseTitle: 'Global Supply Chain Strategy and Circularity',
    homeCourseCode: 'SCM 450',
    partnerCourseTitle: 'Sustainable Enterprise and Industrial Logistics',
    partnerCourseCode: 'SEI 308',
    commonTheme: 'Both professors emphasize that true circularity requires transparent accounting of labor conditions and material lifecycles.',
    glossary: [
      { term: 'extended producer responsibility', defs: { English: 'Policy principle holding manufacturers accountable for post-consumer treatment and disposal of products.', Arabic: 'masouliyat al-muntij al-mumtada' }, note: 'Critical for international e-waste and packaging standards.' },
      { term: 'reverse logistics', defs: { English: 'Supply chain operations moving goods from their typical final destination for recapturing value or proper disposal.', Arabic: 'al-lawjistiyat al-aksiyya' }, note: 'Requires infrastructure often absent in consumer-importing economies.' }
    ]
  },
  {
    key: 'media',
    title: 'Digital Media, Misinformation & Civic Agency',
    discipline: 'Communication, Media Studies and Political Science',
    challenge: 'Investigating the spread and impact of coordinated digital misinformation during critical civic events',
    question: 'How do digital platforms and localized information ecosystems amplify or mitigate polarization during public crises?',
    whyInternational: 'Compares platform algorithms, linguistic moderation gaps, and historical state-media trust dynamics across two distinct political systems.',
    counterfactual: 'Students treat domestic social media dynamics as universal, overlooking how encrypted messaging apps and local media traditions alter information spread.',
    homeCourseTitle: 'Digital Media and Public Communication',
    homeCourseCode: 'COM 315',
    partnerCourseTitle: 'Mediepolitik och Digital Kallsamtal',
    partnerCourseCode: 'MED 205',
    commonTheme: 'Both courses train students to evaluate digital source credibility and understand algorithmic echo chambers.',
    glossary: [
      { term: 'information disorder', defs: { English: 'The conceptual framework categorizing misinformation, disinformation, and malinformation.', Swedish: 'informationspaverkan' }, note: 'Focuses on intent and harm in digital civic communication.' },
      { term: 'algorithmic amplification', defs: { English: 'The technical mechanism where recommendation algorithms prioritize engaging, often controversial content.', Swedish: 'algoritmisk forstarkning' }, note: 'Under debate in European platform regulation.' }
    ]
  }
];

export function randomPartnerPersona() {
  const i = Math.floor(Math.random() * AI_PARTNER_PERSONAS.length);
  return AI_PARTNER_PERSONAS[i];
}

export function randomTopicPreset() {
  const i = Math.floor(Math.random() * TOPIC_PRESETS.length);
  return TOPIC_PRESETS[i];
}

/**
 * Calculates start and end dates calibrated to academic terms.
 */
export function getTermDates(term, durationWeeks = 5) {
  const t = String(term || '').toLowerCase();
  let startYear = new Date().getFullYear();
  const yearMatch = t.match(/20\d\d/);
  if (yearMatch) startYear = parseInt(yearMatch[0], 10);

  let startMonth = new Date().getMonth() + 1;
  let startDay = new Date().getDate();

  if (t.includes('spring')) {
    startMonth = 1;
    startDay = 18;
    if (!yearMatch) startYear += 1;
  } else if (t.includes('summer')) {
    startMonth = 6;
    startDay = 1;
    if (!yearMatch) startYear += 1;
  } else if (t.includes('winter')) {
    startMonth = 1;
    startDay = 4;
    if (!yearMatch) startYear += 1;
  } else if (t.includes('fall')) {
    startMonth = 8;
    startDay = 24;
  }

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const totalDays = durationWeeks * 7 + 14;
  const endDate = new Date(startDate.getTime() + totalDays * 86400000);

  const pad = n => String(n).padStart(2, '0');
  const fmtYmd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    term: term || 'Evergreen / Multi-Term',
    startStr: fmtYmd(startDate),
    endStr: fmtYmd(endDate),
    startDate,
    endDate
  };
}

/**
 * Creates an interactive AI Partner Simulation project.
 * @param {Object} options
 * @param {string} [options.topic] Custom topic or title
 * @param {string} [options.topicKey] Key from TOPIC_PRESETS or 'custom'
 * @param {string} [options.customTopic] Custom topic if topicKey is custom
 * @param {string} [options.mode] 'module' (default) or 'course'
 * @param {string} [options.personaKey] Key from AI_PARTNER_PERSONAS or 'random'
 * @param {string} [options.partnerName] Optional partner colleague name
 * @param {string} [options.homeUniversity] Name of home institution
 * @param {string} [options.partnerUniversity] Name of partner institution
 * @param {string} [options.term] Academic term (optional, default Evergreen)
 * @param {Object} [options.userProfile] Optional name, institution, country for the user
 */
export function createAiPartnerDemo(options = {}) {
  const mode = options.mode === 'course' ? 'course' : 'module';
  const durationWeeks = parseInt(options.durationWeeks, 10) || (mode === 'course' ? 14 : 5);
  const visitFormat = options.visitFormat || 'virtual';
  
  // Pick topic
  let topic = null;
  const customTopic = (options.topic || options.customTopic || '').trim();
  if (customTopic) {
    topic = {
      key: 'custom',
      title: customTopic,
      discipline: 'Interdisciplinary International Studies',
      challenge: `Collaborative inquiry into ${customTopic} across contrasting institutional contexts`,
      question: `How can our cohorts investigate ${customTopic} using evidence and perspectives from both regions?`,
      whyInternational: 'Each cohort holds situated regional knowledge and case studies the other cannot access independently.',
      counterfactual: 'Without the partner cohort, students would analyze this topic through a single national and cultural lens.',
      homeCourseTitle: `Studies in ${customTopic}`,
      homeCourseCode: 'INT 400',
      partnerCourseTitle: `Perspectives on ${customTopic}`,
      partnerCourseCode: 'GLO 300',
      commonTheme: 'Both courses seek to broaden student perspectives through reciprocal international critique.',
      glossary: []
    };
  } else if (options.topicKey) {
    topic = TOPIC_PRESETS.find(t => t.key === options.topicKey) || randomTopicPreset();
  } else {
    topic = {
      key: 'custom',
      title: 'Comparative International Inquiry',
      discipline: 'Interdisciplinary Studies',
      challenge: 'Collaborative inquiry across contrasting institutional contexts',
      question: 'How can our cohorts investigate shared challenges collaboratively?',
      whyInternational: 'Each cohort holds situated regional knowledge the other cannot access independently.',
      counterfactual: 'Without the partner cohort, students would analyze this topic through a single national lens.',
      homeCourseTitle: 'Studies in Collaborative Inquiry',
      homeCourseCode: 'INT 400',
      partnerCourseTitle: 'Perspectives on Collaborative Inquiry',
      partnerCourseCode: 'GLO 300',
      commonTheme: 'Broaden student perspectives through reciprocal international critique.',
      glossary: []
    };
  }

  // Pick persona
  let persona = Object.assign({}, AI_PARTNER_PERSONAS.find(p => p.key === options.personaKey) || randomPartnerPersona());
  if (options.partnerName?.trim()) {
    persona.name = options.partnerName.trim();
  }

  const p = S.blankProject(topic.title);
  p.mode = mode;
  p.durationWeeks = durationWeeks;
  p.visitFormat = visitFormat;
  p.isAiSimulation = true;
  p.aiPartnerPersona = persona.key;

  const termInfo = getTermDates(options.term || 'Fall 2026', durationWeeks);
  const termStartStr = termInfo.startStr;
  const termEndStr = termInfo.endStr;
  p.term = termInfo.term;

  const nowD = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmtYmd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const ago = h => new Date(Date.now() - h * 3600000).toISOString();

  const user = options.userProfile || {};
  const userTz = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  const userInst = options.homeUniversity || options.homeInst || user.institution || 'Lead University';
  const userName = user.name || 'Professor You';
  const userLang = user.language || 'English';

  const partnerInst = options.partnerUniversity || options.partnerInst || persona.institution;
  const partnerCountry = options.partnerCountry || persona.country;

  // Build raw list of 2 to 9 universities
  const rawUniversities = (options.universities && options.universities.length >= 2)
    ? options.universities
    : [
        { index: 1, institution: userInst, country: userCountry, professor: userName },
        { index: 2, institution: partnerInst, country: partnerCountry, professor: options.partnerName || persona.name }
      ];

  // Campus 1: Home Professor (Lead Institution / User)
  const leadUni = rawUniversities[0];
  const homePartner = S.blankPartner({
    id: 'ptn_home',
    name: leadUni.professor || userName,
    email: user.email || 'professor@example.edu',
    institution: leadUni.institution || userInst,
    country: leadUni.country || userCountry,
    timezone: userTz,
    language: userLang,
    role: 'representative',
    status: 'active',
    workStart: '08:30',
    workEnd: '17:00',
    flexStart: '07:30',
    flexEnd: '20:00',
    contributes: `Home institutional course data, domestic case studies on ${topic.title}, and students eager to engage in cross-cultural inquiry.`,
    course: {
      title: topic.homeCourseTitle,
      code: topic.homeCourseCode,
      level: 'Upper-division undergraduate',
      discipline: topic.discipline,
      studentsCount: 26,
      purpose: `Students investigate core dimensions of ${topic.title} through evidence analysis, comparative methodology, and collaborative inquiry.`,
      priorities: 'Methodological rigor, critical evaluation of sources, cross-cultural synthesis',
      interculturalAims: 'Recognize unexamined assumptions in domestic frameworks and articulate respectful critique across borders.',
      languages: `${userLang}. Students have varying degrees of second-language proficiency.`,
      termStart: termStartStr,
      termEnd: termEndStr,
      studentAvailability: 'Daytime class meetings; async group work scheduled flexibly throughout the week.',
      workloadHoursPerWeek: 4,
      tech: 'Canvas, Zoom, Google Docs',
      techRestrictions: 'Requires accessibility captioning for recorded materials.',
      assessmentObligations: 'Individual written portfolio component worth at least 25% of final grade.',
      accessibility: 'Screen-reader compatibility and flexible deadline grace periods.',
      careTopics: 'Students may hold personal connections to geopolitical or socio-economic aspects of the topic.',
      constraints: 'Institutional midterm grading deadline in week 7.',
      hopes: `Learn directly from partner universities about their situated methodologies and local case dynamics.`,
      breaks: [
        { id: 'brk_h1', label: 'Mid-term break', start: fmtYmd(addDays(nowD, 28)), end: fmtYmd(addDays(nowD, 35)) }
      ],
      localOutcomes: [
        { id: 'lo_h1', text: `Analyze key theoretical and practical frameworks underlying ${topic.title}.` },
        { id: 'lo_h2', text: 'Critique empirical evidence and evaluate stakeholder interests in complex policy scenarios.' },
        { id: 'lo_h3', text: 'Communicate collaborative findings persuasively to diverse, non-specialist international audiences.' }
      ]
    },
    fieldStates: {
      title: 'confirmed',
      purpose: 'confirmed',
      termStart: 'confirmed',
      termEnd: 'confirmed',
      assessmentObligations: 'confirmed'
    }
  }, 0);

  // Campuses 2 to N: Partner Universities (Up to 9 total)
  const partnerObjects = rawUniversities.slice(1).map((u, idx) => {
    const pIdx = idx + 1;
    const partnerId = pIdx === 1 ? 'ptn_ai' : `ptn_ai_${pIdx + 1}`;
    const ptnPersona = Object.assign({}, AI_PARTNER_PERSONAS[idx % AI_PARTNER_PERSONAS.length]);
    const pName = u.professor?.trim() || (idx === 0 && options.partnerName?.trim() ? options.partnerName.trim() : ptnPersona.name);
    const pInst = u.institution?.trim() || (idx === 0 ? partnerInst : ptnPersona.institution);
    const pCountry = u.country?.trim() || (idx === 0 ? partnerCountry : ptnPersona.country);

    return S.blankPartner({
      id: partnerId,
      name: pName,
      email: ptnPersona.email,
      institution: pInst,
      country: pCountry,
      city: ptnPersona.city,
      timezone: ptnPersona.timezone,
      language: ptnPersona.language,
      role: 'representative',
      status: 'active',
      isAi: true,
      aiPersona: ptnPersona.key,
      workStart: ptnPersona.workStart,
      workEnd: ptnPersona.workEnd,
      flexStart: ptnPersona.flexStart,
      flexEnd: ptnPersona.flexEnd,
      contributes: `Situated case studies on ${topic.title}, local datasets, and student cohort perspectives from ${pCountry || pInst}.`,
      course: {
        title: `${topic.partnerCourseTitle} (Campus ${pIdx + 1})`,
        code: `${topic.partnerCourseCode}-${pIdx + 1}`,
        level: '3rd year Undergraduate / Master seminar',
        discipline: topic.discipline,
        studentsCount: 28,
        purpose: `Studies in ${topic.title} at ${pInst}, examining situated local evidence, comparative methodologies, and regional dynamics.`,
        priorities: 'Community-grounded inquiry, participatory methods, ethical accountability',
        interculturalAims: 'Question universalizing assumptions and share local traditions of knowledge.',
        languages: `${ptnPersona.language || 'English'} as working language; students collaborate in English with multilingual peer support.`,
        termStart: termStartStr,
        termEnd: termEndStr,
        studentAvailability: 'Daytime class meetings with flexible asynchronous group work scheduled throughout the week.',
        workloadHoursPerWeek: 3.5,
        tech: ptnPersona.tech || 'Shared Google Workspace, Canvas / Moodle, Video Conferencing',
        techRestrictions: 'Requires low-bandwidth mobile-friendly formats and asynchronous video alternatives.',
        assessmentObligations: 'Continuous assessment with local departmental rubric.',
        accessibility: 'Requires low-bandwidth mobile-friendly formats and asynchronous video alternatives.',
        careTopics: 'Local communities and families of students are directly impacted by issues investigated.',
        constraints: `Time zone differences and local calendar alignment.`,
        hopes: `Build long-term reciprocal research and teaching bridges with ${userInst}.`,
        breaks: [],
        localOutcomes: [
          { id: `lo_${partnerId}_0`, text: `Examine regional case studies and institutional frameworks on ${topic.title} in ${pCountry || pInst}.` },
          { id: `lo_${partnerId}_1`, text: 'Engage in constructive cross-border peer critique and comparative analysis.' },
          { id: `lo_${partnerId}_2`, text: 'Synthesize multilateral evidence into joint deliverables and collaborative proposals.' }
        ]
      },
      fieldStates: {
        title: 'confirmed',
        purpose: 'confirmed',
        termStart: 'confirmed',
        termEnd: 'confirmed',
        languages: 'confirmed',
        techRestrictions: 'confirmed',
        assessmentObligations: 'confirmed'
      }
    }, pIdx);
  });

  const allPartners = [homePartner, ...partnerObjects];
  const allIds = allPartners.map(x => x.id);
  const primaryPartner = partnerObjects[0];

  p.partners = allPartners;
  p.aiPartnerId = primaryPartner.id;

  // Staged Design Brief
  p.brief = {
    id: 'brief',
    challenge: topic.challenge,
    question: topic.question,
    whyInternational: topic.whyInternational,
    counterfactual: topic.counterfactual,
    status: 'draft',
    updatedAt: ago(3),
    updatedBy: primaryPartner.id
  };

  // Partnership Charter
  let mobilityClause = '';
  if (visitFormat === 'custom' && options.customVisitFormat) {
    mobilityClause = `Custom International Mobility & Delivery Format: ${options.customVisitFormat}. Activities and institutional support are tailored accordingly across all consortium campuses.`;
  } else if (visitFormat === 'student-visit') {
    mobilityClause = `Blended Virtual + Student Immersion: Student cohort participates in an intensive reciprocal field study visit hosted at ${primaryPartner.institution} in ${primaryPartner.city || 'the host city'}, ${primaryPartner.country}. Host institution provides campus facilities, safety briefings, and field site coordination. Traveling students observe host institution codes of conduct. Remote or non-traveling students participate through synchronized video links and annotated collaborative documents with complete academic parity.`;
  } else if (visitFormat === 'faculty-visit') {
    mobilityClause = `Blended Virtual + Faculty Mobility: Visiting professors travel to partner campuses for guest lectures and joint research colloquia. Host institutions assist with campus credentials and academic itineraries. Student cohort collaboration remains online.`;
  } else if (visitFormat === 'parallel-studios') {
    mobilityClause = `Multi-Campus Parallel Studios: Cohorts work simultaneously in synchronized design studios or laboratories across all consortium campuses, connecting at scheduled milestones for joint peer reviews, data exchanges, and simultaneous prototype crits.`;
  } else if (visitFormat === 'async-distributed') {
    mobilityClause = `Asynchronous Distributed Teams: Designed specifically for multi-campus time-zone differentials. Collaboration occurs via structured asynchronous handoffs, pre-recorded briefings, annotated documents, and 24-hour cycle workflows with lightweight messaging.`;
  } else if (visitFormat === 'field-practicum') {
    mobilityClause = `Virtual Preparation + Field Practicum: Cohorts complete collaborative virtual preparatory modules, followed by an intensive joint on-site practicum or community-based fieldwork with civic or industry partners in the host region.`;
  } else {
    mobilityClause = `100% Fully Virtual Exchange: All student and faculty interactions take place online via asynchronous shared workspaces and scheduled video sessions across all partner campuses. No international travel is required.`;
  }

  const instListStr = allPartners.map(x => x.institution).join(', ');

  Object.assign(p.charter, {
    purpose: `To co-design an authentic ${mode === 'course' ? 'course collaboration' : 'international learning module'} (${durationWeeks} weeks, ${visitFormat}) across ${instListStr} investigating ${topic.title} together, designed for flexible multi-term deployment.`,
    decisionRights: 'Substantive changes to shared deliverables, schedule, and outcomes require multilateral consensus across participating faculty representatives. Local grading remains sovereign at each institution.',
    responseDays: 3,
    languages: `Faculty coordination in English (with multilingual glossary support). Student team deliverables submitted with multilingual executive summaries.`,
    division: `${userName} coordinates digital portfolio templates and synthesis rubrics; partner colleagues coordinate local case dossiers and community inquiry guidelines.`,
    studentComms: 'Each professor communicates directly with their own student cohort; shared joint announcements posted through the collaborative workspace.',
    attribution: 'All jointly created teaching resources licensed under Creative Commons CC BY-NC with mutual institutional credit.',
    disagreements: 'Articulate options asynchronously as a formal decision in Crosscourse. Meet for live dialogue if unresolved after 5 working days.',
    withdrawal: 'Two weeks advance notice; student grades protected via contingency dossier paths.',
    cohortLoss: 'Pre-recorded video briefings and archived case studies preserve student credit if disruption occurs at any campus.',
    mobility: mobilityClause,
    status: 'draft',
    updatedAt: ago(2),
    updatedBy: primaryPartner.id
  });

  // Shared Outcomes
  const o1 = 'out_1', o2 = 'out_2', o3 = 'out_3';
  p.outcomes = [
    {
      id: o1,
      text: `Students will be able to analyze and contrast how ${topic.title} is evaluated across participating consortium contexts (${allPartners.map(x => x.country).filter(Boolean).join(', ')}), synthesizing evidence from all regional perspectives.`,
      type: 'disciplinary',
      evidence: 'Joint comparative synthesis dossier and collaborative case brief',
      mappings: Object.fromEntries(allPartners.map((ptn, idx) => [
        ptn.id,
        idx === 0 ? ['lo_h1', 'lo_h2'] : [`lo_${ptn.id}_0`, `lo_${ptn.id}_1`]
      ])),
      status: 'approved',
      updatedAt: ago(4),
      updatedBy: homePartner.id
    },
    {
      id: o2,
      text: 'Students will be able to identify cultural and institutional assumptions in their own thinking and revise their interpretations after engaging with international partner evidence.',
      type: 'intercultural',
      evidence: 'Individual before-and-after reflective learning journal',
      mappings: Object.fromEntries(allPartners.map((ptn, idx) => [
        ptn.id,
        idx === 0 ? ['lo_h2'] : [`lo_${ptn.id}_1`]
      ])),
      status: 'approved',
      updatedAt: ago(4),
      updatedBy: primaryPartner.id
    },
    {
      id: o3,
      text: 'Students will be able to negotiate multilateral project milestones, communication norms, and constructive disagreements in a multinational team.',
      type: 'intercultural',
      evidence: 'Team working charter, collaborative process log, and peer feedback reflection',
      mappings: Object.fromEntries(allPartners.map((ptn, idx) => [
        ptn.id,
        idx === 0 ? ['lo_h3'] : [`lo_${ptn.id}_2`]
      ])),
      status: 'draft',
      updatedAt: ago(1),
      updatedBy: primaryPartner.id
    }
  ];

  // Activities along the collaborative arc
  const both = allIds;
  const buildContributions = (homeText, partnerTextGen) => {
    const res = { ptn_home: homeText };
    partnerObjects.forEach((ptn, idx) => {
      res[ptn.id] = partnerTextGen(ptn, idx);
    });
    return res;
  };
  const defaultWorkload = Object.fromEntries(allPartners.map(x => [x.id, 3.5]));

  const act = (id, title, stage, startOffset, durDays, sync, owner, contributions, dependsOn, outcomes, extra = {}) => {
    const start = fmtYmd(addDays(nowD, startOffset));
    const end = fmtYmd(addDays(nowD, startOffset + durDays));
    return Object.assign({
      id,
      title,
      stage,
      summary: '',
      instructions: '',
      sync,
      start,
      end,
      participants: both,
      contributions,
      workload: defaultWorkload,
      owner,
      dependsOn,
      outcomes,
      tools: 'Shared Google Drive, Padlet, Jitsi / Zoom',
      contingency: 'Asynchronous discussion board exchange and pre-recorded video briefings.',
      accessibility: 'Captioned videos, low-bandwidth documents, and mobile-friendly templates.',
      evidence: {},
      status: 'draft',
      updatedAt: ago(2),
      updatedBy: owner
    }, extra);
  };

  const isImmersion = visitFormat === 'student-visit';
  const isFacultyVisit = visitFormat === 'faculty-visit';

  if (durationWeeks <= 6) {
    // 4-activity accelerated schedule (e.g. 5 weeks)
    p.activities = [
      act('act_1', 'Team introductions & cross-cultural working agreement', 'trust', 2, 6, true, primaryPartner.id, buildContributions(
        'Students share short 90-second video introductions and their initial assumptions on the topic.',
        (ptn) => `Students share 90-second video introductions describing local reality in ${ptn.city || ptn.institution} and cohort strengths.`
      ), [], [o3], {
        summary: 'Multinational student teams meet, introduce themselves, and co-sign their team communication agreement.',
        status: 'approved',
        instructions: `### Stage 1: Team Working Agreement\n\n1. Watch your partner teammates' introductory videos.\n2. In your shared document, agree upon your preferred messaging channel and expected response times.\n3. Note differences in local time zones across consortium campuses and agree on meeting windows.`
      }),
      act('act_2', 'Local contextual inquiry & case dossier', 'local', 8, 8, false, 'ptn_home', buildContributions(
        `Prepares case briefing on ${userCountry} policy frameworks and local data sources.`,
        (ptn) => `Prepares situated field dossier from ${ptn.country || 'partner region'} including community interviews and local regulations.`
      ), ['act_1'], [o1], {
        summary: 'Each cohort produces a situated case dossier documenting how the topic manifests in their home region.',
        instructions: 'Document your regional case study using at least three observable evidence sources. Highlight what is documented, reported, or contested.'
      }),
      isImmersion ? act('act_3', `In-Person Immersion & Field Lab at ${primaryPartner.institution}`, 'compare', 16, 7, true, primaryPartner.id, buildContributions(
        'Participate in on-site community field visits, stakeholder interviews, and daily synthesis workshops.',
        (ptn, idx) => idx === 0 ? 'Host partner student cohorts, facilitate site visits, and coordinate community discussions.' : 'Participate in field visits, contribute regional data, and engage in daily workshops.'
      ), ['act_2'], [o1, o2], {
        summary: `Reciprocal in-person cross-country immersion week hosted at ${primaryPartner.institution} in ${primaryPartner.city || 'the host city'}, ${primaryPartner.country}.`,
        instructions: `### In-Person Field Study & Immersion Week\n\n1. **On-Site Field Visits:** Conduct scheduled community site visits and local institutional interviews.\n2. **Daily Synthesis Workshops:** Meet face-to-face in host seminar rooms to map divergences in regional evidence.\n3. **Hybrid Inclusion:** Non-traveling team members connect via live-streamed briefings and participate in annotated daily field logs.\n4. **Deliverable:** Joint field synthesis matrix and preliminary capstone outline.`,
        contingency: 'Hybrid participation: Live-streamed field briefings and asynchronous annotated field logs preserve full credit for non-traveling students.'
      }) : (isFacultyVisit ? act('act_3', 'Faculty Guest Colloquium & Cross-Cohort Critique', 'critique', 16, 7, true, primaryPartner.id, buildContributions(
        'Participate in live guest symposium and present preliminary comparative analysis.',
        (ptn) => `Visiting professors from ${ptn.institution} deliver guest lectures and facilitate joint critique.`
      ), ['act_2'], [o1, o2], {
        summary: 'Faculty cross-country visit: visiting professors deliver guest lectures and facilitate joint critique.',
        instructions: 'Attend live joint colloquium and submit collaborative peer review notes.'
      }) : act('act_3', 'Cross-cohort reciprocal analysis & critique', 'compare', 16, 8, false, primaryPartner.id, buildContributions(
        'Analyzes partner dossiers and formulates analytical questions challenging assumptions.',
        (ptn) => `Critiques comparative dossiers from ${ptn.institution} highlighting blind spots and regional policy divergence.`
      ), ['act_2'], [o1, o2], {
        summary: 'Teams exchange dossiers, compare differences, and formulate constructive reciprocal critiques.'
      })),
      act('act_4', 'Joint synthesis report & reflective debrief', 'cocreate', 24, 10, false, 'ptn_home', buildContributions(
        'Co-authors joint recommendation and completes individual learning reflection.',
        (ptn) => `Co-authors local applicability section and contributes regional case executive summary for ${ptn.country || 'partner campus'}.`
      ), ['act_3'], [o1, o2, o3], {
        summary: 'Teams produce a single unified recommendation synthesizing insights from all consortium campuses.'
      })
    ];
  } else if (durationWeeks <= 9) {
    // 5-activity accelerated term (e.g. 7 or 8 weeks)
    p.activities = [
      act('act_1', 'Team introductions & cross-cultural working agreement', 'trust', 2, 7, true, primaryPartner.id, buildContributions(
        'Video introductions and personal learning goals.',
        (ptn) => `Video introductions from ${ptn.city || ptn.institution} describing local community context.`
      ), [], [o3], { summary: 'Cross-cohort trust building and team communication compact.', status: 'approved' }),
      act('act_2', 'Local investigation & stakeholder case dossier', 'local', 10, 12, false, 'ptn_home', buildContributions(
        `Case briefing on ${userCountry} policy frameworks and local evidence.`,
        (ptn) => `Situated field dossier from ${ptn.country || 'partner region'} including stakeholder accounts.`
      ), ['act_1'], [o1], { summary: 'Situated investigation in each home territory.' }),
      act('act_3', 'Comparative framework & difference matrix', 'compare', 23, 10, false, primaryPartner.id, buildContributions(
        'Identify structural commonalities and differing definitions of priority.',
        (ptn) => `Highlight operational barriers and institutional divergence across ${ptn.institution}.`
      ), ['act_2'], [o1, o2], { summary: 'Systematic comparison across all consortium regional case studies.' }),
      isImmersion ? act('act_4', `In-Person Immersion & Field Lab at ${primaryPartner.institution}`, 'cocreate', 34, 8, true, primaryPartner.id, buildContributions(
        'Participate in on-site community field visits, stakeholder interviews, and joint studio drafting.',
        (ptn, idx) => idx === 0 ? 'Host partner student cohorts, coordinate site visits, and co-facilitate daily drafting sessions.' : 'Participate in field visits and joint studio drafting.'
      ), ['act_3'], [o1, o2, o3], {
        summary: `Reciprocal in-person cross-country immersion week hosted at ${primaryPartner.institution} in ${primaryPartner.city || 'the host city'}, ${primaryPartner.country}.`,
        instructions: `### In-Person Field Study & Immersion Week\n\n1. **Field Exploration:** Conduct on-site interviews and municipal site observations.\n2. **Joint Co-Creation Studio:** Work face-to-face to draft the collaborative capstone brief.\n3. **Hybrid Inclusion:** Synchronized video links and digital shared workspaces for remote cohort members.\n4. **Deliverable:** Completed draft policy brief and live presentation to faculty panel.`,
        contingency: 'Hybrid participation: Synchronized live video streaming and annotated digital boards for non-traveling students.'
      }) : (isFacultyVisit ? act('act_4', 'Faculty Guest Colloquium & Reciprocal Peer Critique', 'critique', 34, 8, true, primaryPartner.id, buildContributions(
        'Attend guest lecture series and present team capstone proposals.',
        (ptn) => `Faculty from ${ptn.institution} delivers guest keynote and facilitates structured peer critique.`
      ), ['act_3'], [o2], { summary: 'Faculty cross-country visit: guest keynote lectures and interactive critique.' }) : act('act_4', 'Joint co-creation of strategic policy brief', 'cocreate', 34, 12, false, 'ptn_home', buildContributions(
        'Draft policy synthesis and comparative governance recommendations.',
        (ptn) => `Draft community implementation protocols and localization safeguards for ${ptn.country || 'partner campus'}.`
      ), ['act_3'], [o1, o3], { summary: 'Co-authoring a comprehensive final capstone brief.' })),
      act('act_5', 'Individual learning reflection & institutional review', 'reflect', 47, 8, false, primaryPartner.id, buildContributions(
        'Submit individual reflective learning memo.',
        (ptn) => `Submit individual reflective learning memo and local course feedback at ${ptn.institution}.`
      ), ['act_4'], [o2], { summary: 'Reflecting on cross-cultural learning gains and unexamined assumptions.' })
    ];
  } else {
    // 6-activity full semester course collaboration (10 to 16 weeks)
    p.activities = [
      act('act_1', 'Orientation, icebreaking & partnership compact', 'trust', 3, 7, true, primaryPartner.id, buildContributions(
        'Video introductions and personal learning goals.',
        (ptn) => `Video introductions from ${ptn.city || ptn.institution} and overview of local community context.`
      ), [], [o3], { summary: 'Cross-cohort trust building and communication norms.', status: 'approved' }),
      act('act_2', 'Local investigation & stakeholder mapping', 'local', 12, 14, false, 'ptn_home', buildContributions(
        `Stakeholder analysis from ${userCountry} institutional perspectives.`,
        (ptn) => `Field accounts and community stakeholder mapping in ${ptn.country || 'partner region'}.`
      ), ['act_1'], [o1], { summary: 'Situated investigation in each home territory.' }),
      act('act_3', 'Comparative framework & difference matrix', 'compare', 28, 12, false, primaryPartner.id, buildContributions(
        'Identify structural commonalities and differing definitions of success.',
        (ptn) => `Highlight operational barriers, informal systems, and policy divergence across ${ptn.institution}.`
      ), ['act_2'], [o1, o2], { summary: 'Systematic comparison across all case studies.' }),
      isImmersion ? act('act_4', `In-Person Immersion & Field Lab at ${primaryPartner.institution}`, 'compare', 42, 8, true, primaryPartner.id, buildContributions(
        'Participate in on-site community field visits, stakeholder interviews, and live workshops.',
        (ptn, idx) => idx === 0 ? 'Host partner student cohort, coordinate site visits, and facilitate campus working sessions.' : 'Participate in on-site field visits and collaborative sessions.'
      ), ['act_3'], [o1, o2], {
        summary: `Reciprocal in-person cross-country immersion week hosted at ${primaryPartner.institution} in ${primaryPartner.city || 'the host city'}, ${primaryPartner.country}.`,
        instructions: `### In-Person Field Study & Immersion Week\n\n1. **On-Site Field Visits:** Conduct scheduled community site visits and local institutional interviews.\n2. **Daily Synthesis Workshops:** Meet face-to-face in host seminar rooms to map divergences in regional evidence.\n3. **Hybrid Inclusion:** Non-traveling team members connect via live-streamed briefings and participate in annotated daily field logs.\n4. **Deliverable:** Joint field synthesis matrix and preliminary capstone outline.`,
        contingency: 'Hybrid participation: Live-streamed field briefings and asynchronous annotated field logs preserve full credit for non-traveling students.'
      }) : (isFacultyVisit ? act('act_4', 'Faculty Guest Colloquium & Reciprocal Critique', 'critique', 42, 10, true, primaryPartner.id, buildContributions(
        'Present constructive critique of partner proposals during faculty visit.',
        (ptn) => `Visiting professors from ${ptn.institution} deliver guest lectures and moderate peer dialogue.`
      ), ['act_3'], [o2], { summary: 'Faculty cross-country visit: guest keynote lectures and interactive critique.' }) : act('act_4', 'Reciprocal critique session', 'critique', 42, 10, true, 'ptn_home', buildContributions(
        'Present constructive critique of partner proposals.',
        (ptn) => `Test partner feasibility against local socio-economic constraints at ${ptn.institution}.`
      ), ['act_3'], [o2], { summary: 'Live and asynchronous peer critique testing ideas.' })),
      act('act_5', 'Joint co-creation of strategic policy brief', 'cocreate', 54, 18, false, 'ptn_home', buildContributions(
        'Draft policy synthesis, international benchmarking, and governance models.',
        (ptn) => `Draft community implementation protocols and localization safeguards for ${ptn.country || 'partner region'}.`
      ), ['act_4'], [o1, o3], { summary: 'Co-authoring a comprehensive final capstone artifact.' }),
      act('act_6', 'Individual learning reflection & institutional review', 'reflect', 74, 10, false, primaryPartner.id, buildContributions(
        'Submit individual reflective learning memo.',
        (ptn) => `Submit individual reflective learning memo and local course feedback at ${ptn.institution}.`
      ), ['act_5'], [o2], { summary: 'Reflecting on what shifted in student thinking.' })
    ];
  }

  // Assessments
  p.assessments = [
    {
      id: 'asm_1',
      title: 'Collaborative Synthesis & Case Deliverable',
      layer: 'product',
      outcomes: [o1, o3],
      activityId: mode === 'module' ? 'act_4' : 'act_5',
      due: fmtYmd(addDays(nowD, mode === 'module' ? 48 : 72)),
      criteria: [
        {
          id: 'cr_1',
          name: 'Integration of Evidence from Both Contexts',
          description: 'Draws upon, balances, and fairly represents evidence and perspectives from both partner cohorts.',
          levels: {
            exemplary: 'Skillfully synthesizes situated evidence from both regions, addressing nuances and acknowledging data limitations.',
            proficient: 'Draws accurately on evidence from both contexts to support conclusions.',
            developing: 'Relies predominantly on home context with superficial partner integration.',
            beginning: 'Partner evidence is omitted or inaccurate.'
          }
        },
        {
          id: 'cr_2',
          name: 'Constructive Handling of Disagreements',
          description: 'Represents contested points, differing priorities, and trade-offs honestly without forcing artificial consensus.',
          levels: {
            exemplary: 'Clearly maps points of legitimate disagreement and explains underlying cultural/institutional rationales.',
            proficient: 'Identifies key differences in perspective accurately.',
            developing: 'Appears to paper over real differences with vague compromises.',
            beginning: 'Ignores partner objections or forces one-sided conclusions.'
          }
        }
      ],
      local: Object.fromEntries(allPartners.map(ptn => [ptn.id, { weight: Math.round(100 / allPartners.length), notes: ptn.isAiPartner ? (ptn.persona ? ptn.persona.assessmentObligations : 'Evaluated with departmental rubric') : 'Evaluated locally with departmental rubric' }])),
      status: 'draft',
      updatedAt: ago(2),
      updatedBy: primaryPartner.id
    },
    {
      id: 'asm_2',
      title: 'Individual Before-and-After Learning Reflection',
      layer: 'individual',
      outcomes: [o2],
      activityId: mode === 'module' ? 'act_4' : 'act_6',
      due: fmtYmd(addDays(nowD, mode === 'module' ? 52 : 80)),
      criteria: [
        {
          id: 'cr_3',
          name: 'Critical Self-Awareness of Contextual Assumptions',
          description: 'Articulates how the student’s domestic context shaped initial beliefs and how engagement revised them.',
          levels: {
            exemplary: 'Provides concrete examples of prior assumptions revised after engaging with international partner evidence.',
            proficient: 'Identifies at least two domestic assumptions and explains partner influence.',
            developing: 'Superficial reflections without evidence of shifted perspectives.',
            beginning: 'Purely descriptive summary without personal reflection.'
          }
        }
      ],
      local: Object.fromEntries(allPartners.map(ptn => [ptn.id, { weight: Math.round(100 / (allPartners.length * 2)), notes: 'Individual reflection memo' }])),
      status: 'draft',
      updatedAt: ago(2),
      updatedBy: homePartner.id
    }
  ];

  // Differences (initialized clean for interactive co-design)
  p.differences = [];

  // Common Ground (initialized clean for interactive co-design)
  p.commonGround = [];

  // Decisions (initialized clean for interactive co-design)
  p.decisions = [];

  // Comments (initialized clean)
  p.comments = [];

  // Meetings (initialized clean)
  p.meetings = [];

  // Glossary
  p.glossary = (topic.glossary || []).map((g, gi) => ({
    id: `gls_${gi + 1}`,
    term: g.term,
    definitions: g.defs,
    note: g.note || '',
    updatedAt: S.now()
  }));

  // Proposals (initialized clean, ready for on-demand AI assistance)
  p.proposals = [];

  // Activity events
  p.events = [
    { id: 'ev_1', at: S.now(), by: homePartner.id, type: 'create', summary: `Consortium co-design workspace initialized for "${topic.title}" with ${allPartners.length} universities` }
  ];

  return p;
}

// Backwards-compatible alias for existing imports
export function demoProject(opts = {}) {
  return createAiPartnerDemo(opts);
}
