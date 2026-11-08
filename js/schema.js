// تعريف الاستبيان — مصدر واحد تستخدمه صفحة الاستبيان وصفحة التجميع
// Survey definition — shared by the survey page and the results page

export const SETTINGS = {
  // اجعلها true إذا تبي يظهر للمشارك زر "عرض النتائج" بعد الإرسال
  showResultsAfterSubmit: false,
};

const o = (v, ar, en) => ({ v, ar, en });

export const RATING_ITEMS = [
  o('r1', 'الأشجار والمساحات الخضراء', 'Trees and green areas'),
  o('r2', 'الظل فوق الجلسات والممرات', 'Shade over seats and paths'),
  o('r3', 'الراحة في حر العصر', 'Comfort in the afternoon heat'),
  o('r4', 'ممر المشي: اتصاله وعرضه', 'Walking path'),
  o('r5', 'مسار الدراجات', 'Cycle lane'),
  o('r6', 'سهولة الوصول للكراسي المتحركة وعربات الأطفال', 'Access for wheelchairs and strollers'),
  o('r7', 'المواقف', 'Parking'),
  o('r8', 'عدد المقاعد', 'Number of seats'),
  o('r9', 'المقاهي والأكشاك', 'Cafés and kiosks'),
  o('r10', 'النظافة', 'Cleanliness'),
  o('r11', 'دورات المياه ومياه الشرب', 'Toilets and drinking water'),
  o('r12', 'الإضاءة ليلاً', 'Lighting at night'),
  o('r13', 'الشعور بالأمان نهاراً', 'Feeling safe by day'),
  o('r14', 'الشعور بالأمان ليلاً', 'Feeling safe at night'),
];

export const RATING_SCALE = [
  { v: 1, ar: 'سيئ جداً', en: 'Very poor' },
  { v: 2, ar: '', en: '' },
  { v: 3, ar: '', en: '' },
  { v: 4, ar: '', en: '' },
  { v: 5, ar: 'ممتاز', en: 'Excellent' },
];

export const THERMAL = [
  { v: -3, ar: 'باردة جداً', en: 'Very cold' },
  { v: -2, ar: 'باردة', en: 'Cold' },
  { v: -1, ar: 'مائلة للبرودة', en: 'Slightly cool' },
  { v: 0, ar: 'معتدلة', en: 'Neutral' },
  { v: 1, ar: 'مائلة للحرارة', en: 'Slightly warm' },
  { v: 2, ar: 'حارة', en: 'Hot' },
  { v: 3, ar: 'حارة جداً', en: 'Very hot' },
];

export const SECTIONS = [
  {
    id: 'A', ar: 'زيارتك', en: 'Your visit',
    questions: [
      { id: 'q1', n: 1, type: 'single', ar: 'كم مرة تزور الواجهة؟', en: 'How often do you visit?', options: [
        o('first', 'أول مرة', 'First time'),
        o('weekly', 'أسبوعياً أو أكثر', 'Weekly or more'),
        o('monthly', 'شهرياً', 'Monthly'),
        o('few_year', 'مرات قليلة في السنة', 'A few times a year'),
      ]},
      { id: 'q2', n: 2, type: 'multi', ar: 'متى تأتي عادة؟', en: 'When do you usually come?', options: [
        o('dawn', 'الفجر والصباح الباكر', 'Dawn / early morning'),
        o('morning', 'الصباح', 'Morning'),
        o('noon', 'الظهر', 'Midday'),
        o('afternoon', 'العصر', 'Afternoon'),
        o('sunset', 'الغروب', 'Sunset'),
        o('evening', 'المساء والليل', 'Evening / night'),
      ]},
      { id: 'q3', n: 3, type: 'single', ar: 'أي الأيام؟', en: 'Which days?', options: [
        o('weekdays', 'أيام الأسبوع', 'Weekdays'),
        o('weekend', 'نهاية الأسبوع', 'Weekend'),
        o('both', 'الاثنين', 'Both'),
      ]},
      { id: 'q4', n: 4, type: 'single', ar: 'مع من تأتي عادة؟', en: 'Who do you come with?', options: [
        o('alone', 'وحدي', 'Alone'),
        o('family', 'مع العائلة', 'With family'),
        o('friends', 'مع الأصدقاء', 'With friends'),
      ]},
      { id: 'q5', n: 5, type: 'single', ar: 'كيف تصل إلى الواجهة؟', en: 'How do you get here?', options: [
        o('car', 'سيارة خاصة', 'Private car'),
        o('taxi', 'تاكسي أو تطبيق', 'Taxi / ride app'),
        o('walk', 'مشياً', 'Walking'),
        o('bike', 'دراجة أو سكوتر', 'Bike / scooter'),
        o('bus', 'حافلة', 'Bus'),
      ]},
      { id: 'q6', n: 6, type: 'single', ar: 'كم تبقى عادة في الزيارة؟', en: 'How long do you stay?', options: [
        o('lt30', 'أقل من 30 دقيقة', 'Under 30 min'),
        o('30_60', '30–60 دقيقة', '30–60 min'),
        o('1_2', '1–2 ساعة', '1–2 hours'),
        o('gt2', 'أكثر من ساعتين', 'Over 2 hours'),
      ]},
      { id: 'q7', n: 7, type: 'multi', ar: 'ماذا تفعل هنا؟', en: 'What do you do here?', options: [
        o('walk', 'المشي', 'Walking'),
        o('sea', 'الجلوس أمام البحر', 'Sitting by the sea'),
        o('sport', 'الرياضة أو الجري', 'Exercise / running'),
        o('cycle', 'الدراجة', 'Cycling'),
        o('kids', 'لعب الأطفال', 'Kids playing'),
        o('cafes', 'المقاهي والأكل', 'Cafés and food'),
        o('meet', 'لقاء العائلة أو الأصدقاء', 'Meeting family / friends'),
        o('beach', 'الشاطئ والسباحة', 'Beach and swimming'),
        o('events', 'الفعاليات', 'Events'),
        o('photo', 'التصوير', 'Photography'),
      ]},
      { id: 'q8', n: 8, type: 'multi', exclusive: ['no_sit'], ar: 'أين تفضّل الجلوس؟', en: 'Where do you prefer to sit?', options: [
        o('rail', 'عند سياج البحر', 'By the sea railing'),
        o('trees', 'تحت الأشجار', 'Under trees'),
        o('umbrellas', 'تحت المظلات', 'Under shade structures'),
        o('grass', 'على العشب', 'On the grass'),
        o('sand', 'على الرمل', 'On the sand'),
        o('cafes', 'قرب المقاهي والأكشاك', 'Near cafés / kiosks'),
        o('no_sit', 'لا أجلس', "I don't sit"),
      ]},
    ],
  },
  {
    id: 'B', ar: 'تقييمك من 1 إلى 5', en: 'Your rating',
    questions: [
      { id: 'q9', n: 9, type: 'rating', ar: 'قيّم ما يلي', en: 'Rate the following', items: RATING_ITEMS },
      { id: 'q10', n: 10, type: 'multi', max: 3, exclusive: ['none'], ar: 'ما أهم 3 أشياء تحتاج تحسين؟', en: 'Top 3 to improve', options: [
        o('shade', 'ظل أكثر', 'More shade'),
        o('seats', 'مقاعد أكثر', 'More seats'),
        o('trees', 'أشجار أكثر', 'More trees'),
        o('lighting', 'إضاءة أفضل', 'Better lighting'),
        o('toilets', 'دورات مياه', 'Toilets'),
        o('water', 'مياه شرب', 'Drinking water'),
        o('transit', 'نقل عام', 'Public transport'),
        o('cafes', 'مقاهٍ وأكشاك', 'Cafés and kiosks'),
        o('events', 'فعاليات', 'Events'),
        o('clean', 'النظافة', 'Cleanliness'),
        o('parking', 'المواقف', 'Parking'),
        o('none', 'لا شيء', 'Nothing'),
      ]},
    ],
  },
  {
    id: 'C', ar: 'الآن أثناء زيارتك', en: 'Right now',
    questions: [
      { id: 'q11', n: 11, type: 'thermal', ar: 'كيف تحس بالحرارة الآن؟', en: 'How does the temperature feel now?', options: THERMAL },
      { id: 'q12', n: 12, type: 'single', ar: 'أين أنت الآن؟', en: 'Where are you now?', options: [
        o('sun', 'في الشمس', 'In the sun'),
        o('tree', 'في ظل شجرة', 'In tree shade'),
        o('umbrella', 'تحت مظلة', 'Under a shade structure'),
        o('cafe', 'داخل مقهى أو كشك', 'Inside a café / kiosk'),
        o('not_here', 'لست في الواجهة الآن', 'Not at the waterfront now'),
      ]},
      { id: 'q13', n: 13, type: 'single', ar: 'هل تبقى وقتاً أطول لو كان الظل أكثر؟', en: 'Would you stay longer with more shade?', options: [
        o('yes', 'نعم', 'Yes'),
        o('maybe', 'ربما', 'Maybe'),
        o('no', 'لا', 'No'),
      ]},
      { id: 'q14', n: 14, type: 'single', ar: 'في الصيف، متى تفضّل المجيء؟', en: 'In summer, when do you prefer to come?', options: [
        o('morning', 'الصباح', 'Morning'),
        o('afternoon', 'العصر', 'Afternoon'),
        o('sunset', 'الغروب', 'Sunset'),
        o('evening', 'المساء والليل', 'Evening / night'),
        o('no_summer', 'لا آتي في الصيف', "I don't come in summer"),
      ]},
    ],
  },
  {
    id: 'D', ar: 'عنك', en: 'About you',
    questions: [
      { id: 'q15', n: 15, type: 'single', ar: 'الفئة العمرية', en: 'Age group', options: [
        o('18_24', '18–24', '18–24'), o('25_34', '25–34', '25–34'), o('35_44', '35–44', '35–44'),
        o('45_54', '45–54', '45–54'), o('55p', '55+', '55+'),
      ]},
      { id: 'q16', n: 16, type: 'single', ar: 'الجنس', en: 'Gender', options: [
        o('m', 'ذكر', 'Male'), o('f', 'أنثى', 'Female'), o('na', 'أفضّل عدم الإجابة', 'Prefer not to say'),
      ]},
      { id: 'q17', n: 17, type: 'single', ar: 'أين تسكن؟', en: 'Where do you live?', options: [
        o('obhur', 'جدة، في أبحر أو قريب منها', 'Jeddah, in or near Obhur'),
        o('jeddah', 'جدة، حي آخر', 'Jeddah, another district'),
        o('outside', 'خارج جدة', 'Outside Jeddah'),
      ]},
      { id: 'q18', n: 18, type: 'text', optional: true, max: 1000, ar: 'ملاحظات أو اقتراحات', en: 'Comments (optional)' },
    ],
  },
];

export const ALL_Q = SECTIONS.flatMap(s => s.questions);
export const Q = Object.fromEntries(ALL_Q.map(q => [q.id, q]));

export function optLabel(qid, v) {
  const q = Q[qid];
  const opt = (q?.options || []).find(x => String(x.v) === String(v));
  return opt ? opt.ar : String(v ?? '');
}
