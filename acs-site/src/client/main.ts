import { addToBasket, BASKET_KEY, parseBasket, removeFromBasket } from '../data/basket';
import { productById, productPath, products } from '../data/catalog';
import { submitEnquiry } from '../data/store';
import {
  emptyEnquiry, errorsForStep, STEP_FIELDS, validateEnquiry,
  type EnquiryFields, type Errors, type FieldName,
} from '../rules/enquiry';
import { filterProducts } from '../rules/search';

function one<T extends HTMLElement>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function all<T extends HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return [...root.querySelectorAll<T>(selector)];
}

/* ---------- basket: product ids only, never anything about the visitor ---------- */

function readBasket(): string[] {
  try {
    return parseBasket(window.sessionStorage.getItem(BASKET_KEY));
  } catch {
    return [];
  }
}

function writeBasket(ids: string[]): boolean {
  try {
    window.sessionStorage.setItem(BASKET_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

/* ---------- catalogue ---------- */

function initCatalogue(): void {
  const tools = one('[data-catalogue-tools]');
  const grid = one('#catalogue-grid');
  if (!tools || !grid) return;
  const search = one<HTMLInputElement>('#catalogue-search');
  const count = one('#catalogue-count');
  const empty = one('#catalogue-empty');
  const filters = all<HTMLButtonElement>('[data-filter]', tools);
  const known = new Set(filters.map((b) => b.dataset.filter));
  const fromUrl = new URLSearchParams(location.search).get('category') ?? 'all';
  let category = known.has(fromUrl) ? fromUrl : 'all';

  const apply = () => {
    const visible = new Set(filterProducts(products, { query: search?.value ?? '', category }).map((p) => p.id));
    for (const card of all('[data-product-card]', grid)) card.hidden = !visible.has(card.dataset.id ?? '');
    for (const b of filters) b.setAttribute('aria-pressed', String(b.dataset.filter === category));
    if (count) count.textContent = `แสดง ${visible.size} จาก ${products.length} รายการ`;
    if (empty) empty.hidden = visible.size > 0;
  };

  for (const b of filters) {
    b.addEventListener('click', () => {
      category = b.dataset.filter ?? 'all';
      apply();
    });
  }
  search?.addEventListener('input', apply);
  tools.hidden = false;
  apply();
}

/* ---------- product page ---------- */

function initProduct(): void {
  const button = one<HTMLButtonElement>('[data-add-to-basket]');
  if (!button) return;
  const feedback = one('#basket-feedback');
  const id = button.dataset.addToBasket ?? '';
  button.hidden = false;
  const sync = () => {
    const inBasket = readBasket().includes(id);
    button.textContent = inBasket ? 'อยู่ในรายการขอราคาแล้ว' : 'เพิ่มในรายการขอราคา';
    button.disabled = inBasket;
  };
  button.addEventListener('click', () => {
    const saved = writeBasket(addToBasket(readBasket(), id));
    if (feedback) {
      feedback.textContent = saved
        ? 'เพิ่มในรายการขอราคาแล้ว (ยังไม่ได้ส่งถึง ACS)'
        : 'เพิ่มรายการไม่ได้ในเบราว์เซอร์นี้ กรุณาใช้แบบฟอร์มขอราคาโดยตรง';
    }
    sync();
  });
  sync();
}

/* ---------- basket page ---------- */

function initBasket(): void {
  const root = one('[data-basket-root]');
  if (!root) return;
  const list = one<HTMLUListElement>('#basket-list');
  const empty = one('#basket-empty');
  const actions = one('#basket-actions');
  if (!list || !empty || !actions) return;

  const render = () => {
    const ids = readBasket();
    list.replaceChildren();
    for (const id of ids) {
      const p = productById(id);
      if (!p) continue;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = productPath(p.id);
      a.textContent = `${p.thaiTitle} — ${p.name}`;
      const takeOut = document.createElement('button');
      takeOut.type = 'button';
      takeOut.className = 'button button-outline';
      takeOut.textContent = 'นำออก';
      takeOut.setAttribute('aria-label', `นำ ${p.name} ออกจากรายการ`);
      takeOut.addEventListener('click', () => {
        writeBasket(removeFromBasket(readBasket(), id));
        render();
      });
      li.append(a, takeOut);
      list.append(li);
    }
    list.hidden = ids.length === 0;
    actions.hidden = ids.length === 0;
    empty.hidden = ids.length > 0;
  };
  render();
}

/* ---------- enquiry wizard: state lives in memory only ---------- */

type Step = 1 | 2 | 3;

function initEnquiry(): void {
  const form = one<HTMLFormElement>('#enquiry-form');
  if (!form) return;
  const result = one('#enquiry-result');
  const stepCount = one('#step-count');
  const prev = one<HTMLButtonElement>('#prev-step');
  const next = one<HTMLButtonElement>('#next-step');
  const send = one<HTMLButtonElement>('#send-enquiry');
  const summary = one('#basket-summary');
  if (!result || !prev || !next || !send) return;

  // Deliberately a plain variable: nothing the visitor types is written to
  // sessionStorage, localStorage, the URL or a log.
  const state: EnquiryFields = emptyEnquiry();
  state.items = readBasket();
  let step: Step = 1;
  let busy = false;

  if (summary && state.items.length) {
    const heading = document.createElement('p');
    heading.textContent = `สินค้าในรายการขอราคา ${state.items.length} รายการ`;
    const ul = document.createElement('ul');
    for (const id of state.items) {
      const p = productById(id);
      if (!p) continue;
      const li = document.createElement('li');
      li.textContent = `${p.thaiTitle} — ${p.name}`;
      ul.append(li);
    }
    summary.append(heading, ul);
    summary.hidden = false;
  }

  const read = () => {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? '');
    state.name = text('name');
    state.phone = text('phone');
    state.company = text('company');
    state.email = text('email');
    state.industry = text('industry');
    state.businessScale = text('businessScale');
    state.country = text('country');
    state.message = text('message');
    state.interests = data.getAll('interests').map(String);
    state.serviceConsent = data.get('serviceConsent') === 'on';
    state.marketingConsent = data.get('marketingConsent') === 'on';
  };

  const showErrors = (errors: Errors, fields: FieldName[]) => {
    for (const name of fields) {
      const box = one(`#err-${name}`);
      if (!box) continue;
      const message = errors[name] ?? '';
      box.textContent = message;
      box.hidden = !message;
      for (const input of all(`[name="${name}"]`, form)) input.setAttribute('aria-invalid', String(Boolean(message)));
    }
  };

  const show = (focus: boolean) => {
    for (const fs of all<HTMLFieldSetElement>('fieldset[data-step]', form)) fs.hidden = Number(fs.dataset.step) !== step;
    for (const li of all('[data-progress]', form)) {
      if (Number(li.dataset.progress) === step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    }
    if (stepCount) stepCount.textContent = `ขั้นตอน ${step} จาก 3`;
    prev.hidden = step === 1;
    next.hidden = step === 3;
    send.hidden = step !== 3;
    if (focus) one(`#step-${step}-title`)?.focus();
  };

  const validateStep = (s: Step): boolean => {
    read();
    const errors = errorsForStep(state, s);
    showErrors(errors, STEP_FIELDS[s]);
    const first = STEP_FIELDS[s].find((name) => errors[name]);
    if (first) one<HTMLElement>(`[name="${first}"]`, form)?.focus();
    return !first;
  };

  next.addEventListener('click', () => {
    if (busy || !validateStep(step)) return;
    step = (step + 1) as Step;
    show(true);
  });

  prev.addEventListener('click', () => {
    if (busy) return;
    read();
    step = (step - 1) as Step;
    show(true);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    // Enter on an earlier step advances that step; it never submits a hidden one.
    if (step < 3) {
      next.click();
      return;
    }
    read();
    const errors = validateEnquiry(state);
    for (const s of [1, 2, 3] as const) {
      if (STEP_FIELDS[s].some((name) => errors[name])) {
        step = s;
        show(false);
        validateStep(s);
        return;
      }
    }
    busy = true;
    send.disabled = true;
    const outcome = await submitEnquiry(state);
    busy = false;
    send.disabled = false;
    result.hidden = false;
    // Only a real success may ever be reported as one.
    if (outcome.ok) {
      result.dataset.outcome = 'success';
      // A test store is said to be one: the visitor must not think ACS has the enquiry.
      result.dataset.environment = outcome.data.environment ?? '';
      result.textContent = outcome.data.environment === 'preview'
        ? `บันทึกคำขอในระบบทดสอบแล้ว เลขอ้างอิง ${outcome.data.reference} — คำขอนี้ยังไม่ถึงทีมขาย ACS`
        : `บันทึกคำขอแล้ว เลขอ้างอิง ${outcome.data.reference}`;
      // It has been sent. Leaving the form up invites sending it again.
      form.hidden = true;
    } else {
      result.dataset.outcome = outcome.status;
      result.textContent = outcome.message;
    }
    result.focus();
  });

  form.hidden = false;
  show(false);
}

initCatalogue();
initProduct();
initBasket();
initEnquiry();
