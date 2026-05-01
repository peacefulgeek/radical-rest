// src/data/product-catalog.mjs
// Niche-specific product catalog for Radical Rest. ASINs are real Amazon
// product IDs in the categories below. The verifier (Phase C) HEAD/GETs each
// before embedding. Failed ASINs are flagged and skipped at injection time.

export const CATEGORIES = [
  'rest-burnout-books',
  'sleep-optimization',
  'adrenal-supplements',
  'tcm-kidney-herbs',
  'restorative-yoga-props',
  'aromatherapy',
  'journaling-tools',
  'meditation-cushions-noise',
  'digital-detox-tools',
  'bath-somatic-rest',
];

export const PRODUCTS = [
  // ----- rest-burnout-books -----
  { name: 'Rest Is Resistance by Tricia Hersey', asin: '0316365211', category: 'rest-burnout-books', tags: ['nap','rest','burnout','hersey','anti-hustle'] },
  { name: 'Burnout: The Secret to Unlocking the Stress Cycle by Emily and Amelia Nagoski', asin: '1984817078', category: 'rest-burnout-books', tags: ['burnout','stress','nervous-system','women'] },
  { name: 'Sacred Rest by Saundra Dalton-Smith MD', asin: '154603975X', category: 'rest-burnout-books', tags: ['7-types-of-rest','rest','burnout'] },
  { name: 'Laziness Does Not Exist by Devon Price PhD', asin: '198214834X', category: 'rest-burnout-books', tags: ['anti-hustle','laziness','burnout'] },
  { name: "Can't Even by Anne Helen Petersen", asin: '1328507866', category: 'rest-burnout-books', tags: ['millennial','burnout','culture'] },
  { name: 'Rest: Why You Get More Done When You Work Less by Alex Soojung-Kim Pang', asin: '0465074871', category: 'rest-burnout-books', tags: ['rest','productivity','science'] },
  { name: 'Do Nothing by Celeste Headlee', asin: '1984824724', category: 'rest-burnout-books', tags: ['anti-hustle','rest','overwork'] },
  { name: 'When the Body Says No by Gabor Maté', asin: '1785042225', category: 'rest-burnout-books', tags: ['stress','body','disease','overwork'] },
  { name: 'Why We Sleep by Matthew Walker', asin: '1501144316', category: 'rest-burnout-books', tags: ['sleep','science','recovery'] },
  { name: 'The Body Keeps the Score by Bessel van der Kolk', asin: '0143127748', category: 'rest-burnout-books', tags: ['trauma','nervous-system','body'] },
  { name: 'Wintering by Katherine May', asin: '0593189000', category: 'rest-burnout-books', tags: ['rest','winter','recovery'] },
  { name: 'How to Do Nothing by Jenny Odell', asin: '1612197493', category: 'rest-burnout-books', tags: ['attention','rest','anti-hustle'] },
  { name: 'The Nap Ministry’s Rest Deck by Tricia Hersey', asin: '1797221299', category: 'rest-burnout-books', tags: ['rest','cards','nap'] },
  { name: 'Four Thousand Weeks by Oliver Burkeman', asin: '0374159122', category: 'rest-burnout-books', tags: ['time','anti-hustle','mortality'] },
  { name: 'The Burnout Society by Byung-Chul Han', asin: '0804795096', category: 'rest-burnout-books', tags: ['burnout','philosophy','culture'] },
  { name: 'Bittersweet by Susan Cain', asin: '0451499786', category: 'rest-burnout-books', tags: ['emotion','rest','grief'] },
  { name: 'The Comfort Book by Matt Haig', asin: '0143136666', category: 'rest-burnout-books', tags: ['rest','mental-health','comfort'] },

  // ----- sleep-optimization -----
  { name: 'YnM Weighted Blanket 15 lbs', asin: 'B073429SVZ', category: 'sleep-optimization', tags: ['weighted-blanket','sleep','anxiety'] },
  { name: 'Bearaby Cotton Napper Weighted Blanket', asin: 'B07YFP4Z9N', category: 'sleep-optimization', tags: ['weighted-blanket','sleep'] },
  { name: 'MZOO Sleep Eye Mask (3D Contoured)', asin: 'B07KC5DWCC', category: 'sleep-optimization', tags: ['eye-mask','sleep'] },
  { name: 'Manta Sleep Mask Pro', asin: 'B07RZG7ZG2', category: 'sleep-optimization', tags: ['eye-mask','sleep','blackout'] },
  { name: 'Doctor’s Best High Absorption Magnesium Glycinate 200 mg', asin: 'B000BD0RT0', category: 'sleep-optimization', tags: ['magnesium','sleep','muscle'] },
  { name: 'Natural Vitality Calm Magnesium Powder', asin: 'B00BPUY3W0', category: 'sleep-optimization', tags: ['magnesium','calm','sleep'] },
  { name: 'Pure Encapsulations Magnesium Glycinate', asin: 'B0017CW0AY', category: 'sleep-optimization', tags: ['magnesium','sleep'] },
  { name: 'Olly Sleep Gummies (Melatonin + L-Theanine)', asin: 'B01M0H0MNQ', category: 'sleep-optimization', tags: ['melatonin','sleep'] },
  { name: 'NOW Foods Melatonin 1 mg (low dose)', asin: 'B000BD0RWC', category: 'sleep-optimization', tags: ['melatonin','sleep','low-dose'] },
  { name: 'Hatch Restore Sound Machine and Sunrise Alarm', asin: 'B0BMSZ7K1G', category: 'sleep-optimization', tags: ['sleep','alarm','sunrise'] },
  { name: 'Philips SmartSleep Wake-Up Light HF3520', asin: 'B0093162RM', category: 'sleep-optimization', tags: ['sunrise','alarm','sleep'] },
  { name: 'Dodow Sleep Aid Device', asin: 'B07RPHXJ5L', category: 'sleep-optimization', tags: ['sleep','breath','device'] },

  // ----- adrenal-supplements -----
  { name: 'Gaia Herbs Ashwagandha Root 350 mg', asin: 'B0009F3SAU', category: 'adrenal-supplements', tags: ['ashwagandha','adrenal','adaptogen'] },
  { name: 'KSM-66 Ashwagandha by NutriRise', asin: 'B07RKZ57NB', category: 'adrenal-supplements', tags: ['ashwagandha','ksm-66','adrenal'] },
  { name: 'Gaia Herbs Rhodiola Rosea 240 mg', asin: 'B0017OAQGW', category: 'adrenal-supplements', tags: ['rhodiola','adaptogen','adrenal'] },
  { name: 'NOW Rhodiola 500 mg', asin: 'B001UJEOPC', category: 'adrenal-supplements', tags: ['rhodiola','adaptogen'] },
  { name: 'Gaia Herbs Holy Basil Leaf', asin: 'B000FGYI1A', category: 'adrenal-supplements', tags: ['tulsi','holy-basil','adaptogen'] },
  { name: 'Organic India Tulsi Holy Basil', asin: 'B00014EB6Y', category: 'adrenal-supplements', tags: ['tulsi','adaptogen','tea'] },
  { name: 'Thorne Stress B-Complex', asin: 'B0797DT332', category: 'adrenal-supplements', tags: ['b-vitamins','adrenal','stress'] },
  { name: 'Pure Encapsulations B-Complex Plus', asin: 'B0017OF60E', category: 'adrenal-supplements', tags: ['b-vitamins','energy','adrenal'] },
  { name: 'NOW Vitamin C-1000 with Bioflavonoids', asin: 'B0013OXKHC', category: 'adrenal-supplements', tags: ['vitamin-c','adrenal','immune'] },
  { name: 'Pure Encapsulations Adrenal Support', asin: 'B005DT5T6E', category: 'adrenal-supplements', tags: ['adrenal','glandular','support'] },
  { name: 'Standard Process Drenamin', asin: 'B0014BAKB6', category: 'adrenal-supplements', tags: ['adrenal','b-vitamins','support'] },
  { name: 'Designs for Health Adrenotone', asin: 'B003QXGP9I', category: 'adrenal-supplements', tags: ['adrenal','adaptogen','blend'] },
  { name: 'Sun Potion Ashwagandha Powder', asin: 'B00H1XKPWU', category: 'adrenal-supplements', tags: ['ashwagandha','powder','adaptogen'] },

  // ----- tcm-kidney-herbs -----
  { name: 'Plum Flower He Shou Wu Teapills', asin: 'B007VWKAXI', category: 'tcm-kidney-herbs', tags: ['he-shou-wu','tcm','kidney','jing'] },
  { name: 'Dragon Herbs He Shou Wu', asin: 'B0009Y8B0Q', category: 'tcm-kidney-herbs', tags: ['he-shou-wu','jing','tcm'] },
  { name: 'Plum Flower Liu Wei Di Huang Wan (Six Flavor Teapills)', asin: 'B001G7QNKK', category: 'tcm-kidney-herbs', tags: ['liu-wei','kidney-yin','tcm'] },
  { name: 'Plum Flower Rehmannia Eight Teapills (Jin Gui Shen Qi Wan)', asin: 'B000Q49JG0', category: 'tcm-kidney-herbs', tags: ['rehmannia','kidney-yang','tcm'] },
  { name: 'Dragon Herbs Goji Berries (Premium)', asin: 'B0083GAWVG', category: 'tcm-kidney-herbs', tags: ['goji','jing','tcm','kidney'] },
  { name: 'Dragon Herbs Schizandra Drops', asin: 'B0009Y8GHW', category: 'tcm-kidney-herbs', tags: ['schizandra','adrenal','tcm'] },
  { name: 'Dragon Herbs Eagle Eye (Astragalus)', asin: 'B07K2D6KSL', category: 'tcm-kidney-herbs', tags: ['astragalus','qi','tcm'] },
  { name: 'Plum Flower Bu Zhong Yi Qi Wan', asin: 'B000Q49I92', category: 'tcm-kidney-herbs', tags: ['qi-tonic','tcm','spleen'] },
  { name: 'Dragon Herbs Cordyceps Drops', asin: 'B0009Y8GW6', category: 'tcm-kidney-herbs', tags: ['cordyceps','kidney','energy','tcm'] },
  { name: 'Sun Potion Reishi Mushroom Powder', asin: 'B00FFJSFM6', category: 'tcm-kidney-herbs', tags: ['reishi','calm','immune'] },

  // ----- restorative-yoga-props -----
  { name: 'Hugger Mugger Standard Yoga Bolster', asin: 'B000PQH9GI', category: 'restorative-yoga-props', tags: ['bolster','restorative-yoga'] },
  { name: 'Manduka Enlight Rectangular Bolster', asin: 'B07JLTF935', category: 'restorative-yoga-props', tags: ['bolster','restorative-yoga'] },
  { name: 'Yoga Direct Cotton Yoga Blanket', asin: 'B000G18A6Q', category: 'restorative-yoga-props', tags: ['blanket','restorative-yoga'] },
  { name: 'Mexican-Style Yoga Blanket (Multi)', asin: 'B07L6RG3RS', category: 'restorative-yoga-props', tags: ['blanket','yoga'] },
  { name: 'DreamTime Inner Peace Lavender Eye Pillow', asin: 'B0007KGLYO', category: 'restorative-yoga-props', tags: ['eye-pillow','lavender','rest'] },
  { name: 'Bean Products Lavender Flax Eye Pillow', asin: 'B005CUKAQE', category: 'restorative-yoga-props', tags: ['eye-pillow','rest'] },
  { name: 'Hugger Mugger Cork Yoga Block', asin: 'B0010OMTUQ', category: 'restorative-yoga-props', tags: ['block','yoga'] },
  { name: 'Manduka Recycled Foam Block', asin: 'B07K1DS2Y9', category: 'restorative-yoga-props', tags: ['block','yoga'] },
  { name: 'Hugger Mugger 8 ft Cotton Yoga Strap', asin: 'B005FGRQDM', category: 'restorative-yoga-props', tags: ['strap','yoga'] },

  // ----- aromatherapy -----
  { name: 'Plant Therapy Lavender Essential Oil', asin: 'B005V8XCYK', category: 'aromatherapy', tags: ['lavender','sleep','calm'] },
  { name: 'Plant Therapy Roman Chamomile Essential Oil', asin: 'B00CB80RIG', category: 'aromatherapy', tags: ['chamomile','calm','sleep'] },
  { name: 'Plant Therapy Vetiver Essential Oil', asin: 'B005V8XEUO', category: 'aromatherapy', tags: ['vetiver','grounding','rest'] },
  { name: 'Now Essential Oils Frankincense', asin: 'B00OFNG8VS', category: 'aromatherapy', tags: ['frankincense','calm'] },
  { name: 'Vitruvi Stone Diffuser', asin: 'B01BX1XAFA', category: 'aromatherapy', tags: ['diffuser','design','aromatherapy'] },
  { name: 'URPOWER 500ml Essential Oil Diffuser', asin: 'B07VHQS5PN', category: 'aromatherapy', tags: ['diffuser','aromatherapy'] },
  { name: 'InnoGear 150ml Aromatherapy Diffuser', asin: 'B01N6F2Q5H', category: 'aromatherapy', tags: ['diffuser','aromatherapy'] },
  { name: 'Saje Tranquility Diffuser Blend', asin: 'B07V13G8NL', category: 'aromatherapy', tags: ['blend','calm','sleep'] },

  // ----- journaling-tools -----
  { name: 'Leuchtturm1917 A5 Hardcover Notebook (Dotted)', asin: 'B00ENNQ3MK', category: 'journaling-tools', tags: ['journal','dotted','leuchtturm'] },
  { name: 'Moleskine Classic Notebook Large Hard Cover', asin: 'B00C7G7G84', category: 'journaling-tools', tags: ['journal','moleskine'] },
  { name: 'The Five Minute Journal by Intelligent Change', asin: '0991846206', category: 'journaling-tools', tags: ['gratitude','journal','simple'] },
  { name: 'Hobonichi Techo Cousin A5', asin: 'B0BPK16M11', category: 'journaling-tools', tags: ['planner','journal'] },
  { name: 'Pilot G2 Premium Gel Pens 12-Pack', asin: 'B009HEQHWU', category: 'journaling-tools', tags: ['pens','journaling'] },
  { name: 'Uniball Signo 207 Gel Pens 8-Pack', asin: 'B07JMFKHFD', category: 'journaling-tools', tags: ['pens','journaling'] },
  { name: 'Burn After Writing by Sharon Jones', asin: '0593329503', category: 'journaling-tools', tags: ['journal','prompts','self-reflection'] },

  // ----- meditation-cushions-noise -----
  { name: 'Florensi Meditation Cushion (Buckwheat-Filled)', asin: 'B07T7P7B2T', category: 'meditation-cushions-noise', tags: ['cushion','meditation'] },
  { name: 'Brentwood Home Crystal Cove Meditation Cushion', asin: 'B07PXCDQRL', category: 'meditation-cushions-noise', tags: ['cushion','meditation'] },
  { name: 'Yogibo Zafu Meditation Cushion', asin: 'B086VHMJXV', category: 'meditation-cushions-noise', tags: ['cushion','meditation'] },
  { name: 'LectroFan Classic White Noise Machine', asin: 'B00MFRWPXC', category: 'meditation-cushions-noise', tags: ['white-noise','sleep','focus'] },
  { name: 'Yogasleep Dohm Classic White Noise Machine', asin: 'B00A2JBME8', category: 'meditation-cushions-noise', tags: ['white-noise','sleep'] },
  { name: 'Realyou Earthing Grounding Mat (Universal)', asin: 'B07F1XB2Q4', category: 'meditation-cushions-noise', tags: ['grounding','earthing','rest'] },

  // ----- digital-detox-tools -----
  { name: 'Kitchen Safe Time-Locking Container', asin: 'B00JGFDOPS', category: 'digital-detox-tools', tags: ['phone-lockbox','detox','focus'] },
  { name: 'YONDR Phone Locking Pouch (Personal)', asin: 'B07XKZ8VQY', category: 'digital-detox-tools', tags: ['phone-pouch','detox'] },
  { name: 'Peakeep Twin Bell Analog Alarm Clock', asin: 'B019NJZNCM', category: 'digital-detox-tools', tags: ['analog-alarm','sleep'] },
  { name: 'Marathon Silent Non-Ticking Alarm Clock', asin: 'B07Y57R29D', category: 'digital-detox-tools', tags: ['analog-alarm','sleep'] },
  { name: 'Kindle Paperwhite (16 GB)', asin: 'B09TMK7QQ8', category: 'digital-detox-tools', tags: ['kindle','reading','detox'] },
  { name: 'Light Phone II', asin: 'B08YLN6T5G', category: 'digital-detox-tools', tags: ['minimal-phone','detox'] },
  { name: 'Tile Mate Analog Pocket Notebook (Field Notes 3-Pack)', asin: 'B009H7VR0K', category: 'digital-detox-tools', tags: ['paper-notes','analog'] },

  // ----- bath-somatic-rest -----
  { name: 'Dr Teal’s Pure Epsom Salt Soaking Solution Lavender', asin: 'B001ET76EC', category: 'bath-somatic-rest', tags: ['epsom-salt','bath','magnesium'] },
  { name: 'Epsoak Epsom Salt 19 lb Bag', asin: 'B00LZ2BIDQ', category: 'bath-somatic-rest', tags: ['epsom-salt','bath'] },
  { name: 'Royal Craft Wood Bamboo Bath Caddy Tray', asin: 'B01M0XYWP0', category: 'bath-somatic-rest', tags: ['bath-tray','rest'] },
  { name: 'Sunbeam Heating Pad XL', asin: 'B07R8LXPPD', category: 'bath-somatic-rest', tags: ['heating-pad','rest','pain'] },
  { name: 'Pure Enrichment PureRelief XL Heating Pad', asin: 'B011RNTOKO', category: 'bath-somatic-rest', tags: ['heating-pad','rest'] },
  { name: 'BodyRestore Shower Steamers (Variety Pack)', asin: 'B07YBHRPYM', category: 'bath-somatic-rest', tags: ['shower-steamer','aromatherapy'] },
];

export function productsForTopic(topic, n = 8) {
  const t = String(topic).toLowerCase();
  const score = (p) => {
    let s = 0;
    for (const tag of p.tags || []) {
      if (t.includes(tag.replace(/-/g, ' ')) || t.includes(tag)) s += 5;
    }
    if (t.includes(p.category.split('-')[0])) s += 1;
    return s;
  };
  const ranked = PRODUCTS.map(p => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s);
  // ensure category diversity
  const out = [];
  const seenCats = new Set();
  for (const r of ranked) {
    if (out.length >= n) break;
    if (seenCats.has(r.p.category) && out.length < n - 2) continue;
    seenCats.add(r.p.category);
    out.push(r.p);
  }
  // top up with anything if scores are sparse
  if (out.length < n) {
    for (const p of PRODUCTS) {
      if (out.length >= n) break;
      if (!out.find(x => x.asin === p.asin)) out.push(p);
    }
  }
  return out;
}
