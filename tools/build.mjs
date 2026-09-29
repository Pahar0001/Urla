// Сборка статических страниц сайта отеля «ЮрЛа».
// node tools/build.mjs — пишет index.html, rooms/*.html, rybinsk.html, 404.html, credits.html
// и переадресации со старых адресов (Nomera.html, Restoran.html …).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hotel, home, booking, rooms, rules, rybinsk } from './content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photos = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/photos.json'), 'utf8'));
const LOGO = fs.readFileSync(path.join(ROOT, 'img/logo.svg'), 'utf8').trim()
  .replace(' role="img" aria-label="ЮрЛа"', ' aria-hidden="true" focusable="false"');

/* ---------- набор: неразрывные пробелы в данных, а не скриптом на странице ---------- */
const NB = ' ';
// короткое слово держится за следующее; просмотр назад не съедает пробел, поэтому «и с трансфером» — оба
const SHORT = /(?<=^|[\s(«„])(в|во|и|к|ко|с|со|у|о|об|а|на|по|до|за|из|от|не|но|ни|же|ли|бы|для|при|без|над|под|про|или|что|как|все|всё|это|мы|вы|он|её|их|его|то|нет|да) (?=\S)/gi;
function typo(s) {
  return String(s)
    .replace(/(\d) (\d{3})(?!\d)/g, `$1${NB}$2`)                  // 4 700
    .replace(/(\d) (₽|км|см|м|%|человек|гостей|гостя|гость|тысяч|года|году|годах)/g, `$1${NB}$2`)
    .replace(SHORT, `$1${NB}`)
    .replace(/ (—|–) /g, `${NB}$1 `)
    .replace(/№ /g, `№${NB}`)
    .replace(/Wi-Fi/g, 'Wi\u2011Fi');                              // неразрывный дефис
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (s) => esc(typo(s));

/* ---------- значки: линия 1.5 px, как у донора ---------- */
const ICONS = {
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 15.9a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  parking: '<rect x="4" y="3" width="16" height="18"/><path d="M9.5 16.5v-9h3.2a2.6 2.6 0 0 1 0 5.2H9.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  dish: '<path d="M7 3v6.5a2 2 0 0 0 2 2m0 0a2 2 0 0 0 2-2V3M9 3v18M9 11.5V21"/><path d="M17 21V3c-2.2 1.6-3 4.4-3 8v2h3"/>',
  nosmoke: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/><path d="M6.5 13h7M16 13h1.5"/>',
  phone: '<path d="M5 4h3.5l1.8 4.3-2.3 1.5a11 11 0 0 0 5.2 5.2l1.5-2.3L19 14.5V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
  camera: '<path d="M3.5 8h4L9 6h6l1.5 2h4v11h-17z"/><circle cx="12" cy="13" r="3.5"/><path d="M6 10.5h1"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  guest: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5"/><circle cx="7" cy="11" r="1.8"/>',
  balcony: '<path d="M7 11V4h10v7M4 11h16M4 11v9h16v-9M8 11v9M12 11v9M16 11v9"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',
  heat: '<path d="M3 20h18"/><path d="M7 16c-1.2-1.3-1.2-2.7 0-4s1.2-2.7 0-4M12 16c-1.2-1.3-1.2-2.7 0-4s1.2-2.7 0-4M17 16c-1.2-1.3-1.2-2.7 0-4s1.2-2.7 0-4"/>',
  shower: '<path d="M6 21V7a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1"/><path d="M9.5 8.5h7"/><path d="M11 12v1M13.5 12v1M16 12v1M12 15v1M14.7 15v1"/>',
  bath: '<path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
  tv: '<rect x="3" y="5" width="18" height="12"/><path d="M8 21h8M12 17v4"/>',
  safe: '<rect x="4" y="4" width="16" height="15"/><circle cx="12" cy="11.5" r="3"/><path d="M12 8.5v1M7 19v2M17 19v2"/>',
  fridge: '<rect x="6" y="3" width="12" height="18"/><path d="M6 10h12M9 6v2M9 13v3"/>',
  desk: '<path d="M3 8h18M5 8v12M19 8v12M13 8v6h6"/>',
  wardrobe: '<rect x="5" y="3" width="14" height="18"/><path d="M12 3v18M10 11v2M14 11v2"/>',
  dryer: '<path d="M14 5H9a5 5 0 0 0 0 10h5l6 2V3z"/><path d="M9 15l-1 6h3l1-6"/><circle cx="9" cy="10" r="1.6"/>',
  sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM5 18v2M19 18v2"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4V8h4V4h2"/>',
  robe: '<path d="M9 3l3 4 3-4 4 3-2 5v10H7V11L5 6z"/><path d="M12 7v14"/>',
  mirror: '<ellipse cx="12" cy="9" rx="5" ry="6"/><path d="M4 21h16M8 17h8M12 15v2"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  back: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
  chevl: '<path d="M15 5l-7 7 7 7"/>',
  chevr: '<path d="M9 5l7 7-7 7"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  close: '<path d="M5 5l14 14M19 5L5 19"/>',
  menu: '<path d="M4 8h16M9 15h11"/>',
  up: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
};
const LABELS = { wifi: 'Wi-Fi', tv: 'Телевизор', safe: 'Сейф', desk: 'Письменный стол', wardrobe: 'Шкаф', shower: 'Душ', dryer: 'Фен', fridge: 'Холодильник', heat: 'Тёплый пол', balcony: 'Балкон', snow: 'Кондиционер', bath: 'Ванна', robe: 'Халат', sofa: 'Раскладной диван', stairs: 'Два уровня', bed: 'Кровать', mirror: 'Туалетный столик' };
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</defs></svg>`;
const icon = (k, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${k}"/></svg>`;

/* ---------- картинки ---------- */
function pic(key, rel, { sizes = '100vw', cls = '', loading = 'lazy', alt = null, priority = false, attrs = '', lazyData = false } = {}) {
  const p = photos[key];
  if (!p) throw new Error('нет фото ' + key);
  const files = p.files.filter((f) => !f.upscaled || key === 'facade-evening');
  const big = files[files.length - 1];
  const srcset = files.map((f) => `${rel}${f.file} ${f.w}w`).join(', ');
  const a = esc(alt == null ? p.alt : alt);
  const w = big.upscaled ? 1920 : p.w, h = big.upscaled ? Math.round(1920 * p.h / p.w) : p.h;
  const src = `${rel}${big.file}`;
  const lz = lazyData ? `data-src="${src}" data-srcset="${srcset}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" ` : `src="${src}" srcset="${srcset}" `;
  return `<img ${lz}sizes="${sizes}" width="${w}" height="${h}" alt="${a}"${cls ? ` class="${cls}"` : ''}${priority ? ' fetchpriority="high"' : ` loading="${loading}"`} decoding="async"${attrs ? ' ' + attrs : ''}>`;
}

/* ---------- части страницы ---------- */
const PHONE = hotel.phone, PH = hotel.phoneHref;
function nav(rel, isHome) {
  const h = isHome ? '' : `${rel}index.html`;
  return [
    [`${h}#about`, 'Об отеле'], [`${h}#rooms`, 'Номера'], [`${h}#restaurant`, 'Ресторан'], [`${h}#services`, 'Услуги'],
    [`${rel}rybinsk.html`, 'Рыбинск'], [`${h}#contacts`, 'Контакты'],
  ];
}
function header(rel, isHome) {
  return `<header class="header">
  <div class="container header__in">
    <a class="logo" href="${rel}index.html" aria-label="Отель «ЮрЛа», на главную">${LOGO}</a>
    <nav class="nav" aria-label="Разделы">${nav(rel, isHome).map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>
    <div class="header__right">
      <a class="header__phone" href="tel:${PH}" aria-label="Позвонить: ${PHONE}">${icon('phone')}<span>${typo(PHONE)}</span></a>
      <a class="header__lang" href="${hotel.en}" lang="en" hreflang="en">EN</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span>Меню</span>${icon('menu')}</button>
    </div>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="container">
    <div class="menu__top">
      <a class="logo" href="${rel}index.html" aria-label="Отель «ЮрЛа», на главную">${LOGO}</a>
      <button class="menu__close" type="button"><span>Закрыть</span>${icon('close')}</button>
    </div>
    <nav class="menu__list" aria-label="Разделы в меню">${nav(rel, isHome).map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>
    <div class="menu__foot">
      <button class="btn btn--accent" type="button" data-book="0">Забронировать номер</button>
      <a class="btn btn--line" href="tel:${PH}">${icon('phone')}${typo(PHONE)}</a>
      <a href="${hotel.en}" lang="en" hreflang="en">English version</a>
    </div>
  </div>
</div>
<div class="menu-backdrop" aria-hidden="true"></div>`;
}

function roomOptions(selected = '0') {
  return `<option value="0"${selected === '0' ? ' selected' : ''}>Любой номер</option>` +
    rooms.map((r) => `<option value="${r.n}"${selected === r.n ? ' selected' : ''}>${esc(r.name)}</option>`).join('');
}
function bookBar(idp, selected = '0') {
  const guests = [['1-0', '1 взрослый'], ['2-0', '2 взрослых'], ['2-1', '2 взрослых и ребёнок'], ['2-2', '2 взрослых и 2 детей'], ['3-0', '3 взрослых'], ['4-0', '4 взрослых']];
  return `<form class="book" action="#booking" aria-label="Выбор дат и гостей">
        <div class="book__field book__field--room"><label for="${idp}-room">Номер</label><select id="${idp}-room" name="n">${roomOptions(selected)}</select>${icon('chevd')}</div>
        <div class="book__field book__field--in"><label for="${idp}-in">Заезд</label><input id="${idp}-in" type="date" name="date_start">${icon('calendar')}</div>
        <div class="book__field book__field--out"><label for="${idp}-out">Выезд</label><input id="${idp}-out" type="date" name="date_end">${icon('calendar')}</div>
        <div class="book__field book__field--guests"><label for="${idp}-guests">Гости</label><select id="${idp}-guests" name="guests">${guests.map(([v, l]) => `<option value="${v}"${v === '2-0' ? ' selected' : ''}>${l}</option>`).join('')}</select>${icon('chevd')}</div>
        <button class="btn btn--accent btn--flare" type="submit"><span>Забронировать</span></button>
      </form>`;
}

function dialog(rel) {
  const opt = (a, b, sel) => Array.from({ length: b - a + 1 }, (_, i) => a + i).map((v) => `<option${v === sel ? ' selected' : ''}>${v}</option>`).join('');
  return `<dialog class="dialog" id="booking" aria-labelledby="booking-title">
  <button class="dialog__close" type="button" data-close aria-label="Закрыть окно">${icon('close')}</button>
  <div class="dialog__in">
    <h2 class="h2 dialog__title" id="booking-title">${t(booking.title)}</h2>
    <p class="dialog__lead">${t(booking.lead)}</p>
    <form class="form" novalidate data-endpoint="/remote.php?f=1">
      <div class="field form__full"><label class="field__label" for="f-n">Номер</label><select id="f-n" name="n">${roomOptions()}</select></div>
      <div class="pair form__full">
        <div class="field"><label class="field__label" for="f-in">Заезд</label><input id="f-in" type="date" name="date_start" required><span class="field__err"></span></div>
        <div class="field"><label class="field__label" for="f-out">Выезд</label><input id="f-out" type="date" name="date_end" required><span class="field__err"></span></div>
      </div>
      <div class="pair form__full">
        <div class="field"><label class="field__label" for="f-vz">Взрослых</label><select id="f-vz" name="vz">${opt(1, 6, 2)}</select></div>
        <div class="field"><label class="field__label" for="f-det">Детей</label><select id="f-det" name="det">${opt(0, 4, 0)}</select></div>
      </div>
      <div class="field form__full"><label class="field__label" for="f-fio">Фамилия, имя и отчество</label><input id="f-fio" name="fio" autocomplete="name" required><span class="field__err"></span></div>
      <div class="field"><label class="field__label" for="f-phone">Телефон</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (900) 000-00-00" required><span class="field__err"></span></div>
      <div class="field"><label class="field__label" for="f-mail">E-mail <span class="field__hint">— по желанию</span></label><input id="f-mail" name="mail" type="email" inputmode="email" autocomplete="email" placeholder="name@mail.ru"><span class="field__err"></span></div>
      <div class="check form__full"><input id="f-agree" type="checkbox" name="agree" required><label for="f-agree">${t(booking.consent)} <a href="${rel}${hotel.consentPdf}" target="_blank" rel="noopener">${t(booking.consentLink)}</a></label><span class="field__err"></span></div>
      <div class="form__foot form__full"><button class="btn btn--accent" type="submit">Отправить заявку</button><p class="form__call">или позвоните: <a href="tel:${PH}">${typo(PHONE)}</a></p></div>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>
    <div class="done">
      <h2 class="h2 dialog__title">${t(booking.done[0])}</h2>
      <p>${t(booking.done[1])}</p>
      <button class="btn btn--dark" type="button" data-close>Хорошо</button>
    </div>
  </div>
</dialog>`;
}

function contacts(rel, isHome) {
  const road = isHome ? `<a class="btn btn--line" href="#faq" data-faq-cat="faq-road">Как добраться</a>` : `<a class="btn btn--line" href="${rel}index.html#faq">Как добраться</a>`;
  return `<section class="section contacts" id="contacts" aria-labelledby="contacts-title">
  <div class="container contacts__in">
    <div>
      <h2 class="h2" id="contacts-title">${t(home.contactsTitle)}</h2>
      <a class="contacts__phone" href="tel:${PH}">${typo(PHONE)}</a>
      <a class="contacts__phone" href="tel:${hotel.phone2Href}">${typo(hotel.phone2)}</a>
      <ul class="contacts__list">
        <li>${t(hotel.addressFull)}</li>
        <li>${t(home.contactsNote)}</li>
        <li><a href="mailto:${hotel.email}">${hotel.email}</a> · факс ${typo(hotel.fax)}</li>
        <li>Ресторан: <a href="tel:${hotel.restaurantPhoneHref}">${typo(hotel.restaurantPhone)}</a></li>
      </ul>
      <div class="contacts__actions">
        <a class="btn btn--line" href="${hotel.maps}" target="_blank" rel="noopener">${icon('pin')}Открыть в Яндекс Картах</a>
        ${road}
      </div>
    </div>
    <div class="contacts__photo">${pic('facade-day', rel, { sizes: '(min-width: 1100px) 570px, 100vw' })}</div>
  </div>
</section>`;
}

function footer(rel, isHome) {
  return `<footer class="footer">
  <div class="container footer__in">
    <div>
      <a class="logo" href="${rel}index.html" aria-label="Отель «ЮрЛа», на главную">${LOGO}</a>
      <p class="footer__muted" style="margin-top:18px;max-width:22em">${t(home.lead.split('.')[0] + '.')}</p>
    </div>
    <div>
      <p class="footer__title">Отель</p>
      <ul>
        <li>${t(hotel.addressFull)}</li>
        <li><a href="tel:${PH}">${typo(PHONE)}</a></li>
        <li><a href="tel:${hotel.phone2Href}">${typo(hotel.phone2)}</a></li>
        <li>Факс ${typo(hotel.fax)}</li>
        <li><a href="mailto:${hotel.email}">${hotel.email}</a></li>
      </ul>
    </div>
    <div>
      <p class="footer__title">Разделы</p>
      <ul>${[...nav(rel, isHome).slice(0, 4), [`${isHome ? '' : rel + 'index.html'}#gallery`, 'Галерея'], ...nav(rel, isHome).slice(4)].map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
    </div>
    <div>
      <p class="footer__title">Гостям</p>
      <ul>
        <li><button class="linklike" type="button" data-book="0">Забронировать номер</button></li>
        <li><a href="${rel}${hotel.consentPdf}" target="_blank" rel="noopener">Положение об обработке персональных данных</a></li>
        <li><a href="${hotel.en}" lang="en" hreflang="en">English version</a></li>
        <li class="footer__muted">${t('Принимаем к оплате карты Visa и Mastercard')}</li>
      </ul>
    </div>
  </div>
  <div class="container footer__bottom"><div class="footer__bottom-in">
    <span>Номер реестровой записи в Едином реестре объектов классификации в сфере туристской индустрии: <a href="${hotel.registryUrl}" target="_blank" rel="noopener">${hotel.registry}</a></span>
    <span>© ${t(hotel.name)} · <a href="${rel}credits.html">Авторы фото</a></span>
  </div></div>
</footer>`;
}

function page({ rel = '', title, description, body, isHome = false, preload = '', cls = '', jsonld = '' }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#2B2A29">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${rel}img/og-yurla.jpg">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${rel}fonts/roboto-flex-subset.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="${rel}css/tokens.css">
<link rel="stylesheet" href="${rel}css/site.css">
${jsonld}</head>
<body${cls ? ` class="${cls}"` : ''}>
<a class="skip" href="#main">Перейти к содержанию</a>
${sprite()}
${header(rel, isHome)}
<main id="main">
${body}
</main>
${footer(rel, isHome)}
${dialog(rel)}
<button class="up" type="button" aria-label="Наверх">${icon('up')}</button>
<script src="${rel}js/site.js" defer></script>
</body>
</html>
`;
}

/* ---------- блоки ---------- */
function stage(keys, rel, label) {
  const imgs = keys.map((k, i) => pic(k, rel, { sizes: '(min-width: 1100px) 790px, 100vw', cls: 'stage__img' + (i === 0 ? ' is-on' : ''), lazyData: i > 0, loading: 'lazy' })).join('\n');
  const thumbs = keys.map((k, i) => `<button class="stage__thumb${i === 0 ? ' is-on' : ''}" type="button" aria-label="Фото ${i + 1}: ${esc(photos[k].alt)}"${i === 0 ? ' aria-current="true"' : ''}>${pic(k, rel, { sizes: '100px', alt: '' })}</button>`).join('');
  return `<div class="stage" role="region" aria-roledescription="галерея" aria-label="${esc(label)}">
      ${imgs}
      <button class="stage__arrow stage__arrow--prev" type="button" aria-label="Предыдущее фото">${icon('chevl')}</button>
      <button class="stage__arrow stage__arrow--next" type="button" aria-label="Следующее фото">${icon('chevr')}</button>
      <div class="stage__thumbs">${thumbs}</div>
      <p class="visually-hidden stage__live" aria-live="polite"></p>
    </div>`;
}
function priceBox(r, big = false) {
  return `<div class="price">
          <div class="price__row"><span class="price__who">1 гость</span><span class="price__sum">${typo(r.price[0])}</span></div>
          <div class="price__row"><span class="price__who">2 гостя</span><span class="price__sum">${typo(r.price[1])}</span></div>
          <p class="price__note">за сутки${r.note && big ? '. ' + t(r.note) : ''}</p>
          <button class="btn btn--accent btn--flare" type="button" data-book="${r.n}"><span>Забронировать</span></button>
        </div>`;
}
function roomCard(r, i, rel) {
  return `<article class="room" id="room-${r.slug}"${i >= 3 ? ' hidden data-more-room' : ''}>
      <a class="room__photo" href="${rel}rooms/${r.slug}.html" aria-label="${esc(r.name)}: фото и подробности">
        ${pic(r.photos[0], rel, { sizes: '(min-width: 1100px) 890px, 100vw' })}
        <div class="room__amen"><p class="room__amen-label">В номере:</p><ul class="amen">${r.icons.map((k) => `<li class="amen__i" title="${LABELS[k]}">${icon(k)}<span class="visually-hidden">${LABELS[k]}</span></li>`).join('')}</ul></div>
        <div class="room__name"><h3 class="room__title">${t(r.name)}</h3><p class="room__meta"><span>${icon('guest')}${t(r.guests)}</span><span>${icon(r.bed === 'Два уровня' ? 'stairs' : 'bed')}${t(r.bed)}</span></p></div>
      </a>
      <div class="room__panel">
        <p class="room__desc">${t(r.short)}${r.note ? ' ' + t(r.note) : ''}</p>
        <a class="link-more" href="${rel}rooms/${r.slug}.html">Подробнее о номере${icon('arrow')}</a>
        ${priceBox(r)}
      </div>
    </article>`;
}
function card(key, title, text, rel) {
  return `<article class="card">${pic(key, rel, { sizes: '(min-width: 1100px) 290px, (min-width: 768px) 33vw, 78vw' })}<div class="card__panel"><h4 class="card__title">${t(title)}</h4>${text ? `<p class="card__text">${t(text)}</p>` : ''}</div></article>`;
}
function carousel(cards, label, cls = '') {
  return `<div class="carousel${cls}" role="region" aria-label="${esc(label)}">
      <div class="carousel__track">${cards}</div>
      <button class="carousel__arrow carousel__arrow--prev" type="button" data-prev aria-label="Назад">${icon('back')}</button>
      <button class="carousel__arrow carousel__arrow--next" type="button" data-next aria-label="Вперёд">${icon('arrow')}</button>
      <div class="dashes"></div>
    </div>`;
}

/* ---------- главная ---------- */
function buildHome() {
  const rel = '';
  const hero = photos['facade-evening'];
  const heroSet = hero.files.map((f) => `${f.file} ${f.w}w`).join(', ');
  const preload = `<link rel="preload" as="image" href="${hero.files[1].file}" imagesrcset="${heroSet}" imagesizes="100vw" fetchpriority="high">\n`;
  const galleryKeys = Object.keys(photos).filter((k) => photos[k].cat);
  const order = ['hall', 'rooms', 'restaurant', 'bath', 'facade'];
  galleryKeys.sort((a, b) => order.indexOf(photos[a].cat) - order.indexOf(photos[b].cat));
  galleryKeys.splice(galleryKeys.indexOf('facade-evening'), 1); // уже на первом экране
  const jsonld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Hotel', name: hotel.name, description: home.lead,
    address: { '@type': 'PostalAddress', streetAddress: hotel.address, addressLocality: hotel.city, addressRegion: 'Ярославская область', postalCode: '152903', addressCountry: 'RU' },
    telephone: hotel.phone, email: hotel.email, faxNumber: hotel.fax, numberOfRooms: 34, checkoutTime: '12:00', smokingAllowed: false, priceRange: '4 700 – 9 500 ₽',
    amenityFeature: [{ '@type': 'LocationFeatureSpecification', name: 'Бесплатный Wi-Fi', value: true }, { '@type': 'LocationFeatureSpecification', name: 'Бесплатная парковка', value: true }],
  })}</script>\n`;

  const body = `<section class="hero hero--home" aria-labelledby="hero-title">
  <div class="hero__media">${pic('facade-evening', rel, { sizes: '100vw', priority: true })}</div>
  <div class="container hero__in">
    ${bookBar('b')}
    <div class="hero__title">
      <h1 class="h1" id="hero-title">${t(home.h1)}</h1>
      <p class="h-sub hero__sub">${t(home.sub)}</p>
      <p class="hero__lead">${t(home.lead)}</p>
    </div>
    <ul class="perks">${home.perks.map(([k, l]) => `<li class="perk"><span class="perk__ic">${icon(k)}</span><span>${t(l)}</span></li>`).join('')}</ul>
  </div>
</section>

<nav class="subnav" aria-label="Разделы страницы">
  <div class="container"><div class="subnav__in">
    ${[['about', 'Об отеле'], ['rooms', 'Номера'], ['restaurant', 'Ресторан'], ['services', 'Услуги'], ['gallery', 'Галерея'], ['faq', 'Вопрос-ответ'], ['contacts', 'Контакты']].map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}
  </div></div>
</nav>

<section class="section" id="about" aria-labelledby="about-title">
  <div class="container">
    <div class="section__head">
      <h2 class="h2" id="about-title">Об отеле</h2>
      <p class="badge">${t(home.aboutBadge)}</p>
    </div>
    <div class="about">
      ${stage(home.aboutPhotos, rel, 'Фото отеля')}
      <div class="about__text">
        ${home.about.map((p) => `<p>${t(p)}</p>`).join('\n        ')}
        <div class="info-list">
          <a href="${hotel.maps}" target="_blank" rel="noopener">${icon('pin')}${t(hotel.city + ', ' + hotel.address)}</a>
          <a href="#faq" data-faq-cat="faq-road">${icon('question')}Как добраться</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="nearby" aria-labelledby="nearby-title">
  <div class="container">
    <div class="section__head"><h2 class="h2" id="nearby-title">Рядом с отелем</h2><a class="link-more" href="rybinsk.html">О Рыбинске${icon('arrow')}</a></div>
    <div class="boxes">
      ${home.nearby.map((b) => `<div class="box"><div class="box__head">${icon(b.icon)}<h3 class="h3">${t(b.title)}</h3></div>${b.items ? `<ul>${b.items.map((i) => `<li>${t(i)}</li>`).join('')}</ul>` : `<p>${t(b.text)}</p>`}</div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--planed" id="rooms" aria-labelledby="rooms-title">
  <div class="plane plane--warm" aria-hidden="true"></div>
  <div class="container">
    <div class="section__head"><div><h2 class="h2" id="rooms-title">Номера</h2><p class="section__lead">${t(home.roomsLead)}</p></div></div>
    <div class="rooms">
    ${rooms.map((r, i) => roomCard(r, i, rel)).join('\n    ')}
    </div>
    <div class="rooms__more"><button class="btn btn--grey" type="button" data-more="[data-more-room]">Показать ещё 3 номера</button></div>
  </div>
</section>

<section class="section section--planed" id="restaurant" aria-labelledby="rest-title">
  <div class="plane plane--cool" aria-hidden="true"></div>
  <div class="container">
    <h2 class="h2" id="rest-title">Ресторан и услуги</h2>
    <div class="sub-block" style="margin-top:32px">
      <h3 class="h3">${t(home.restaurant.title)}</h3>
      <p class="feature-text">${t(home.restaurant.text)} <a href="tel:${hotel.restaurantPhoneHref}" class="nobr">${typo(hotel.restaurantPhone)}</a>. <a href="${hotel.vk}" target="_blank" rel="noopener">Ресторан во ВКонтакте</a></p>
      ${carousel(home.restaurant.cards.map(([k, ti, tx]) => card(k, ti, tx, rel)).join(''), 'Фото ресторана')}
    </div>
    <div class="sub-block" id="services">
      <h3 class="h3">${t(home.servicesTitle)}</h3>
      <div style="height:24px"></div>
      ${carousel(home.services.map(([k, ti, tx]) => card(k, ti, tx, rel)).join(''), 'Услуги отеля')}
    </div>
  </div>
</section>

<section class="section" id="gallery" aria-labelledby="gallery-title">
  <div class="container">
    <h2 class="h2" id="gallery-title">Галерея</h2>
    <div class="tabs" role="tablist" aria-label="Что показать" data-tabs="#gallery-strip" style="margin-top:28px">
      ${home.galleryTabs.map(([c, l], i) => `<button type="button" role="tab" data-cat="${c}" aria-selected="${i === 0}">${l}</button>`).join('')}
    </div>
    <div class="strip" id="gallery-strip" role="region" aria-label="Фотографии отеля">
      <div class="strip__track">
        ${galleryKeys.map((k) => `<figure class="strip__item" data-cat="${photos[k].cat}">${pic(k, rel, { sizes: '(min-width: 768px) 800px, 460px' })}</figure>`).join('\n        ')}
      </div>
      <button class="strip__arrow strip__arrow--prev" type="button" data-prev aria-label="Назад">${icon('chevl')}</button>
      <button class="strip__arrow strip__arrow--next" type="button" data-next aria-label="Вперёд">${icon('chevr')}</button>
      <div class="dashes"></div>
    </div>
  </div>
</section>

<section class="section" id="faq" aria-labelledby="faq-title">
  <div class="container">
    <h2 class="h2" id="faq-title" style="margin-bottom:36px">Вопрос-ответ</h2>
    <div class="faq">
      <div class="faq__cats" role="tablist" aria-label="Темы вопросов">
        ${home.faq.map((c, i) => `<button type="button" role="tab" id="tab-${c.id}" aria-controls="${c.id}" aria-selected="${i === 0}">${t(c.title)}</button>`).join('\n        ')}
      </div>
      <div>
        ${home.faq.map((c, i) => `<div class="faq__panel" id="${c.id}" role="tabpanel" aria-labelledby="tab-${c.id}"${i ? ' hidden' : ''}>
          ${c.items.map(([q, a], j) => `<div class="acc__item"><h3 style="margin:0"><button class="acc__q" type="button" aria-expanded="false" aria-controls="${c.id}-${j}"><span>${t(q)}</span>${icon('plus')}</button></h3><div class="acc__a" id="${c.id}-${j}" hidden>${a.map((p) => `<p>${t(p)}</p>`).join('')}</div></div>`).join('\n          ')}
        </div>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>

${contacts(rel, true)}`;
  return page({ rel, title: home.title, description: home.description, body, isHome: true, preload, cls: 'page-home', jsonld });
}

/* ---------- страница номера ---------- */
function buildRoom(r) {
  const rel = '../';
  const cover = photos[r.photos[0]];
  const others = rooms.filter((x) => x !== r);
  const body = `<section class="hero hero--page" aria-labelledby="room-title">
  <div class="hero__media">${pic(r.photos[0], rel, { sizes: '100vw', priority: true })}</div>
  <div class="container hero__in">
    ${bookBar('b', r.n)}
    <div class="hero__title">
      <p class="crumbs"><a href="${rel}index.html">Главная</a><span aria-hidden="true">/</span><a href="${rel}index.html#rooms">Номера</a></p>
      <h1 class="h1 h1--page" id="room-title">${t(r.full)}</h1>
      <p class="room__meta" style="margin-top:14px;font-size:15px"><span>${icon('guest')}${t(r.guests)}</span><span>${icon(r.bed === 'Два уровня' ? 'stairs' : 'bed')}${t(r.bed)}</span></p>
    </div>
  </div>
</section>

<section class="section" aria-label="Фото и цены">
  <div class="container">
    <div class="room-page">
      ${stage(r.photos, rel, 'Фото номера ' + r.name)}
      <div class="room-page__side">
        ${r.desc.map((p) => `<p>${t(p)}</p>`).join('\n        ')}
        <ul class="facts">${[['guest', r.guests], [r.bed === 'Два уровня' ? 'stairs' : 'bed', r.bed], ...r.icons.filter((k) => ['balcony', 'snow', 'bath', 'sofa', 'fridge', 'heat'].includes(k)).slice(0, 3).map((k) => [k, LABELS[k]])].map(([k, l]) => `<li>${icon(k)}<span>${t(l)}</span></li>`).join('')}</ul>
        ${priceBox(r, true)}
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="amen-title">
  <div class="container">
    <h2 class="h2" id="amen-title" style="margin-bottom:32px">В номере</h2>
    <ul class="amen-grid">${r.amen.map(([k, l]) => `<li>${icon(k)}<span>${t(l)}</span></li>`).join('')}</ul>
  </div>
</section>

<section class="section" aria-labelledby="rules-title">
  <div class="container">
    <h2 class="h2" id="rules-title" style="margin-bottom:32px">Заселение и выезд</h2>
    <div class="rules">${rules.map(([a, b, c]) => `<div><p class="rules__big">${t(a)}</p><p>${t(b)}</p>${c ? `<p>${t(c)}</p>` : ''}</div>`).join('')}</div>
  </div>
</section>

<section class="section" aria-labelledby="others-title">
  <div class="container">
    <h2 class="h2" id="others-title" style="margin-bottom:32px">Другие номера</h2>
    <div class="others">${others.map((o) => `<a class="other" href="${o.slug}.html"><div class="other__img">${pic(o.photos[0], rel, { sizes: '(min-width: 1100px) 230px, 50vw' })}</div><p class="other__name">${t(o.name)}</p><p class="other__price">${typo(o.price[0])} за сутки для одного гостя</p></a>`).join('')}</div>
  </div>
</section>

${contacts(rel, false)}`;
  const title = `${r.full} — отель «ЮрЛа», Рыбинск`;
  const description = `${r.short} ${r.price[0]} за сутки для одного гостя, ${r.price[1]} — для двоих. Отель «ЮрЛа» на Волжской набережной Рыбинска.`;
  return page({ rel, title, description, body });
}

/* ---------- Рыбинск ---------- */
function credit(key) {
  const s = photos[key].stock;
  return `Фото: <a href="${s.page}" target="_blank" rel="noopener">${esc(s.author)}</a>, ${s.source === 'pexels' ? 'Pexels' : esc(s.source)}`;
}
function buildRybinsk() {
  const rel = '';
  const body = `<section class="hero hero--page" aria-labelledby="ryb-title">
  <div class="hero__media">${pic('stock:rybinsk-facade', rel, { sizes: '100vw', priority: true })}</div>
  <div class="container hero__in">
    <div class="hero__title">
      <p class="crumbs"><a href="index.html">Главная</a></p>
      <h1 class="h1 h1--page" id="ryb-title">${t(rybinsk.h1)}</h1>
      <p class="h-sub hero__sub">${t(rybinsk.sub)}</p>
    </div>
  </div>
  <p class="hero__credit">${credit('stock:rybinsk-facade')}</p>
</section>

<section class="section">
  <div class="container article">
    <div class="article__body">${rybinsk.intro.map((p) => `<p>${t(p)}</p>`).join('')}</div>
    <figure class="figure article__side">${pic('stock:rybinsk-houses', rel, { sizes: '(min-width: 1100px) 390px, 100vw' })}<figcaption>${t('Дома в центре Рыбинска.')} ${credit('stock:rybinsk-houses')}</figcaption></figure>
  </div>
</section>

<section class="section" aria-labelledby="sights-title">
  <div class="container">
    <h2 class="h2" id="sights-title" style="margin-bottom:32px">Что посмотреть</h2>
    <div class="sights">${rybinsk.sights.map(([y, h, p]) => `<article class="sight">${y ? `<p class="sight__year">${t(y)}</p>` : ''}<h3 class="h3">${t(h)}</h3><p>${t(p)}</p></article>`).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="callout">
      <p class="text">${t(rybinsk.outro)}</p>
      <p class="text">${t(rybinsk.excursion)}</p>
      <p><a class="btn btn--dark" href="tel:${PH}">${icon('phone')}${typo(PHONE)}</a></p>
    </div>
  </div>
</section>

${contacts(rel, false)}`;
  return page({ rel, title: rybinsk.title, description: rybinsk.description, body });
}

/* ---------- авторы фото, 404, переадресации ---------- */
function buildCredits() {
  const stock = Object.keys(photos).filter((k) => photos[k].stock);
  const body = `<section class="section" style="padding-top:var(--header-h)">
  <div class="container">
    <h1 class="h1 h1--page" style="margin:40px 0 28px">Авторы фото</h1>
    <p class="text">Фото отеля, номеров и ресторана — из архива отеля «ЮрЛа».</p>
    <p class="text" style="margin-top:16px">Фото с Pexels (лицензия Pexels, <a href="https://www.pexels.com/license/" target="_blank" rel="noopener" style="text-decoration:underline">условия</a>):</p>
    <ul style="margin-top:16px;display:grid;gap:8px">${stock.map((k) => `<li>${esc(photos[k].alt)} — <a href="${photos[k].stock.page}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(photos[k].stock.author)}</a></li>`).join('')}</ul>
  </div>
</section>`;
  return page({ rel: '', title: 'Авторы фото — отель «ЮрЛа»', description: 'Кто снял фотографии на сайте отеля «ЮрЛа».', body, cls: 'page-plain' });
}
function build404() {
  const body = `<section class="container notfound">
  <h1 class="h1 h1--page">Такой страницы нет</h1>
  <p class="text">Возможно, в адресе опечатка. Вот главные разделы:</p>
  <p style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn--dark" href="/index.html">Главная</a><a class="btn btn--line" href="/index.html#rooms">Номера и цены</a><a class="btn btn--line" href="tel:${PH}">${typo(PHONE)}</a></p>
</section>`;
  return page({ rel: '/', title: 'Страница не найдена — отель «ЮрЛа»', description: 'Такой страницы нет.', body, cls: 'page-plain' });
}
function redirect(to, title) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="robots" content="noindex"><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"></head><body><p><a href="${to}">${esc(title)}</a></p></body></html>\n`;
}

/* ---------- запись ---------- */
const out = (p, html) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
out('index.html', buildHome());
for (const r of rooms) out(`rooms/${r.slug}.html`, buildRoom(r));
out('rybinsk.html', buildRybinsk());
out('credits.html', buildCredits());
out('404.html', build404());
// старые адреса hotel.yurla.ru → новые
const legacy = { 'Nomera.html': 'index.html#rooms', 'Restoran.html': 'index.html#restaurant', 'Uslugi.html': 'index.html#services', 'Galereja.html': 'index.html#gallery', 'Gorod-Ribinsk.html': 'rybinsk.html', 'Kontaktnaja-informacija.html': 'index.html#contacts' };
for (const [from, to] of Object.entries(legacy)) out(from, redirect(to, 'Отель «ЮрЛа»'));
for (const r of rooms) out(`Nomera/${r.old}.html`, redirect(`../rooms/${r.slug}.html`, r.full));
console.log('собрано: index, rooms ×' + rooms.length + ', rybinsk, credits, 404, переадресаций ' + (Object.keys(legacy).length + rooms.length));
