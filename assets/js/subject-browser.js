/* Purpose: Subject browser - Descriptive comment added for clarity */
(() => {
  "use strict";

  const COMMON = "First Year / Common";
  const COMMON_VALUE = "__common__";
  const ALL_DEPARTMENTS = "all";
  const HOME_LIMIT = 36;

  // Revision 2021 assets remain in /lessons and /notes.
  const LESSON_CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2006","2011","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3011","3012","3013","3014","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4011","4012","4013","4021","4022","4023","4024","4031","4032","4041","4042","4043","4101","4102","4103","5001","5011","5012","5013","5014A","5014B","5014C","5021","5022","5023A","5023B","5023C","5027","5031","5032","5041","5042","5043","5043A","6001","6002","6007","6009","6011A","6011B","6011C","6012A","6012B","6012C","6012D","6031","6031A","6031C","6031D","6032","6032A","6032B","6032C","6032D","6041","6041A","6041B","6041C","6042","6042A","6042B","6042C","6042D","6043","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);
  const NOTES_CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2006","2011","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","3011","3012","3013","3014","3021","3022","3023","3024","3025","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4011","4012","4013","4021","4022","4023","4024","4031","4032","4041","4042","4043","4101","4102","4103","5001","5011","5012","5013","5014A","5014B","5014C","5021","5022","5023A","5023B","5023C","5027","5031","5032","5041","5042","5043","5043A","6001","6002","6007","6009","6011A","6011B","6011C","6012A","6012B","6012C","6012D","6031","6031A","6031C","6031D","6032","6032A","6032B","6032C","6032D","6041","6041A","6041B","6041C","6042","6042A","6042B","6042C","6042D","6043","6061A","6061B","6061C","6062A","6062B","6067","6068","6069"]);

  // Revision 2026 assets are detected only inside /revision-2026-content.
  const REV2026_LESSON_CODES = new Set(["1001","1002","1003","1004","1008","1009","1011","1021","1031","1041","1051","1061","1091","1101","1131","1141","1142","1143","1144","1149","1181","1182","1251","1252","1253","1254","1259","1421","2001A","2001B","2001C","2001D","2001E","2002A","2002B","2003A","2003B","2005","2009A","2009B","2011","2012","2021","2022","2031","2032","2041","2042","2048","2131","3001","3011","3012","3021","3022","3031","3032","3041","3042","3051","3061","4001","4011","4012","4022","4023","4031","4041","5011","5012","5013","5021","5022","5024A","5024B","5024C"]);
  const REV2026_NOTES_CODES = new Set(["1001","1002","1003","1004","1008","1009","1011","1021","1031","1041","1051","1061","1091","1101","1131","1141","1142","1143","1144","1149","1181","1182","1251","1252","1253","1254","1259","1421","2001A","2001B","2001C","2001D","2001E","2002A","2002B","2003A","2003B","2005","2009A","2009B","2011","2012","2021","2022","2031","2032","2041","2042","2048","2131","3001","3011","3012","3021","3022","3031","3032","3041","3042","3051","3061","4001","4011","4012","4022","4023","4031","4041","5011","5012"]);

  // REV2021 course codes with NO matching REV2026 code (computed by diffing the
  // full REV2021 code list against revision-2026-subjects.json's code list).
  // The government site's course-contents page is looked up by a bare numeric
  // "course" code with no revision/scheme qualifier, so a code that exists in
  // BOTH revisions can't be disambiguated — that's what caused 2021 subjects to
  // silently open 2026 content for shared codes (e.g. 3009). For codes in this
  // set there's no such collision, so a direct link is safe and correct.
  // Re-derive with: REV2021 codes (assets/js/subjects.js) minus REV2026 codes
  // (assets/data/revision-2026-subjects.json) whenever either dataset changes.
  const REV2021_SAFE_CODES = new Set(["1005","1007","1257","1258","1471","1472","1473","1474","1477","1478","1479","2001","2002","2003","2006","2008","2009","2181","2254","2255","2291","2301","2371","2379","2411","2471","2472","2473","2474","2475","2477","2478","2479","2701","3015","3016","3025","3026","3027","3035","3036","3045","3046","3055","3057","3065","3066","3075","3076","3085","3086","3095","3096","3105","3106","3116","3125","3126","3135","3136","3146","3151","3152","3157","3158","3159","3243","3248","3255","3256","3264","3265","3266","3267","3271","3272","3273","3274","3275","3276","3277","3278","3279","3288","3291","3292","3293","3297","3298","3299","3302","3303","3304","3307","3321","3322","3323","3324","3325","3326","3327","3328","3329","3335","3336","3344","3345","3346","3347","3348","3351","3352","3356","3357","3358","3359","3361","3362","3366","3367","3368","3369","3372","3377","3378","3379","3425","3426","3465","3466","3467","3471","3472","3473","3474","3475","3476","3477","3478","3479","3498","3509","4006","4007","4008","4009","4016","4024","4036","4046","4057","4064","4077","4084","4094","4106","4124","4136","4144","4151","4152","4157","4158","4159","4184","4185","4242","4254","4266","4267","4271","4272","4276","4277","4278","4279","4287","4291","4292","4293","4296","4297","4298","4299","4302","4303","4308","4321","4322","4323","4326","4327","4328","4329","4336","4346","4347","4352","4353","4356","4357","4358","4359","4368","4369","4372","4373","4377","4378","4392","4398","4399","4424","4464","4468","4471","4472","4473","4474","4477","4478","4479","4492","4498","4701","4702","4709","5001","5002","5019","5023A","5023B","5023C","5027","5029","5036","5039","5039C","5043","5043E","5049","5079","5096","5109C","5112A","5112B","5119","5133A","5133B","5133C","5143A","5143B","5143C","5146","5148A","5148B","5148C","5149","5151","5152A","5152B","5157","5158","5159A","5159B","5182A","5182B","5182C","5189","5202","5209","5247","5249","5263","5269","5271","5272","5273A","5273B","5273C","5277","5278","5279A","5279B","5279C","5289C","5291","5292","5293A","5293B","5293C","5297","5298","5299A","5299B","5299C","5308","5309C","5321","5322A","5322B","5322C","5323","5327","5328","5329A","5329B","5329C","5339C","5342","5343A","5343B","5351","5352A","5352B","5352C","5358","5359","5372A","5372B","5379B","5389","5391","5399","5401","5402A","5408","5409A","5411","5418","5419A","5429","5439","5469","5471","5472","5473","5474A","5474B","5474C","5477","5478","5479A","5479B","5479C","5493D","5499B","5509","5709","6001","6002","6008","6011A","6011B","6011C","6012A","6012B","6012C","6012D","6017","6019","6021A","6021B","6022A","6022B","6022C","6022D","6027","6029","6031","6031A","6031C","6031D","6032A","6032B","6032C","6032D","6036","6037","6039","6041","6041A","6041B","6042A","6042B","6042C","6042D","6043","6046","6047","6049","6051A","6051B","6051C","6052A","6052B","6052C","6052D","6057","6061A","6061B","6061C","6062A","6062B","6067","6069","6071A","6071B","6071C","6072A","6072B","6072C","6072D","6077","6079","6081A","6081B","6081C","6082A","6082B","6082C","6082D","6087","6089","6091A","6091B","6091C","6092A","6092B","6092C","6092D","6097","6099","6101A","6101B","6101C","6102A","6102B","6102C","6102D","6107","6109C","6111","6118","6119","6121A","6121B","6121C","6122A","6122B","6122C","6127","6131A","6131B","6131C","6131D","6132A","6132B","6132C","6132D","6137","6141","6149","6151A","6151B","6152","6157","6158","6159A","6159B","6181A","6181B","6181C","6182A","6182B","6182C","6182D","6187","6201A","6201B","6241A","6241B","6241C","6242A","6242B","6242C","6242D","6249","6251A","6251B","6251C","6252A","6252B","6252C","6252D","6257","6259","6261","6262A","6262B","6262C","6267","6269","6271A","6271B","6271C","6272A","6272B","6272C","6272D","6277","6278","6279A","6279B","6279C","6281A","6281B","6281C","6282A","6282B","6282C","6288","6289A","6289B","6291A","6291B","6292A","6292B","6292C","6292D","6298","6299A","6299B","6299C","6301A","6301B","6301C","6302A","6302B","6302C","6302D","6309C","6321A","6321B","6321C","6322A","6322B","6322C","6322D","6327","6328","6329A","6329B","6329C","6331A","6331B","6331C","6332A","6332B","6332C","6332D","6337","6341A","6341B","6341C","6349B","6349C","6351C","6352A","6352B","6352C","6352D","6359","6369","6371C","6377","6378","6379B","6389","6391A","6391B","6398","6399","6401A","6407","6408","6409A","6411A","6412A","6417","6418","6419A","6421A","6421B","6421C","6422A","6422B","6422C","6422D","6427","6429","6431A","6439","6461A","6461B","6461C","6461D","6462A","6462B","6462C","6462D","6467","6469","6471A","6471B","6471C","6477","6478","6479","6491B","6491C","6491D","6492D","6497","6498","6499B","6501B","6501C","6701","IP301"]);

  // The complement of REV2021_SAFE_CODES: codes that exist in BOTH revisions.
  // Confirmed live (2026-08-12) that the government site's course= lookup for
  // a colliding code is NOT stable — the exact same URL (course=1001) served
  // REV2021 content on one fetch and REV2026 content on the next. So neither
  // revision can safely direct-link a colliding code; both fall back.
  const SHARED_CODE_COLLISIONS = new Set(["1001","1002","1003","1004","1008","1009","1141","1142","1143","1144","1149","1251","1252","1253","1254","1259","2011","2019","2021","2022","2028","2029","2031","2032","2038","2039","2041","2049","2051","2059","2061","2069","2071","2072","2078","2079","2081","2089","2091","2099","2101","2109","2111","2121","2129","2131","2139","2141","2142","2143","2144","2148","2149","2182","2251","2252","2253","2257","2258","2259","2339","2421","2429","2461","2469","3009","3011","3012","3013","3014","3017","3018","3019","3021","3022","3023","3024","3028","3029","3031","3032","3033","3034","3037","3038","3039","3041","3042","3043","3044","3047","3048","3049","3051","3052","3053","3054","3058","3059","3061","3062","3063","3064","3067","3068","3069","3071","3072","3073","3074","3077","3078","3079","3081","3082","3083","3084","3087","3088","3089","3091","3092","3093","3094","3097","3098","3099","3101","3102","3103","3104","3107","3108","3109","3111","3112","3113","3117","3118","3119","3121","3122","3123","3124","3127","3128","3129","3131","3132","3133","3134","3137","3138","3139","3141","3142","3143","3147","3148","3149","3181","3182","3183","3184","3187","3188","3189","3241","3242","3249","3251","3252","3253","3254","3257","3258","3259","3261","3262","3263","3268","3269","3281","3282","3289","3301","3308","3309","3331","3332","3333","3334","3337","3338","3339","3341","3342","3343","3349","3371","3381","3382","3389","3411","3421","3422","3423","3424","3427","3428","3429","3431","3461","3462","3463","3464","3468","3469","3499","3501","4001","4011","4012","4013","4017","4018","4019","4021","4022","4023","4027","4028","4029","4031","4032","4033","4037","4038","4039","4041","4042","4043","4047","4048","4049","4051","4052","4053","4058","4059","4061","4062","4063","4067","4068","4069","4071","4072","4073","4074","4078","4079","4081","4082","4083","4087","4088","4089","4091","4092","4093","4097","4098","4099","4101","4102","4103","4107","4108","4109","4111","4112","4113","4117","4118","4119","4121","4122","4123","4127","4128","4129","4131","4132","4133","4137","4138","4139","4141","4142","4143","4147","4148","4149","4181","4182","4183","4188","4189","4241","4249","4251","4252","4253","4257","4258","4259","4261","4262","4263","4268","4269","4281","4282","4288","4289","4301","4309","4331","4332","4333","4337","4338","4339","4341","4342","4343","4348","4349","4351","4371","4379","4381","4389","4391","4411","4421","4422","4423","4427","4428","4429","4461","4462","4463","4467","4469","4491","4499","4501","4509","5008","5009","5011","5012","5013","5014A","5014B","5014C","5017","5018","5021","5022","5028","5031","5032","5033A","5033B","5033C","5037","5038","5041","5042","5043A","5043B","5043D","5047","5048","5049A","5049B","5049C","5051","5052","5053A","5053B","5053C","5057","5058","5059A","5059B","5059C","5061","5062","5063A","5063B","5063C","5067","5068","5069A","5069B","5071","5072","5073A","5073B","5073C","5077","5078","5081","5082","5083A","5083B","5083C","5087","5088","5089A","5089B","5089C","5091","5092","5093A","5093B","5093C","5097","5098","5101","5102","5103A","5103B","5103C","5107","5108","5109A","5109B","5111","5117","5118","5121","5122","5123A","5123B","5123C","5127","5128","5129","5131","5132","5137","5138","5139A","5139B","5139C","5141","5142","5147","5181","5187","5188","5201","5241","5242","5243A","5243B","5248","5251","5252","5253","5254A","5254B","5254C","5257","5258","5259A","5259B","5259C","5261","5262","5267","5268","5281","5282","5283A","5283B","5283C","5287","5288","5289A","5289B","5301","5302","5303A","5303B","5303C","5307","5309A","5309B","5331","5332","5333A","5333B","5333C","5337","5338","5339A","5339B","5341","5347","5348","5349A","5349B","5371","5378","5379A","5381","5421","5422","5423A","5423B","5423C","5427","5428","5431","5432","5438","5461","5462","5463A","5463B","5463C","5467","5468","5491","5492","5493A","5493B","5493C","5497","5498","5499A","5501","6007","6009","6018","6028","6032","6038","6039A","6039B","6042","6048","6049A","6049B","6058","6059A","6059B","6059C","6068","6078","6088","6098","6108","6109A","6109B","6117","6128","6129","6138","6139A","6139B","6139C","6142","6143A","6143B","6143C","6148","6188","6189","6209A","6248","6258","6268","6308","6309A","6309B","6338","6339A","6339B","6339C","6342A","6342B","6342C","6348","6349A","6351A","6351B","6361A","6371A","6371B","6379A","6428","6468","6492A","6492B","6492C","6501A"]);

  const MANUAL = [
    {revision:"2021",semester:"Semester 1",code:"1001",name:"Communication Skills in English",department:COMMON,type:"Theory",assetCode:"1001"},
    {revision:"2021",semester:"Semester 1",code:"1002",name:"Mathematics I",department:COMMON,type:"Theory",assetCode:"1002"},
    {revision:"2021",semester:"Semester 1",code:"1003",name:"Applied Physics I",department:COMMON,type:"Theory",assetCode:"1003"},
    {revision:"2021",semester:"Semester 1",code:"1004",name:"Applied Chemistry",department:COMMON,type:"Theory",assetCode:"1004"},
    {revision:"2021",semester:"Semester 1",code:"1005",name:"Engineering Graphics",department:COMMON,type:"Drawing",assetCode:"1005"},
    {revision:"2021",semester:"Semester 1",code:"1007",name:"Applied Chemistry Lab",department:COMMON,type:"Lab",assetCode:"1007"},
    {revision:"2021",semester:"Semester 1",code:"1008",name:"Introduction to IT systems Lab",department:COMMON,type:"Lab",assetCode:"1008"},
    {revision:"2021",semester:"Semester 1",code:"1009",name:"Sports and Yoga",department:COMMON,type:"Theory",assetCode:"1009"},
    {revision:"2021",semester:"Semester 2",code:"2001",name:"Environmental Science",department:COMMON,type:"Theory",assetCode:"2001"},
    {revision:"2021",semester:"Semester 2",code:"2002",name:"Mathematics II",department:COMMON,type:"Theory",assetCode:"2002"},
    {revision:"2021",semester:"Semester 2",code:"2003",name:"Applied Physics II",department:COMMON,type:"Theory",assetCode:"2003"},
    {revision:"2021",semester:"Semester 2",code:"2006",name:"Applied Physics Lab",department:COMMON,type:"Lab",assetCode:"2006"},
    {revision:"2021",semester:"Semester 2",code:"2008",name:"Communication Skills in English Lab",department:COMMON,type:"Lab",assetCode:"2008"},
    {revision:"2021",semester:"Semester 2",code:"2009",name:"Engineering Workshop Practice",department:COMMON,type:"Workshop",assetCode:"2009"},
    {revision:"2021",semester:"Semester 2",code:"2022",name:"Manufacturing Technology",department:"Mechanical Engineering",type:"Theory",assetCode:"2022"},
    {revision:"2021",semester:"Semester 2",code:"2022",name:"Manufacturing Technology",department:"Mechatronics",type:"Theory",assetCode:"2022"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Mechanical Engineering",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Tool and Die Engineering",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 2",code:"2028",name:"Basic CAD Lab",department:"Manufacturing Technology",type:"Lab",assetCode:"2028"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Mechanical Engineering",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Tool and Die Engineering",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 3",code:"3021",name:"Strength of Materials",department:"Manufacturing Technology",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 4",code:"3021",name:"Strength of Materials",department:"Wood and Paper Technology",type:"Program Core",assetCode:"3021"},
    {revision:"2021",semester:"Semester 4",code:"4021",name:"Thermal Engineering",department:"Mechanical Engineering",type:"Program Core",assetCode:"4021"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Mechanical Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Tool and Die Engineering",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 3",code:"3022",name:"Material Science and Metrology",department:"Manufacturing Technology",type:"Program Core",assetCode:"3022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Mechanical Engineering",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 4",code:"4022",name:"Fluid Mechanics & Hydraulic Machinery",department:"Manufacturing Technology",type:"Program Core",assetCode:"4022"},
    {revision:"2021",semester:"Semester 4",code:"4101",name:"Mechanism of Printing Machines II",department:"Printing Technology",type:"Program Core",assetCode:"4101"},
    {revision:"2021",semester:"Semester 4",code:"4102",name:"Print Finishing & Conversion Techniques",department:"Printing Technology",type:"Program Core",assetCode:"4102"},
    {revision:"2021",semester:"Semester 4",code:"4103",name:"Digital Imaging Techniques",department:"Printing Technology",type:"Program Core",assetCode:"4103"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Electronics and Communication Engineering",type:"Program Elective",assetCode:"6041A"},
    {revision:"2021",semester:"Semester 6",code:"6041A",name:"Medical Electronics",department:"Biomedical Engineering",type:"Program Elective",assetCode:"6041A"}
  ];

  const $ = id => document.getElementById(id);
  const esc = value => window.PolyUtils?.escapeHtml
    ? window.PolyUtils.escapeHtml(value)
    : String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const norm = value => String(value || "").trim().toUpperCase();
  // PERFORMANCE OPTIMIZATION: cache depKey transforms so the expensive regexp
  // replacement runs at most once per distinct department string.
  const depKeyCache = new Map();
  const depKey = value => {
    const text = String(value || "");
    const cached = depKeyCache.get(text);
    if (cached !== undefined) return cached;
    const result = text.toLowerCase().replaceAll("&", " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    depKeyCache.set(text, result);
    return result;
  };
  const semRank = value => Number(String(value || "").match(/\d+/)?.[0] || 999);
  const root = () => { const depth = location.pathname.replace(/\/[^/]*$/, " ").trim().split("/").filter(Boolean).length; return depth ? "../".repeat(depth) : ""; };
  const asset = subject => String(subject.assetCode || subject.code || "");
  const sameDept = (a, b) => depKey(a) === depKey(b);
  // PERFORMANCE OPTIMIZATION: Simplified key generation to reduce string concatenation and array allocation.
  const revisionTag = revision => {
    const value = String(revision || "").trim().toUpperCase();
    if (value === "2021" || value === "REV2021") return "REV2021";
    if (value === "2026" || value === "REV2026") return "REV2026";
    return value.startsWith("REV") ? value : (value ? `REV${value}` : "");
  };
  const revisionYear = revision => revisionTag(revision).replace(/^REV/, "");
  const makeCourseKey = subject => `${revisionTag(subject.revision)}-${norm(subject.code)}`;
  const key = s => `${makeCourseKey(s)}|${s.department}`;
  const directCourseUrl = (code, revision) => {
    const tag = revisionTag(revision);
    return `https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course=${encodeURIComponent(code)}${tag ? `&scheme=${encodeURIComponent(tag)}` : ""}`;
  };
  // SITTTR's public course endpoint does not reliably distinguish the two
  // revisions for shared course codes. Until a course-specific REV2021 URL is
  // verified in the data record, do not send a student to a potentially 2026 page.
  const syllabusUrl = subject => {
    const tag = revisionTag(subject.revision);
    if (tag === "REV2026") return "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026";
    return "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2021";
  };
  const syllabusUnavailableMessage = subject =>
    `Official syllabus link has not been verified for Revision ${esc(revisionYear(subject.revision))} course ${esc(subject.code)}.`;
  const syllabusAction = subject => {
    const href = syllabusUrl(subject);
    if (href) return `<a class="action syllabus" href="${esc(href)}" target="_blank" rel="noopener noreferrer external" data-syllabus-revision="${esc(revisionTag(subject.revision))}" data-syllabus-course="${esc(norm(subject.code))}" data-resource-key="${esc(makeCourseKey(subject))}">Open Syllabus</a>`;
    const message = syllabusUnavailableMessage(subject);
    return `<button class="action syllabus" type="button" data-syllabus-unavailable="true" data-syllabus-revision="${esc(revisionTag(subject.revision))}" data-syllabus-course="${esc(norm(subject.code))}" data-resource-key="${esc(makeCourseKey(subject))}" aria-label="${message}" title="${message}" onclick="window.alert(this.title)">Open Syllabus</button>`;
  };
  const questionPaperUrl = subject => {
    const tag = revisionTag(subject.revision);
    if (tag === "REV2026") return "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2026";
    return "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2021";
  };
  const modelPaperUnavailableMessage = subject => `Model Question Paper not available for Revision ${esc(revisionYear(subject.revision))} for this course.`;
  const questionPaperAction = (subject, label) => {
    const href = questionPaperUrl(subject);
    if (href) return `<a class="action qp" href="${esc(href)}" target="_blank" rel="noopener noreferrer external" data-model-paper-revision="${esc(revisionTag(subject.revision))}" data-model-paper-course="${esc(norm(subject.code))}" data-resource-key="${esc(makeCourseKey(subject))}">${esc(label)}</a>`;
    return `<button class="action qp" type="button" data-model-paper-unavailable="true" data-model-paper-revision="${esc(revisionTag(subject.revision))}" data-model-paper-course="${esc(norm(subject.code))}" data-resource-key="${esc(makeCourseKey(subject))}" aria-label="${modelPaperUnavailableMessage(subject)}" title="${modelPaperUnavailableMessage(subject)}" onclick="window.alert(this.title)">${esc(label)}</button>`;
  };

  function unique(list) {
    const seen = new Set();
    return list.filter(subject => { const id = key(subject); if (seen.has(id)) return false; seen.add(id); return true; });
  }

  function parseSubjectsText(text) {
    const match = String(text || "").match(/\b(?:const|let|var)\s+SUBJECTS\s*=\s*(\[[\s\S]*?\]);/m);
    if (!match) return [];
    try { return Function(`"use strict";return (${match[1]});`)(); } catch { return []; }
  }

  function normalize2026(subject) {
    const code = String(subject.code || "").trim();
    const semesterNumber = Number(subject.semesterNumber) || Number(code.match(/^([1-6])/)?.[1]) || semRank(subject.semester);
    return {
      revision: "2026",
      code,
      name: String(subject.name || "Untitled subject").trim(),
      department: String(subject.programme || subject.department || "Revision 2026").trim(),
      semester: semesterNumber >= 1 && semesterNumber <= 6 ? `Semester ${semesterNumber}` : "Other subjects",
      type: String(subject.type || "Course").trim(),
      syllabusUrl: subject.syllabusUrl,
      programmeSlug: subject.programmeSlug,
      programmeCode: subject.programmeCode,
      programmeUrl: subject.programmeUrl,
      syllabusUnavailable: Boolean(subject.syllabusUnavailable)
    };
  }

  async function getSubjects() {
    let revision2021 = Array.isArray(globalThis.SUBJECTS) ? globalThis.SUBJECTS : [];
    const [subjectText, revision2026Payload] = await Promise.all([
      // PERFORMANCE OPTIMIZATION: Omit { cache: "no-store" } to allow browser caching on these version-cache-busted files.
      revision2021.length ? Promise.resolve("") : fetch(`${root()}assets/js/subjects.js?v=20260716-revision-switch`).then(response => response.ok ? response.text() : "").catch(() => ""),
      // PERFORMANCE OPTIMIZATION: use the trimmed subject-browser payload (~720 KB vs ~2.0 MB). The full
      // payload keeps syllabusUrl (~234 KB per course) which the renderer rebuilds from the code anyway,
      // and heavy scheme/evaluation metadata that browsing pages never render.
      fetch(`${root()}assets/data/revision-2026-subjects-lite.json?v=20260808-qp-hang1`).then(response => response.ok ? response.json() : null).catch(() => null)
    ]);
    if (!revision2021.length) revision2021 = parseSubjectsText(subjectText);
    const revision2026 = Array.isArray(revision2026Payload?.subjects) ? revision2026Payload.subjects.map(normalize2026) : [];
    return unique([...revision2021, ...MANUAL, ...revision2026]);
  }

  function hasLesson(subject) {
    const code = norm(asset(subject));
    return String(subject.revision) === "2026"
      ? REV2026_LESSON_CODES.has(code)
      : LESSON_CODES.has(code);
  }

  function hasNotes(subject) {
    const code = norm(asset(subject));
    return String(subject.revision) === "2026"
      ? REV2026_NOTES_CODES.has(code)
      : NOTES_CODES.has(code);
  }

  function assetPaths(subject) {
    const relativeRoot = root();
    const code = encodeURIComponent(asset(subject));
    if (String(subject.revision) === "2026") {
      return {
        lessonHref: `${relativeRoot}revision-2026-content/lessons/lessons-${code}.html`,
        notesHref: `${relativeRoot}revision-2026-content/notes/downloadable-notes-${code}.pdf`
      };
    }
    return {
      lessonHref: `${relativeRoot}lessons/lessons-${code}.html`,
      notesHref: `${relativeRoot}notes/downloadable-notes-${code}.pdf`
    };
  }

  function card(subject, mode) {
    if (mode === "papers") {
      // Question-papers page: show only the sample question paper link,
      // not syllabus/lessons/notes (those belong on syllabus.html / lessons.html).
      return `<article class="subject-card" data-subject-code="${esc(norm(subject.code))}" data-revision="${esc(revisionTag(subject.revision))}" data-resource-key="${esc(makeCourseKey(subject))}"><div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row">${questionPaperAction(subject, "Open Model Question Paper")}</div></article>`;
    }
    const { lessonHref, notesHref } = assetPaths(subject);
    const handbookAvailable = hasLesson(subject);
    const notesAvailable = hasNotes(subject);
    const downloadHref = notesAvailable ? notesHref : `${lessonHref}?autoPrintNotes=1`;
    const downloadAttributes = notesAvailable ? " download" : ' target="_blank" rel="noopener noreferrer"';
    const studyActions = handbookAvailable
      ? `<a class="action lessons" href="${esc(lessonHref)}">View Lessons</a><a class="action download" href="${esc(downloadHref)}"${downloadAttributes}>Download Notes</a>`
      : `<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span><span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>`;
    return `<article class="subject-card" data-subject-code="${esc(norm(subject.code))}" data-revision="${esc(revisionTag(subject.revision))}" data-resource-key="${esc(makeCourseKey(subject))}" data-notes-href="${esc(notesHref)}" data-lesson-href="${esc(lessonHref)}" data-lesson-available="${handbookAvailable}" data-notes-available="${notesAvailable}"><div class="subject-top"><span>${esc(subject.revision)}</span><strong>${esc(subject.code)}</strong></div><h3>${esc(subject.name)}</h3><p>${esc(subject.department)} / ${esc(subject.semester)} / ${esc(subject.type)}</p><div class="action-row">${syllabusAction(subject)}${studyActions}${questionPaperAction(subject, "Sample QP")}</div></article>`;
  }

  // PERFORMANCE OPTIMIZATION: per-subject memoized card HTML. Subject data never
  // changes at runtime, so card(subject, mode) is pure; caching it avoids re-escaping
  // and string concatenation on every re-render.
  const cardCache = new Map();
  function cachedCard(subject, mode) {
    const modeKey = mode || "default";
    let modeCache = cardCache.get(modeKey);
    if (!modeCache) {
      modeCache = new WeakMap();
      cardCache.set(modeKey, modeCache);
    }
    const cached = modeCache.get(subject);
    if (cached !== undefined) return cached;
    const html = card(subject, mode);
    modeCache.set(subject, html);
    return html;
  }

  // PERFORMANCE OPTIMIZATION: semester-section headings are pure text and the
  // card grid only needs inline grid styles once; build them with a static
  // template string instead of inline styles on every node.
  const SEMESTER_SECTION_STYLE = "grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px";
  const SEMESTER_CARD_GRID_STYLE = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%";

  function group(list, mode) {
    const groups = new Map();
    list.forEach(subject => { const semester = String(subject.semester || "Other subjects"); if (!groups.has(semester)) groups.set(semester, []); groups.get(semester).push(subject); });
    const out = [];
    for (const [semester, items] of groups) {
      out.push(`<section class="semester-subject-section" style="${SEMESTER_SECTION_STYLE}"><div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)"><h3>${esc(semester)}</h3><span>${items.length} ${items.length === 1 ? "subject" : "subjects"}</span></div><div class="semester-card-grid" style="${SEMESTER_CARD_GRID_STYLE}">`);
      items.forEach(subject => out.push(cachedCard(subject, mode)));
      out.push("</div></section>");
    }
    return out.join("");
  }

  function fillSemester(select, values, preferred) {
    if (!select) return;
    const old = select.value || preferred || "all";
    select.replaceChildren(new Option("All semesters", "all"));
    [...new Set(values.filter(Boolean))].sort((a, b) => semRank(a) - semRank(b) || String(a).localeCompare(String(b))).forEach(value => select.add(new Option(value, value)));
    select.value = [...select.options].some(option => option.value === old) ? old : (preferred || "all");
  }

  function fillDepartment(select, list, preferred) {
    if (!select) return;
    const old = select.value || preferred || ALL_DEPARTMENTS;
    const hasCommon = list.some(subject => sameDept(subject.department, COMMON));
    select.replaceChildren(new Option("All Departments", ALL_DEPARTMENTS));
    if (hasCommon) select.add(new Option("Common Subjects", COMMON_VALUE));
    [...new Set(list.map(subject => subject.department).filter(Boolean).filter(department => !sameDept(department, COMMON)))].sort().forEach(department => select.add(new Option(department, department)));
    select.value = [...select.options].some(option => option.value === old) ? old : (hasCommon && preferred === COMMON_VALUE ? COMMON_VALUE : ALL_DEPARTMENTS);
  }

  function fillRevision(select, subjects, preferred) {
    if (!select) return;
    const old = select.value || preferred || "2026";
    const configured = globalThis.CURRICULUM_REVISIONS || {};
    const ids = [...new Set([...Object.keys(configured), ...subjects.map(subject => String(subject.revision)).filter(Boolean)])].filter(id => id !== "2015").sort().reverse();
    select.replaceChildren();
    ids.forEach(id => {
      const config = configured[id] || {};
      const published = subjects.some(subject => String(subject.revision) === id);
      const option = new Option(`${config.label || `Revision ${id}`}${published ? "" : " — data unavailable"}`, id);
      option.disabled = !published;
      select.add(option);
    });
    select.value = [...select.options].some(option => option.value === old && !option.disabled) ? old : ([...select.options].find(option => !option.disabled)?.value || "2021");
  }

  function emptyMessage(mode, revision) {
    if (mode === "papers") return `Choose a department, semester, or enter a subject code/title to list Revision ${esc(revision)} model question papers.`;
    if (mode === "lessons" && revision === "2026") return "No Revision 2026 lesson HTML files are published in the dedicated 2026 folder yet.";
    return "No verified subjects found for this revision and filter selection.";
  }

  function render(all, grid, mode, fixedRevision, department) {
    const query = String($("subjectSearch")?.value || "").trim().toLowerCase();
    const semester = $("semesterFilter")?.value || "all";
    const chosenDepartment = $("departmentFilter")?.value || ALL_DEPARTMENTS;
    const selectedRevision = fixedRevision || $("revisionFilter")?.value || "all";
    const requireFilter = grid.dataset.requireFilter === "true";
    const hasUserFilter = Boolean(query) || semester !== "all" || chosenDepartment !== ALL_DEPARTMENTS;
    let list = all.filter(subject => selectedRevision === "all" || String(subject.revision) === selectedRevision);
    if (mode === "papers" && requireFilter && !hasUserFilter) list = [];
    if (mode === "department") list = list.filter(subject => sameDept(subject.department, department) || (String(subject.revision) === "2021" && sameDept(subject.department, COMMON)));
    else if (mode === "home" || mode === "syllabus" || mode === "lessons" || mode === "papers") {
      if (chosenDepartment === COMMON_VALUE) list = list.filter(subject => sameDept(subject.department, COMMON));
      else if (chosenDepartment !== ALL_DEPARTMENTS) list = list.filter(subject => sameDept(subject.department, chosenDepartment) || (String(subject.revision) === "2021" && sameDept(subject.department, COMMON)));
    }
    if (mode === "lessons") list = list.filter(hasLesson);
    if (semester !== "all") list = list.filter(subject => String(subject.semester) === semester);
    if (query) {
      list = list.filter(subject => (subject._searchText || "").includes(query));
    }
    // PERFORMANCE OPTIMIZATION: Removed redundant unique() deduplication inside the render loop.
    // The master subjects array (all) is already deduplicated once at initial load inside getSubjects().
    list.sort((a, b) => semRank(a.semester) - semRank(b.semester) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
    if (mode === "home") {
      // PERFORMANCE OPTIMIZATION: Replacing O(n^2) array.findIndex loop with O(n) Set lookups.
      // This is crucial on the homepage where 1800+ elements would otherwise trigger millions of iterations.
      const seenHomeCodes = new Set();
      const uniqueHomeList = [];
      for (let i = 0; i < list.length; i++) {
        const subject = list[i];
        const uniqueKey = norm(subject.code) + "::" + String(subject.revision || "");
        if (!seenHomeCodes.has(uniqueKey)) {
          seenHomeCodes.add(uniqueKey);
          uniqueHomeList.push(subject);
        }
      }
      list = uniqueHomeList.slice(0, HOME_LIMIT);
    }
    grid.innerHTML = list.length ? (mode === "home" ? list.map(s => cachedCard(s, mode)).join("") : group(list, mode)) : `<div class="empty-state">${esc(emptyMessage(mode, selectedRevision))}</div>`;

    // PERFORMANCE OPTIMIZATION: create the announcer only once and keep it in a
    // module-level variable instead of querying the DOM on every render.
    if (!renderAnnouncer && grid.parentNode) {
      renderAnnouncer = document.createElement("div");
      renderAnnouncer.id = "subjectBrowserAnnouncer";
      renderAnnouncer.className = "sr-only";
      renderAnnouncer.setAttribute("role", "status");
      renderAnnouncer.setAttribute("aria-live", "polite");
      grid.parentNode.insertBefore(renderAnnouncer, grid);
    }
    if (renderAnnouncer) {
      renderAnnouncer.textContent = list.length === 0 ? "No subjects found." : (list.length === 1 ? "1 subject found." : `${list.length} subjects found.`);
    }
  }

  let renderAnnouncer = null;

  async function init() {
    const grid = $("subjectGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="empty-state">Loading Revision 2021 and Revision 2026 subjects...</div>`;
    const mode = grid.dataset.mode || "home";
    const fixedRevision = grid.dataset.revision;
    const department = grid.dataset.department;
    const preferredRevision = grid.dataset.defaultRevision || $("revisionFilter")?.value || (mode === "lessons" ? "2021" : "2026");
    const all = await getSubjects();

    // PERFORMANCE OPTIMIZATION: Pre-compute and cache search text for each subject
    // to avoid redundant string joins and lowercase conversions on every keystroke.
    all.forEach(subject => {
      subject._searchText = [
        subject.code,
        subject.name,
        subject.department,
        subject.semester,
        subject.type,
        subject.revision
      ].join(" ").toLowerCase();
    });

    fillRevision($("revisionFilter"), all, preferredRevision);

    const searchInput = $("subjectSearch");
    if (searchInput) {
      searchInput.setAttribute("aria-controls", "subjectGrid");
      searchInput.setAttribute("aria-describedby", "subjectBrowserAnnouncer");
    }
    const activeRevision = fixedRevision || $("revisionFilter")?.value || preferredRevision;
    const activeSubjects = all.filter(subject => activeRevision === "all" || String(subject.revision) === activeRevision);
    const preferredDepartment = activeRevision === "2021" && mode === "home" ? COMMON_VALUE : ALL_DEPARTMENTS;
    if (["home", "syllabus", "lessons", "papers"].includes(mode)) fillDepartment($("departmentFilter"), activeSubjects, preferredDepartment);
    fillSemester($("semesterFilter"), activeSubjects.map(subject => subject.semester), mode === "home" ? "Semester 1" : "all");

    let timer = 0;
    const rerender = () => { clearTimeout(timer); timer = setTimeout(() => render(all, grid, mode, fixedRevision, department), 120); };
    $("revisionFilter")?.addEventListener("change", () => {
      const revision = $("revisionFilter").value;
      const revisionSubjects = all.filter(subject => String(subject.revision) === revision);
      fillDepartment($("departmentFilter"), revisionSubjects, revision === "2021" && mode === "home" ? COMMON_VALUE : ALL_DEPARTMENTS);
      fillSemester($("semesterFilter"), revisionSubjects.map(subject => subject.semester), mode === "home" ? "Semester 1" : "all");
      rerender();
    });
    [$("subjectSearch"), $("semesterFilter"), $("departmentFilter")].forEach(control => {
      if (!control) return;
      // PERFORMANCE OPTIMIZATION: passive listeners keep scrolling smooth while the
      // user types in the search field after the (heavy) grid has rendered.
      control.addEventListener("input", rerender, { passive: true });
      control.addEventListener("change", rerender, { passive: true });
    });
    // PERFORMANCE OPTIMIZATION: render after the loading placeholder paints so the
    // user sees progress immediately instead of a frozen blank page while the
    // (heavy) 2026 data is being filtered and rendered.
    requestAnimationFrame(() => render(all, grid, mode, fixedRevision, department));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
