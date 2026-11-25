/* ------------------------------------------------------------------
   SAMPLE CONTENT — replace with real items from the Bureau's Facebook
   page / monitoring system. Images live in assets/img/news/; drop real
   photos there (e.g. news-1.jpg) and update the `img` paths below.
   ------------------------------------------------------------------ */
window.PORTAL_DATA = {
  projects: [
    { name:{en:"Sodo – Humbo Asphalt Road Upgrading",am:"የሶዶ – ሁምቦ የአስፋልት መንገድ ማሻሻያ"}, zone:{en:"Wolaita Zone",am:"ወላይታ ዞን"}, km:34, type:{en:"Asphalt",am:"አስፋልት"}, status:"on-track", physical:72, financial:65, contractor:"Contractor A", end:"Jun 2027", img:"assets/img/news/asphalt.svg" },
    { name:{en:"Arba Minch – Chencha Road Rehabilitation",am:"የአርባ ምንጭ – ጨንቻ መንገድ ጥገና"}, zone:{en:"Gamo Zone",am:"ጋሞ ዞን"}, km:28, type:{en:"Rehabilitation",am:"ጥገና"}, status:"at-risk", physical:48, financial:55, contractor:"Contractor B", end:"Dec 2026", img:"assets/img/news/road-construction.svg" },
    { name:{en:"Sawla Bridge Construction",am:"የሳውላ ድልድይ ግንባታ"}, zone:{en:"Gofa Zone",am:"ጎፋ ዞን"}, km:0.12, type:{en:"Bridge",am:"ድልድይ"}, status:"on-track", physical:81, financial:76, contractor:"Contractor C", end:"Mar 2027", img:"assets/img/news/bridge.svg" },
    { name:{en:"Jinka – Key Afer Gravel Road",am:"የጂንካ – ቀይ አፈር የጠጠር መንገድ"}, zone:{en:"South Omo Zone",am:"ደቡብ ኦሞ ዞን"}, km:41, type:{en:"Gravel",am:"ጠጠር"}, status:"delayed", physical:31, financial:44, contractor:"Contractor D", end:"Aug 2026", img:"assets/img/news/road-construction.svg" },
    { name:{en:"Dilla Town Access Roads",am:"የዲላ ከተማ መዳረሻ መንገዶች"}, zone:{en:"Gedeo Zone",am:"ጌዴኦ ዞን"}, km:12, type:{en:"Asphalt",am:"አስፋልት"}, status:"done", physical:100, financial:98, contractor:"Contractor E", end:"Completed", img:"assets/img/news/asphalt.svg" },
    { name:{en:"Karat – Konso Rural Road Network",am:"የካራት – ኮንሶ የገጠር መንገድ"}, zone:{en:"Konso Zone",am:"ኮንሶ ዞን"}, km:22, type:{en:"Rural road",am:"የገጠር መንገድ"}, status:"on-track", physical:58, financial:52, contractor:"Contractor F", end:"Feb 2027", img:"assets/img/news/road-safety.svg" }
  ],
  news: [
    { tag:"blue", cat:{en:"Projects",am:"ፕሮጀክቶች"}, date:"Nov 20, 2026", img:"assets/img/news/road-construction.svg",
      title:{en:"Bureau leadership inspects ongoing road projects across the region",am:"የቢሮው አመራር በክልሉ በመካሄድ ላይ ያሉ የመንገድ ፕሮጀክቶችን ጎበኘ"},
      text:{en:"The field visit reviewed physical progress, quality and contractor performance, and set deadlines for resolving outstanding issues.",am:"ጉብኝቱ የፕሮጀክቶቹን የአፈፃፀም ደረጃ፣ ጥራትና የተቋራጮችን አፈፃፀም የገመገመ ሲሆን ለችግሮች የመፍትሔ የጊዜ ገደብ ተቀምጧል።"} },
    { tag:"green", cat:{en:"Planning",am:"ዕቅድ"}, date:"Nov 14, 2026", img:"assets/img/news/meeting.svg",
      title:{en:"Quarterly performance review held with zone transport offices",am:"ከዞን ትራንስፖርት መምሪያዎች ጋር የሩብ ዓመት አፈፃፀም ግምገማ ተካሄደ"} },
    { tag:"red", cat:{en:"Road Safety",am:"የመንገድ ደህንነት"}, date:"Nov 08, 2026", img:"assets/img/news/road-safety.svg",
      title:{en:"Regional road safety awareness campaign launched",am:"ክልላዊ የመንገድ ደህንነት ግንዛቤ ማስጨበጫ ዘመቻ ተጀመረ"} },
    { tag:"blue", cat:{en:"Transport",am:"ትራንስፖርት"}, date:"Nov 02, 2026", img:"assets/img/news/public-transport.svg",
      title:{en:"New public transport routes and fare tariffs announced",am:"አዲስ የሕዝብ ትራንስፖርት መስመሮችና ታሪፍ ይፋ ሆነ"} }
  ],
  tenders: [
    { d:"28", m:"Nov", title:{en:"Construction of gravel road – Lot 3",am:"የጠጠር መንገድ ግንባታ – ሎት 3"}, sub:{en:"Open national bidding · Closes Dec 12",am:"ግልፅ አገር አቀፍ ጨረታ · ታህሳስ 3 ይዘጋል"} },
    { d:"21", m:"Nov", title:{en:"Supply of road maintenance equipment",am:"የመንገድ ጥገና መሳሪያዎች ግዢ"}, sub:{en:"Restricted bidding · Closes Dec 05",am:"ውስን ጨረታ · ኅዳር 26 ይዘጋል"} },
    { d:"15", m:"Nov", title:{en:"Consultancy: design review of regional bridges",am:"የአማካሪ አገልግሎት፡ የድልድዮች ዲዛይን ግምገማ"}, sub:{en:"Request for proposal · Closes Nov 30",am:"የፕሮፖዛል ጥሪ · ኅዳር 21 ይዘጋል"} }
  ],
  announcements: [
    { d:"24", m:"Nov", title:{en:"Freight operator licence renewal period is open",am:"የጭነት ኦፕሬተሮች የፈቃድ እድሳት ጊዜ ተከፍቷል"}, sub:{en:"Renew before the end of the fiscal quarter",am:"ከሩብ ዓመቱ መጨረሻ በፊት ያድሱ"} },
    { d:"18", m:"Nov", title:{en:"Contractors: monthly progress reports due on the 25th",am:"ተቋራጮች፡ ወርሃዊ ሪፖርት እስከ 25 ድረስ ያስገቡ"}, sub:{en:"Submit through the project monitoring system",am:"በፕሮጀክት ክትትል ሲስተም በኩል ያስገቡ"} },
    { d:"10", m:"Nov", title:{en:"Vacancy: civil engineers and surveyors",am:"የሥራ ማስታወቂያ፡ ሲቪል መሐንዲሶችና ቀያሾች"}, sub:{en:"See full requirements in the document",am:"ዝርዝር መስፈርቱን ሰነዱ ላይ ይመልከቱ"} }
  ]
};
