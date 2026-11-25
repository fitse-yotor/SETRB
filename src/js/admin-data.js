/* ------------------------------------------------------------------
   SAMPLE DATA for the monitoring dashboard.
   In production this file is replaced by API calls, e.g.
     GET  /api/projects            GET  /api/reports?status=pending
     POST /api/reports             POST /api/reports/:id/approve | /return
   Everything below is generated demo data — not real bureau figures.
   ------------------------------------------------------------------ */
(function () {
  // Ethiopian fiscal year runs Hamle → Sene (July → June)
  const MONTHS = ['Hamle','Nehase','Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene'];
  const MONTHS_AM = ['ሐምሌ','ነሐሴ','መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት','መጋቢት','ሚያዝያ','ግንቦት','ሰኔ'];
  const CUR = 4;          // current reporting month index (Hidar)
  const FY = '2019 E.C.';

  const ROAD_ITEMS = [['Earthworks',20],['Sub-base',15],['Base course',15],['Surfacing',25],['Drainage & culverts',15],['Road furniture & safety',5],['Miscellaneous',5]];
  const BRIDGE_ITEMS = [['Foundations & piling',25],['Substructure',25],['Superstructure',30],['Approach roads',15],['Miscellaneous',5]];

  // name, zone, type, fund, contractor, consultant, value (M ETB), km, start-of-FY %, FY target %, performance factor, end date
  const RAW = [
    ['Sodo – Humbo Asphalt Road Upgrading','Wolaita','Asphalt','Regional budget','Contractor A','Consultant 1',612,34,38,90,1.02,'Ginbot 2019'],
    ['Arba Minch – Chencha Road Rehabilitation','Gamo','Rehabilitation','Road Fund','Contractor B','Consultant 2',284,28,30,80,.74,'Tahsas 2019'],
    ['Sawla Bridge Construction','Gofa','Bridge','Federal (URRAP)','Contractor C','Consultant 1',96,0.12,55,100,1.05,'Megabit 2019'],
    ['Jinka – Key Afer Gravel Road','South Omo','Gravel','Federal (URRAP)','Contractor D','Consultant 3',158,41,18,70,.3,'Nehase 2019'],
    ['Dilla Town Access Roads','Gedeo','Asphalt','Regional budget','Contractor E','Consultant 2',140,12,96,100,1,'Completed'],
    ['Karat – Konso Rural Road Network','Konso','Rural road','Federal (URRAP)','Contractor F','Consultant 3',122,22,25,75,.97,'Yekatit 2019'],
    ['Boditi – Areka Road Upgrading','Wolaita','Asphalt','Regional budget','Contractor B','Consultant 1',438,26,12,55,.68,'Sene 2020'],
    ['Burji – Soyama Gravel Road','Burji','Gravel','Road Fund','Contractor G','Consultant 4',88,19,40,95,1.08,'Megabit 2019'],
    ['Kemba – Sawla Road Rehabilitation','Gofa','Rehabilitation','Road Fund','Contractor D','Consultant 3',176,31,22,72,.42,'Ginbot 2019'],
    ['Gidole – Gato River Bridge','Konso','Bridge','Federal (URRAP)','Contractor C','Consultant 4',64,0.08,10,65,.92,'Tir 2020'],
    ['Yirgachefe – Chelelektu Asphalt Road','Gedeo','Asphalt','Regional budget','Contractor A','Consultant 2',356,18,48,92,.98,'Miyazya 2019'],
    ['Turmi – Dimeka Rural Road','South Omo','Rural road','Federal (URRAP)','Contractor H','Consultant 3',74,27,5,50,.6,'Tir 2020'],
    ['Ale Zone Woreda Link Roads','Ale','Rural road','Federal (URRAP)','Contractor G','Consultant 4',58,24,15,70,1.1,'Ginbot 2019'],
    ['Arba Minch – Kemba Road Maintenance','Gamo','Rehabilitation','Road Fund','Contractor H','Consultant 2',92,38,35,85,.9,'Megabit 2019']
  ];

  const shape = x => x * x * (3 - 2 * x); // smooth S-curve 0..1
  const r1 = v => Math.round(v * 10) / 10;

  const projects = RAW.map((r, i) => {
    const [name, zone, type, fund, contractor, consultant, value, km, s0, target, perf, end] = r;
    const plan = MONTHS.map((_, m) => r1(s0 + (target - s0) * shape((m + 1) / 12)));
    const actual = MONTHS.slice(0, CUR + 1).map((_, m) => r1(Math.min(100, s0 + (plan[m] - s0) * perf)));
    const items = type === 'Bridge' ? BRIDGE_ITEMS : ROAD_ITEMS;
    return {
      id: 'P-' + String(101 + i), name, zone, type, fund, contractor, consultant,
      value, km, end, plan, actual,
      items: items.map(([n, w]) => ({ name: n, weight: w })),
      finLag: [-6, 7, -4, 12, -2, -5, 3, -8, 9, 4, -3, 2, -6, 1][i],
      lat: (5.6 + (i * 0.37) % 2.4).toFixed(4), lng: (36.4 + (i * 0.53) % 2.1).toFixed(4)
    };
  });

  // woreda responsible for each project (same order as RAW)
  ['Humbo','Chencha','Demba Gofa','Debub Ari','Dilla Zuria','Kena','Damot Gale','Soyama','Geze Gofa','Segen Zuria','Kochere','Hamer','Kolango','Bonke']
    .forEach((w, i) => { projects[i].woreda = w; });

  // Hidar (current month) report statuses per project
  const HIDAR = ['pending:1','pending:2','approved','returned:1','approved','pending:0','pending:3','approved','pending:1','pending:2','approved','returned:0','approved','pending:0'];
  const PHOTOS = ['road-inspection','bridge-site-visit','road-consultation','project-inauguration'];
  const DAYS = ['Hidar 22','Hidar 21','Hidar 20','Hidar 19','Hidar 18','Hidar 16','Hidar 15','Hidar 14','Hidar 12','Hidar 11'];

  const reports = [];
  let seq = 1;
  projects.forEach((p, i) => {
    for (let m = 0; m <= CUR; m++) {
      if (m < CUR - 1) continue; // keep last two months per project for the demo
      const cum = p.actual[m], prev = m ? p.actual[m - 1] : cum - 3;
      let status = 'approved', stage = 4;
      if (m === CUR) {
        const [st, sg] = HIDAR[i].split(':');
        status = st; stage = st === 'approved' ? 4 : st === 'returned' ? 0 : Math.max(1, +sg);
      }
      const items = p.items.map((it, k) => {
        // spread cumulative progress across items: early items ahead, later items behind
        const bias = 1.5 - k / (p.items.length - 1);
        const now = Math.max(0, Math.min(100, r1(cum * bias)));
        const was = Math.max(0, Math.min(now, r1(prev * bias)));
        return { name: it.name, weight: it.weight, prev: was, now };
      });
      reports.push({
        id: 'MR-' + String(2000 + seq++),
        projectId: p.id,
        month: m,
        physThis: r1(cum - prev),
        physCum: cum,
        finCum: Math.max(0, Math.min(100, r1(cum + p.finLag))),
        certified: Math.round(p.value * Math.max(0, cum - prev + p.finLag / 8) / 100 * 1e6),
        status, stage,
        submitted: m === CUR ? DAYS[i % DAYS.length] : 'Tikimt ' + (20 + (i % 9)),
        submittedBy: p.contractor,
        weather: ['Dry · 24 working days','Rain · 17 working days','Mixed · 21 working days'][i % 3],
        equipment: 6 + (i * 3) % 14, labour: 40 + (i * 17) % 120,
        items,
        narrative: m === CUR && status === 'returned'
          ? 'Progress quantities for surfacing not supported by measurement sheets.'
          : 'Works progressing on the main alignment. Material delivery and equipment availability as per plan.',
        photos: [PHOTOS[i % 4], PHOTOS[(i + 1) % 4], PHOTOS[(i + 2) % 4]],
        comments: m === CUR && status === 'returned'
          ? [{ by: 'Zone engineer', text: 'Please attach measurement sheets for the claimed surfacing quantities and resubmit.', at: 'Hidar 20' }]
          : []
      });
    }
  });

  const issues = [
    { id:'IS-31', projectId:'P-104', title:'Right-of-way compensation unpaid for 6 km section', cat:'Right of way', sev:'high', owner:'Zone administration', due:'Tahsas 05', status:'open' },
    { id:'IS-30', projectId:'P-102', title:'Asphalt plant breakdown — surfacing halted', cat:'Equipment', sev:'high', owner:'Contractor B', due:'Hidar 30', status:'open' },
    { id:'IS-29', projectId:'P-109', title:'Cement shortage delaying culvert works', cat:'Materials', sev:'medium', owner:'Contractor D', due:'Tahsas 10', status:'open' },
    { id:'IS-28', projectId:'P-107', title:'Design change requested at km 14 junction', cat:'Design', sev:'medium', owner:'Consultant 1', due:'Tahsas 15', status:'open' },
    { id:'IS-27', projectId:'P-112', title:'Utility pole relocation pending (EEU)', cat:'Utilities', sev:'medium', owner:'Bureau – coordination', due:'Tahsas 20', status:'open' },
    { id:'IS-26', projectId:'P-101', title:'Performance bond expires in 30 days', cat:'Contract', sev:'low', owner:'Bureau – contract admin', due:'Tahsas 25', status:'open' },
    { id:'IS-25', projectId:'P-103', title:'River diversion for pier construction', cat:'Technical', sev:'low', owner:'Contractor C', due:'Tikimt 28', status:'resolved' },
    { id:'IS-24', projectId:'P-106', title:'Community complaint on dust near school', cat:'Social / environment', sev:'low', owner:'Contractor F', due:'Tikimt 25', status:'resolved' }
  ];

  window.ADMIN_DATA = { MONTHS, MONTHS_AM, CUR, FY, projects, reports, issues };
})();
