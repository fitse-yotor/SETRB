/* ------------------------------------------------------------------
   Default website content (news, tenders, vacancies, contact messages).
   SAMPLE CONTENT: replace through the admin "Website content" pages.
   Text fields are {en, am}; Amharic falls back to English when empty.
   ------------------------------------------------------------------ */
const img = n => `assets/img/news/${n}.jpg`;

export const SEED_NEWS = [
  {
    id: 'n-101', date: '2026-11-20', tag: 'blue', img: img('road-inspection'), published: true,
    cat: { en: 'Projects', am: 'ፕሮጀክቶች' },
    title: { en: 'Bureau leadership inspects ongoing road projects across the region', am: 'የቢሮው አመራር በክልሉ በመካሄድ ላይ ያሉ የመንገድ ፕሮጀክቶችን ጎበኘ' },
    summary: { en: 'The field visit reviewed physical progress, quality and contractor performance, and set deadlines for resolving outstanding issues.', am: 'ጉብኝቱ የፕሮጀክቶቹን የአፈፃፀም ደረጃ፣ ጥራትና የተቋራጮችን አፈፃፀም የገመገመ ሲሆን ለችግሮች የመፍትሔ የጊዜ ገደብ ተቀምጧል።' },
    body: {
      en: 'The Bureau Head, together with directors and zone engineers, visited road projects under construction to assess progress on the ground.\n\nDuring the visit the team compared reported physical progress with the work on site, checked material quality and discussed the challenges raised by contractors and supervising consultants.\n\nContractors that are behind schedule were instructed to submit recovery plans, and the zone offices were asked to resolve right-of-way and utility relocation issues within the agreed time.\n\nThe Bureau will continue regular field visits so that every project is delivered on time, within budget and to the required quality.',
      am: 'የቢሮ ኃላፊው ከዳይሬክተሮችና ከዞን መሐንዲሶች ጋር በመሆን በግንባታ ላይ ያሉ የመንገድ ፕሮጀክቶችን በመስክ ጎብኝተዋል።\n\nበጉብኝቱ ወቅት ሪፖርት የተደረገው አፈፃፀም በመስክ ካለው ሥራ ጋር ተነጻጽሯል፤ የግብዓት ጥራትና ተቋራጮችና አማካሪዎች ያነሷቸው ችግሮች ተገምግመዋል።\n\nከዕቅድ ወደ ኋላ የቀሩ ተቋራጮች የማካካሻ ዕቅድ እንዲያቀርቡ፣ የዞን መምሪያዎችም የወሰን ማስከበርና የመሠረተ ልማት ማዛወር ችግሮችን በተቀመጠው ጊዜ እንዲፈቱ አቅጣጫ ተሰጥቷል።'
    }
  },
  {
    id: 'n-102', date: '2026-11-14', tag: 'blue', img: img('bridge-site-visit'), published: true,
    cat: { en: 'Bridges', am: 'ድልድዮች' },
    title: { en: 'Bureau team reviews bridge construction progress on site', am: 'የቢሮው ቡድን የድልድይ ግንባታ ሂደትን በቦታው ገመገመ' },
    summary: { en: 'Engineers checked foundation and substructure works and agreed on measures to finish before the rainy season.', am: 'መሐንዲሶቹ የመሠረትና የታችኛው መዋቅር ሥራዎችን ገምግመው ከክረምት በፊት ለማጠናቀቅ የሚያስችሉ እርምጃዎች ላይ ተስማምተዋል።' },
    body: {
      en: 'A team from the Bureau visited a bridge construction site to follow up on foundation and substructure works.\n\nThe team reviewed the quality of reinforcement and concrete works, the safety of workers on site and the protection of the river banks during construction.\n\nThe contractor and the supervising consultant agreed on an accelerated work plan so that the main structural works are completed before the rainy season.',
      am: 'የቢሮው ቡድን የመሠረትና የታችኛው መዋቅር ሥራዎችን ለመከታተል የድልድይ ግንባታ ቦታን ጎብኝቷል።\n\nቡድኑ የብረትና የኮንክሪት ሥራዎችን ጥራት፣ የሠራተኞችን ደህንነትና የወንዙን ዳርቻ ጥበቃ ገምግሟል።'
    }
  },
  {
    id: 'n-103', date: '2026-11-08', tag: 'green', img: img('project-inauguration'), published: true,
    cat: { en: 'Inauguration', am: 'ምረቃ' },
    title: { en: 'Completed rural road officially inaugurated', am: 'የተጠናቀቀ የገጠር መንገድ በይፋ ተመረቀ' },
    summary: { en: 'The new all-weather road connects rural kebeles to markets, schools and health centres throughout the year.', am: 'አዲሱ መንገድ የገጠር ቀበሌዎችን ዓመቱን ሙሉ ከገበያ፣ ከትምህርት ቤትና ከጤና ተቋማት ጋር ያገናኛል።' },
    body: {
      en: 'A newly completed all-weather rural road was officially inaugurated in the presence of regional and zone officials, elders and residents.\n\nThe road gives rural communities year-round access to markets, schools and health centres, and shortens travel time for farmers bringing produce to town.\n\nSpeaking at the ceremony, officials thanked the community for its participation and urged residents to protect the road and its drainage structures.',
      am: 'አዲስ የተጠናቀቀ የገጠር መንገድ የክልልና የዞን ኃላፊዎች፣ የአገር ሽማግሌዎችና ነዋሪዎች በተገኙበት በይፋ ተመርቋል።\n\nመንገዱ ማኅበረሰቡን ዓመቱን ሙሉ ከገበያ፣ ከትምህርት ቤትና ከጤና ተቋማት ጋር ያገናኛል።'
    }
  },
  {
    id: 'n-104', date: '2026-11-02', tag: 'red', img: img('head-field-visit'), published: true,
    cat: { en: 'Community', am: 'ማኅበረሰብ' },
    title: { en: 'Bureau Head discusses road needs with local communities', am: 'የቢሮ ኃላፊው ከአካባቢው ማኅበረሰብ ጋር በመንገድ ፍላጎቶች ላይ ተወያዩ' },
    summary: { en: 'Residents raised priorities for new links and maintenance, which will feed into next year\'s plan.', am: 'ነዋሪዎች ለአዲስ መንገዶችና ለጥገና ቅድሚያ የሚሰጣቸውን ጉዳዮች አንስተዋል፤ እነዚህም በቀጣይ ዓመት ዕቅድ ውስጥ ይካተታሉ።' },
    body: {
      en: 'The Bureau Head held a public discussion with residents, community leaders and woreda officials on the road and transport needs of the area.\n\nResidents raised the need for new rural links, maintenance of damaged sections and better public transport services.\n\nThe Bureau Head explained the regional road development plan and assured residents that their priorities will be considered in the coming fiscal year\'s plan.',
      am: 'የቢሮ ኃላፊው ከነዋሪዎች፣ ከማኅበረሰብ መሪዎችና ከወረዳ ኃላፊዎች ጋር በአካባቢው የመንገድና የትራንስፖርት ፍላጎቶች ላይ ውይይት አድርገዋል።'
    }
  },
  {
    id: 'n-105', date: '2026-10-27', tag: 'green', img: img('road-consultation'), published: true,
    cat: { en: 'Capacity building', am: 'አቅም ግንባታ' },
    title: { en: 'Zone and woreda engineers trained on digital progress reporting', am: 'የዞንና የወረዳ መሐንዲሶች በዲጂታል የሪፖርት ሥርዓት ሰለጠኑ' },
    summary: { en: 'The new system lets offices submit monthly reports with site photos and follow approvals online.', am: 'አዲሱ ሥርዓት ጽ/ቤቶች ወርሃዊ ሪፖርትን ከፎቶ ጋር እንዲያቀርቡና የማጽደቅ ሂደቱን በኦንላይን እንዲከታተሉ ያስችላል።' },
    body: {
      en: 'Engineers from zone and woreda transport offices completed training on the Bureau\'s new project monitoring and reporting system.\n\nWith the system, offices submit monthly progress reports with geotagged site photos, and reports move from the consultant to the zone office and the Bureau for approval online.\n\nThe Bureau expects the system to make progress data more reliable and to shorten the time needed to identify delayed projects.',
      am: 'ከዞንና ከወረዳ ትራንስፖርት ጽ/ቤቶች የተውጣጡ መሐንዲሶች በአዲሱ የፕሮጀክት ክትትልና ሪፖርት ሥርዓት ላይ ስልጠና ወስደዋል።'
    }
  }
];

export const SEED_TENDERS = [
  {
    id: 't-301', ref: 'SETRB/NCB/W-012/2019', type: 'Works', method: 'Open national competitive bidding', published: '2026-11-18', closing: '2026-12-12T10:00', opening: '2026-12-12T10:30',
    bidFee: 'ETB 500 (non-refundable)', bidSecurity: 'ETB 250,000', location: 'Gamo Zone', active: true,
    title: { en: 'Construction of gravel road – Lot 3', am: 'የጠጠር መንገድ ግንባታ – ሎት 3' },
    description: { en: 'The Bureau invites eligible contractors to submit sealed bids for the construction of a 24 km gravel road, including earthworks, sub-base, gravel wearing course, culverts and road furniture.', am: 'ቢሮው ብቁ ተቋራጮች 24 ኪ.ሜ የጠጠር መንገድ ግንባታ የታሸገ የጨረታ ሰነድ እንዲያቀርቡ ይጋብዛል።' },
    eligibility: ['Valid trade licence renewed for the current fiscal year', 'Grade GC/RC-3 or above contractor registration', 'VAT and TIN registration certificates', 'Tax clearance certificate', 'Registration on the national e-GP supplier list'],
    submission: 'Bid documents can be obtained from the Bureau procurement office upon payment of the bid fee. Sealed bids must be delivered to the procurement office before the closing date and time. Bids will be opened in the presence of bidders who choose to attend.',
    documents: ['Invitation to bid', 'Bill of quantities', 'Technical specifications']
  },
  {
    id: 't-302', ref: 'SETRB/RB/G-007/2019', type: 'Goods', method: 'Restricted bidding', published: '2026-11-15', closing: '2026-12-05T10:00', opening: '2026-12-05T10:30',
    bidFee: 'ETB 300 (non-refundable)', bidSecurity: 'ETB 100,000', location: 'Bureau head office', active: true,
    title: { en: 'Supply of road maintenance equipment', am: 'የመንገድ ጥገና መሳሪያዎች ግዢ' },
    description: { en: 'Supply and delivery of road maintenance equipment including a motor grader, vibratory roller and water truck for the regional road maintenance unit.', am: 'ለክልሉ የመንገድ ጥገና ክፍል የሞተር ግሬደር፣ ሮለርና የውሃ መኪና አቅርቦት።' },
    eligibility: ['Valid trade licence in the relevant category', 'VAT and TIN registration certificates', 'Manufacturer authorisation letter', 'After-sales service capacity in the region'],
    submission: 'Invited suppliers should submit separate technical and financial offers in sealed envelopes to the procurement office.',
    documents: ['Invitation letter', 'Schedule of requirements', 'Technical specifications']
  },
  {
    id: 't-303', ref: 'SETRB/RFP/C-004/2019', type: 'Consultancy', method: 'Request for proposals', published: '2026-11-10', closing: '2026-11-30T10:00', opening: '2026-11-30T14:00',
    bidFee: 'Free of charge', bidSecurity: 'Not required', location: 'Region-wide', active: true,
    title: { en: 'Consultancy services: design review of regional bridges', am: 'የአማካሪ አገልግሎት፡ የክልል ድልድዮች ዲዛይን ግምገማ' },
    description: { en: 'Consultancy services for the review of designs and the preparation of tender documents for six regional bridges.', am: 'ለስድስት የክልል ድልድዮች የዲዛይን ግምገማና የጨረታ ሰነድ ዝግጅት የአማካሪ አገልግሎት።' },
    eligibility: ['Registered consulting firm, category Civil Engineering', 'At least five similar assignments in the last ten years', 'Key staff: bridge engineer, hydrologist, geotechnical engineer'],
    submission: 'Proposals (technical and financial, in separate envelopes) must be submitted to the procurement office before the deadline.',
    documents: ['Request for proposals', 'Terms of reference']
  },
  {
    id: 't-304', ref: 'SETRB/NCB/W-009/2019', type: 'Works', method: 'Open national competitive bidding', published: '2026-10-20', closing: '2026-11-10T10:00', opening: '2026-11-10T10:30',
    bidFee: 'ETB 500 (non-refundable)', bidSecurity: 'ETB 200,000', location: 'Gedeo Zone', active: true,
    title: { en: 'Rehabilitation of town access roads', am: 'የከተማ መዳረሻ መንገዶች ጥገና' },
    description: { en: 'Rehabilitation of 9 km of town access roads including drainage improvement and asphalt overlay.', am: 'የ9 ኪ.ሜ የከተማ መዳረሻ መንገዶች ጥገና።' },
    eligibility: ['Valid trade licence', 'Grade GC/RC-4 or above', 'Tax clearance certificate'],
    submission: 'This tender is closed. Evaluation is in progress.',
    documents: ['Invitation to bid']
  }
];

export const SEED_VACANCIES = [
  {
    id: 'v-501', dept: 'Road Construction Directorate', location: 'Bureau head office', positions: 2, employment: 'Permanent', grade: 'Professional Science XI', salary: 'As per the civil service scale',
    deadline: '2026-12-10', active: true,
    title: { en: 'Civil Engineer (Highway)', am: 'ሲቪል መሐንዲስ (ሀይዌይ)' },
    summary: { en: 'Supervise road construction projects and review monthly progress reports from zones and contractors.', am: 'የመንገድ ግንባታ ፕሮጀክቶችን መቆጣጠርና ወርሃዊ ሪፖርቶችን መገምገም።' },
    duties: ['Follow up road construction and rehabilitation projects in assigned zones', 'Review and verify monthly progress reports and payment certificates', 'Conduct site inspections and quality checks', 'Prepare technical reports for management'],
    qualifications: ['BSc in Civil Engineering or Highway Engineering', 'Registration with the Ethiopian Construction Authority is an advantage', 'Good command of AutoCAD and MS Office'],
    experience: '4 years of relevant experience for BSc holders, 2 years for MSc holders',
    howToApply: 'Applicants should submit a cover letter, CV and copies of credentials (originals to be presented during exam) to the Bureau Human Resource Office within the application period.'
  },
  {
    id: 'v-502', dept: 'Contract Administration Directorate', location: 'Bureau head office', positions: 1, employment: 'Permanent', grade: 'Professional Science X', salary: 'As per the civil service scale',
    deadline: '2026-12-05', active: true,
    title: { en: 'Quantity Surveyor', am: 'ኳንቲቲ ሰርቬየር' },
    summary: { en: 'Prepare bills of quantities, verify measured works and support contract administration.', am: 'የሥራ መጠን ዝርዝር ማዘጋጀትና የተለኩ ሥራዎችን ማረጋገጥ።' },
    duties: ['Prepare bills of quantities and cost estimates', 'Verify quantities in interim payment certificates', 'Assess variation orders and claims'],
    qualifications: ['BSc in Construction Technology and Management, Civil Engineering or Quantity Surveying'],
    experience: '3 years of relevant experience',
    howToApply: 'Submit application documents in person to the Bureau Human Resource Office.'
  },
  {
    id: 'v-503', dept: 'Transport Planning Directorate', location: 'Bureau head office', positions: 1, employment: 'Contract (1 year)', grade: 'Professional Science XII', salary: 'Negotiable',
    deadline: '2026-11-20', active: true,
    title: { en: 'Transport Planning Expert', am: 'የትራንስፖርት ዕቅድ ባለሙያ' },
    summary: { en: 'Plan public transport routes and tariffs and analyse transport demand in the region.', am: 'የሕዝብ ትራንስፖርት መስመሮችንና ታሪፎችን ማቀድና የትራንስፖርት ፍላጎትን መተንተን።' },
    duties: ['Analyse passenger and freight transport demand', 'Propose public transport routes and tariffs', 'Coordinate with zone transport offices'],
    qualifications: ['MSc or BSc in Transport Engineering, Urban Planning or related field'],
    experience: '5 years of relevant experience',
    howToApply: 'This vacancy is closed.'
  }
];

export const SEED_MESSAGES = [
  { id: 'm-1', at: '2026-11-24T09:12:00', name: 'Hana G.', email: 'hana@example.com', phone: '0911 000 010', subject: 'Tender', message: 'Where can we buy the bid document for the gravel road Lot 3 tender? Can it be collected at the zone office?', read: false },
  { id: 'm-2', at: '2026-11-22T15:40:00', name: 'Yonas A.', email: 'yonas@example.com', phone: '', subject: 'Vacancy', message: 'I would like to know if the Civil Engineer vacancy accepts applicants with an MSc in Structural Engineering.', read: true }
];
