/* BIG JEFF SOLAR — category landing page */
const CONTENT = {
  'solar-street-lights': {
    tag: 'Light up streets, estates & compounds',
    intro: 'All-in-one and high-power solar street lights that switch on at dusk and off at dawn. No electricity bills, no cables to run.',
    guide: ['Pick the wattage by area: small lanes and gates need less, wide roads and markets need more.', 'Choose lights with a motion or light sensor and a remote for easy control.', 'Check the IP rating (IP65 or IP67) for rain and dust, and ask about the warranty.', 'Plan your pole height and mounting before you buy.'],
    faq: [['Do solar street lights work when it rains?', 'Yes. The battery stores energy during the day, so lights keep working through cloudy or rainy nights, though very long rainy spells can shorten run time.'], ['Do I need a pole?', 'Most units mount on a pole or wall. Some come with a mounting tube and bracket. Ask us what is included.'], ['Can I buy in bulk for an estate?', 'Yes. Message us on WhatsApp with the quantity for a bulk quote.']]
  },
  'solar-floodlights': {
    tag: 'Bright security light for gates, shops & yards',
    intro: 'Solar floodlights with their own panel and remote control. Great for gates, shops, warehouses, car parks and gardens.',
    guide: ['Higher wattage means a wider, brighter spread. Match it to the area you want to cover.', 'Models with two panels charge faster and last longer at night.', 'Place the panel where it gets direct sun all day, even if the light is in the shade.', 'A remote lets you adjust brightness and timer from a distance.'],
    faq: [['How long does a floodlight stay on?', 'It depends on sunlight and the model. Many run through the night after a full sunny day of charging.'], ['Can the panel be separate from the light?', 'Yes, our floodlights come with a separate panel on a cable so you can place it in full sun.'], ['Is installation difficult?', 'No. Fix the light, place the panel in the sun, and switch on.']]
  },
  'solar-fans': {
    tag: 'Stay cool without NEPA',
    intro: 'Energy-saving fans that run on solar power. Quiet, strong airflow for bedrooms, shops and offices.',
    guide: ['Check whether the fan runs on DC solar directly or needs a battery or inverter.', 'Choose blade size by room size.', 'Look for a quiet motor if it is for a bedroom.'],
    faq: [['Can the fan run at night?', 'Only if it is connected to a battery or inverter system that stores solar power.'], ['Does it work with a home solar system?', 'Yes. Ask us to confirm it matches your system.'], ['Is it really cheaper to run?', 'Yes. Solar fans use very little power and cut your fuel and light bills.']]
  },
  'solar-home-systems': {
    tag: 'Power your home with the sun',
    intro: 'Complete solar kits and systems for homes and small businesses. Light, fans, TV, phones and more.',
    guide: ['List the appliances you want to run and their wattage.', 'Decide how many hours of backup you need at night.', 'Match panel, inverter and battery sizes so they work well together.', 'Ask us for a sizing recommendation before you buy.'],
    faq: [['What size system do I need?', 'It depends on your appliances and hours of use. Send us your list on WhatsApp and we will recommend one.'], ['Can I expand later?', 'Yes. Most systems can grow with more panels or batteries if the inverter allows.'], ['Do you install?', 'Ask us on WhatsApp about installation options in your area.']]
  },
  'solar-panels': {
    tag: 'Efficient panels for homes, shops & projects',
    intro: 'High-efficiency solar panels with tough frames and tempered glass. Single pieces or bulk quantities.',
    guide: ['Match panel voltage and total watts to your inverter or charge controller.', 'Monocrystalline panels give more power in less space.', 'Think about roof space and direction before choosing quantity.'],
    faq: [['Do you sell in bulk?', 'Yes. Contact us with the quantity you need for importer pricing.'], ['How long do panels last?', 'Good panels last many years. Ask us about the warranty for the model you choose.'], ['How many panels do I need?', 'It depends on your load. We can help you calculate it.']]
  },
  'batteries-and-inverters': {
    tag: 'Store solar power and run it day and night',
    intro: 'Lithium batteries, hybrid inverters and backup storage from brands like Felicity, SMS, itel and Cworth.',
    guide: ['Lithium (LiFePO4) batteries last longer and need less care than traditional batteries.', 'Match battery voltage and capacity (kWh) to your inverter.', 'Choose wall-mount to save space, or floor-standing on wheels for easy moving.', 'Ask about the supported inverter ratings before buying.'],
    faq: [['Which battery works with which inverter?', 'Voltage and communication must match. Tell us your inverter model and we will confirm.'], ['How many hours of backup will I get?', 'It depends on battery size and your load. Send us your appliances for an estimate.'], ['Can I add more batteries later?', 'Many models can be stacked or paralleled. Ask us about the model you want.']]
  },
  'led-bulbs-and-lamps': {
    tag: 'Bright light that keeps working',
    intro: 'Rechargeable and energy-saving LED bulbs and lamps for homes, shops and emergencies.',
    guide: ['Check brightness (watts or lumens) and battery life.', 'Rechargeable bulbs are ideal for blackouts.', 'Choose warm or cool white to suit the room.'],
    faq: [['Can I charge them with solar?', 'Many can charge from solar or a phone charger. Check the model details.'], ['How long do they last?', 'LED bulbs last far longer than regular bulbs. Ask about the specific model.'], ['Do you sell sets?', 'Yes. Ask us for multi-bulb sets and bulk prices.']]
  },
  'cctv-security': {
    tag: 'Watch your property from your phone',
    intro: 'Solar PTZ security cameras with 4G, colour night view and auto tracking. No cables and no power socket needed.',
    guide: ['More megapixels give a sharper picture, but dual and triple lens models also cover a wider area.', 'Choose 4G cameras for places without Wi-Fi.', 'Look for auto tracking, two-way audio and a siren for stronger deterrence.', 'Fit the solar panel where it gets direct sun for continuous charging.'],
    faq: [['Do I need Wi-Fi?', 'No. The 4G models use a SIM and you view them from the app.'], ['Does the SIM need NIN registration?', 'On the models whose boxes say so, no. Renewals are done in the Ubox app.'], ['Will it work at night?', 'Yes. These cameras have lights for colour night view.']]
  },
  'solar-accessories': {
    tag: 'Cables, brackets, controllers & more',
    intro: 'Everything you need to complete your solar setup.',
    guide: ['Use the right cable size for your current.', 'Match charge controllers to panel and battery voltage.', 'Ask us if you are unsure what you need.'],
    faq: [['Can you help me pick accessories?', 'Yes. Tell us your setup on WhatsApp.'], ['Do you have stock?', 'Contact us to confirm stock before you visit.'], ['Do you sell in bulk?', 'Yes. Ask for a quote.']]
  }
};
const DEFAULT_CONTENT = { tag: 'Quality solar products at importer prices', intro: 'Browse our range and order on WhatsApp.', guide: ['Tell us what you need and we will recommend the right product.'], faq: [['Is this in stock?', 'Message us on WhatsApp to confirm availability.']] };


const slug = decodeURIComponent((location.pathname.match(/\/category\/([^/?#]+)/) || [])[1] || '');
const CS = { list: [], query: '', sort: 'featured' };

function renderList() {
  let list = CS.list.slice();
  if (CS.query) { const q = CS.query.toLowerCase(); list = list.filter(p => [p.name, p.description].some(x => (x || '').toLowerCase().includes(q))); }
  list.sort((a, b) => CS.sort === 'az' ? (a.name || '').localeCompare(b.name || '') : CS.sort === 'new' ? (b.createdAt || 0) - (a.createdAt || 0)
    : (Number(!!b.featured) - Number(!!a.featured)) || ((b.createdAt || 0) - (a.createdAt || 0)));
  $('#emptyState').hidden = list.length > 0;
  $('#productGrid').innerHTML = list.map(cardHTML).join('');
}
async function bootCategory() {
  await coreInit();
  const name = BJ.categories.find(c => slugify(c) === slug);
  $('#catStrip').innerHTML = BJ.categories.map(c => `<a href="/category/${slugify(c)}" class="chip${slugify(c) === slug ? ' active' : ''}">${catIcon(c)} ${esc(c)}</a>`).join('');
  const act = $('#catStrip .active'); if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#catGrid').innerHTML = BJ.categories.filter(c => slugify(c) !== slug).map(catTile).join('');
  if (!name) {
    $('#chTitle').textContent = 'Category not found'; $('#crumbName').textContent = 'Not found';
    $('#chIntro').textContent = 'Pick a category below or message us on WhatsApp.'; $('#shop').hidden = true; return;
  }
  const info = CONTENT[slug] || DEFAULT_CONTENT;
  CS.list = BJ.products.filter(p => (p.category || '').toLowerCase() === name.toLowerCase());
  const msg = `Hello ${BRAND}, I am interested in ${name}. Please send me available options and prices.`;
  document.title = `${name} for Sale in Lagos — ${BRAND}`;
  $('#metaDesc').content = `${info.intro} Shop ${name.toLowerCase()} at ${BRAND}, Alaba International Market, Lagos.`;
  $('#crumbName').textContent = name; $('#chIcon').textContent = catIcon(name);
  const ph = catPhoto(name), phEl = $('#chPhoto'); if (ph) { phEl.src = ph; phEl.alt = name; phEl.hidden = false; }
  $('#chTitle').textContent = name; $('#chTag').textContent = info.tag; $('#chIntro').textContent = info.intro;
  $('#chCount').textContent = CS.list.length;
  ['chWa', 'ctaWa', 'emptyWa'].forEach(id => $('#' + id).href = waLink(msg));
  $('#ctaTitle').textContent = `Need help choosing ${name.toLowerCase()}?`;
  $('#guideList').innerHTML = info.guide.map(g => `<li>${esc(g)}</li>`).join('');
  $('#faqList').innerHTML = info.faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  renderList();
}
$('#searchInput').addEventListener('input', e => { CS.query = e.target.value.trim(); renderList(); });
$('#sortSel').addEventListener('change', e => { CS.sort = e.target.value; renderList(); });
bootCategory();
