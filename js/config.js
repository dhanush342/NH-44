/* ══════════ Game Configuration ══════════ */
export const INDIA_LOCATIONS = [
  {name:'SRINAGAR',state:'J&K',famous:'Dal Lake · Mughal Gardens',km:0},
  {name:'JAMMU',state:'J&K',famous:'Vaishno Devi',km:290},
  {name:'PATHANKOT',state:'Punjab',famous:'Gateway to Hills',km:400},
  {name:'JALANDHAR',state:'Punjab',famous:'Sports City',km:520},
  {name:'LUDHIANA',state:'Punjab',famous:'Manchester of India',km:620},
  {name:'AMBALA',state:'Haryana',famous:'Cantonment City',km:800},
  {name:'DELHI NCR',state:'Delhi',famous:'India Gate · Red Fort',km:1000},
  {name:'AGRA',state:'UP',famous:'Taj Mahal',km:1200},
  {name:'GWALIOR',state:'MP',famous:'Gwalior Fort',km:1320},
  {name:'JHANSI',state:'UP',famous:'Rani Lakshmibai Fort',km:1420},
  {name:'NAGPUR',state:'Maharashtra',famous:'Orange City · Zero Mile',km:1950},
  {name:'HYDERABAD',state:'Telangana',famous:'Charminar · Biryani',km:2460},
  {name:'BENGALURU',state:'Karnataka',famous:'Silicon Valley · Lalbagh',km:3000},
  {name:'MYSURU',state:'Karnataka',famous:'Mysore Palace',km:3140},
  {name:'COIMBATORE',state:'Tamil Nadu',famous:'Manchester of South',km:3500},
  {name:'MADURAI',state:'Tamil Nadu',famous:'Meenakshi Temple',km:3660},
  {name:'KANYAKUMARI',state:'Tamil Nadu',famous:'Southern Tip',km:3745}
];

export const BILLBOARD_ADS = [
  ['HORN OK PLEASE','#a3262a','#fff'],
  ['MASALA CHAI','#1c6e8a','#fff'],
  ['IDLI · DOSA','#0b6e4f','#ffd23f'],
  ['BIRYANI HOUSE','#8b4513','#ffd23f'],
  ['TATA MOTORS','#1a3d7c','#fff'],
  ['MAHINDRA SUV','#20304a','#41e0ff'],
  ['RELIANCE FRESH','#e8a020','#1c1c1c'],
  ['JIO FIBER','#1a3d7c','#fff'],
  ['AMUL DAIRY','#0066cc','#fff'],
  ['HALDIRAM','#c8322b','#fff'],
  ['OASIS MOTORS','#0b6e4f','#ffd23f'],
  ['SARATHI TRAVELS','#20304a','#41e0ff'],
  ['KINGFISHER','#1a3d7c','#ffd23f'],
  ['PARLE-G','#c8322b','#fff'],
  ['INDIAN OIL','#a3262a','#fff'],
  ['PATANJALI','#0b6e4f','#fff'],
  ['BAJAJ ALLIANZ','#1a3d7c','#fff'],
  ['MARUTI SUZUKI','#20304a','#fff']
];

export const UPGRADES = [
  {icon:'🔧',name:'ENGINE TUNE',desc:'Top speed +2.2 m/s',max:5,cost:[400,1000,2200,4200,7500]},
  {icon:'⚡',name:'NITRO TANK',desc:'Nitro cap +20 · pickup +6',max:5,cost:[300,800,1800,3600,6500]},
  {icon:'🛞',name:'RACING TIRES',desc:'Steering power +7',max:5,cost:[350,900,2000,3900,7000]},
  {icon:'🛡',name:'ARMOR PLATING',desc:'Start with +1 shield',max:3,cost:[600,2000,5000]},
  {icon:'🧲',name:'COIN MAGNET',desc:'Coin pickup range +0.5',max:4,cost:[500,1500,3500,7000]},
  {icon:'💰',name:'BOUNTY CONTRACT',desc:'Coin earnings +15%',max:5,cost:[800,2500,6000,12000,22000]}
];

export const VEHICLES = [
  {id:0,name:'BLAZE',type:'car',en:'ALL-ROUNDER',color:0xff5a3c,stripe:0xf5efe0,price:0,speed:1.00,handl:1.00,nitro:1.00,armor:0,desc:'Balanced highway coupe'},
  {id:1,name:'BREEZE',type:'car',en:'COASTAL',color:0x2fb9a8,stripe:0xffffff,price:3000,speed:0.94,handl:1.25,nitro:1.00,armor:0,desc:'Nimble coastal build'},
  {id:2,name:'NIGHT OWL',type:'car',en:'SPEED KING',color:0x33406e,stripe:0x41e0ff,price:6000,speed:1.12,handl:0.88,nitro:1.15,armor:0,desc:'Top-speed night beast'},
  {id:3,name:'RHINO',type:'car',en:'ARMORED',color:0xe07030,stripe:0x1c2128,price:10000,speed:0.92,handl:0.95,nitro:0.95,armor:2,desc:'Steel beast · 2 factory shields'},
  {id:4,name:'PHANTOM',type:'car',en:'LEGEND',color:0xe8e6f0,stripe:0xffb03a,price:20000,speed:1.10,handl:1.15,nitro:1.20,armor:1,desc:'Legendary all-rounder'},
  {id:5,name:'ROYAL',type:'bike',en:'CLASSIC 350',color:0x1a1a1a,stripe:0xc0c0c0,price:2500,speed:0.88,handl:1.35,nitro:0.95,armor:0,desc:'Iconic Indian motorcycle'},
  {id:6,name:'BAJAJ',type:'bike',en:'PULSAR NS',color:0xe05040,stripe:0xf2efe4,price:4500,speed:1.05,handl:1.20,nitro:1.10,armor:0,desc:'Sport bike · quick acceleration'},
  {id:7,name:'KTM',type:'bike',en:'DUKE 390',color:0xff8c00,stripe:0x1c1c1c,price:8000,speed:1.18,handl:1.30,nitro:1.05,armor:0,desc:'Aggressive naked sport'},
  {id:8,name:'HARLEY',type:'bike',en:'STREET 750',color:0x1c1c1c,stripe:0xff6600,price:15000,speed:1.00,handl:1.10,nitro:1.25,armor:1,desc:'Deep torque cruiser'},
  {id:9,name:'APACHE',type:'bike',en:'RTR 200',color:0x20304a,stripe:0x41e0ff,price:3500,speed:0.95,handl:1.28,nitro:1.08,armor:0,desc:'TVS racing bike'},
  {id:10,name:'MONSOON GT',type:'car',en:'RAIN RACER',color:0x236b8e,stripe:0x9ee9ff,price:12000,speed:1.08,handl:1.18,nitro:1.12,armor:0,desc:'Wet-road specialist with sharp turn-in'},
  {id:11,name:'DESERT X',type:'car',en:'RALLY CROSS',color:0xd88932,stripe:0x1d2028,price:16000,speed:1.04,handl:1.05,nitro:1.18,armor:1,desc:'Rally build with a reinforced frame'},
  {id:12,name:'STREET 900',type:'bike',en:'NIGHT SPORT',color:0x7d4bd8,stripe:0x41e0ff,price:12000,speed:1.16,handl:1.34,nitro:1.14,armor:0,desc:'High-rev street machine for clean lines'},
  {id:13,name:'APEX 600',type:'bike',en:'TRACK SPEC',color:0xd9d9df,stripe:0xff5040,price:18000,speed:1.22,handl:1.22,nitro:1.10,armor:0,desc:'Lightweight track bike built for top speed'}
];

export const ACHIEVEMENTS = [
  {id:0,name:'FIRST RIDE',desc:'Complete 1 run',get:d=>d.st.runs,goal:1,rw:200},
  {id:1,name:'ROAD TRIP',desc:'Drive 10 km total',get:d=>d.st.dist,goal:10000,div:1000,unit:'km',rw:300},
  {id:2,name:'HIGHWAY VETERAN',desc:'Drive 50 km total',get:d=>d.st.dist,goal:50000,div:1000,unit:'km',rw:800},
  {id:3,name:'GLOBETROTTER',desc:'Drive 200 km total',get:d=>d.st.dist,goal:200000,div:1000,unit:'km',rw:2000},
  {id:4,name:'COIN COLLECTOR',desc:'Collect 100 coins',get:d=>d.st.coins,goal:100,rw:300},
  {id:5,name:'GOLD HOARDER',desc:'Collect 1000 coins',get:d=>d.st.coins,goal:1000,rw:1000},
  {id:6,name:'CLOSE PASS PRO',desc:'50 close passes',get:d=>d.st.miss,goal:50,rw:500},
  {id:7,name:'BLADE DANCER',desc:'300 close passes',get:d=>d.st.miss,goal:300,rw:1500},
  {id:8,name:'COMBO RISING',desc:'15-hit combo',get:d=>d.st.combo,goal:15,rw:400},
  {id:9,name:'COMBO LEGEND',desc:'40-hit combo',get:d=>d.st.combo,goal:40,rw:1200},
  {id:10,name:'SKY JUMPER',desc:'20 flyovers',get:d=>d.st.fly,goal:20,rw:600},
  {id:11,name:'SPEED DEMON',desc:'Hit 200 km/h',get:d=>d.st.speed,goal:200,unit:'km/h',rw:500},
  {id:12,name:'BIKER LIFE',desc:'Complete a bike run',get:d=>d.st.bikeRuns,goal:1,rw:400},
  {id:13,name:'TEN-K CLUB',desc:'Score 10,000 in one run',get:d=>d.best,goal:10000,rw:1500}
];

export const CHALLENGES = [
  {id:0,name:'FIRST BLOOD',desc:'Score 1000 points',goal:1000,type:'score',rw:500,icon:'🎯'},
  {id:1,name:'SPEED RUNNER',desc:'Reach 150 km/h',goal:150,type:'speed',rw:400,icon:'⚡'},
  {id:2,name:'COMBO MASTER',desc:'Get 20-hit combo',goal:20,type:'combo',rw:600,icon:'🔥'},
  {id:3,name:'MARATHON',desc:'Drive 5 km without crash',goal:5000,type:'dist',rw:800,icon:'🏃'},
  {id:4,name:'COLLECTOR',desc:'50 coins in one run',goal:50,type:'coins',rw:700,icon:'💰'},
  {id:5,name:'NITRO KING',desc:'Use nitro 30s total',goal:30,type:'nitro',rw:500,icon:'⚡'},
  {id:6,name:'FRIEND RACE',desc:'Beat a friend\'s best',goal:1,type:'friend',rw:1000,icon:'🏁'},
  {id:7,name:'BIKER PRO',desc:'Score 3000 on a bike',goal:3000,type:'bikeScore',rw:800,icon:'🏍'},
  {id:8,name:'SOUTHERN TIP',desc:'Reach Kanyakumari (100 km)',goal:100000,type:'dist',rw:1500,icon:'🌊'},
  {id:9,name:'FLYOVER KING',desc:'15 flyovers in one run',goal:15,type:'fly',rw:900,icon:'🦅'},
  {id:10,name:'SPEED BANK',desc:'Earn 5 high-speed bonus gates',goal:5,type:'speedBonus',rw:1100,icon:'🏎'},
  {id:11,name:'CLEAN DRIVER',desc:'Reach a 5 km clean checkpoint',goal:5000,type:'clean',rw:1200,icon:'✨'}
];

export const BIOMES = [
  {name:'KANYAKUMARI COAST',en:'NH-44 · SOUTHERN TIP',ground:0xcfa872,
    left:['palm','palm','rock','bush','billboard'],right:['parasol','palm','rock','billboard']},
  {name:'DECCAN PLATEAU',en:'NH-44 · ARID HIGHLANDS',ground:0xd09a5f,
    left:['cactus','cactus','rock','windmill','billboard'],right:['rock','cactus','bush']},
  {name:'SAHYADRI FOREST',en:'NH-44 · WESTERN GHATS',ground:0x57854f,
    left:['pine','pine','bush','rock','windmill','billboard'],right:['pine','bush','rock']},
  {name:'BENGALURU NIGHTS',en:'NH-44 · NEON METRO',ground:0x5b606c,
    left:['building','building','billboard','hydrant','bush'],right:['bush','billboard','rock']}
];

export const LANES = [-4.8,-1.6,1.6,4.8];
export const TRAFFIC_COLORS = [0x3fa7c4,0xf2c230,0x5a6fd6,0x9a56c4,0xe8e6e0,0x6a7280,0x4aa86a,0xe07030];