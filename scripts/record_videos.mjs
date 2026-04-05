/**
 * record_videos.mjs
 * Grava um vídeo por acção do MANUAL_ACOES_PORTAIS.md usando Playwright.
 *
 * Uso:
 *   cd C:\Users\ripma\Desktop\PortalTradeDataHub
 *   node scripts/record_videos.mjs
 *
 * Saída: docs/videos/  (ficheiros .webm, um por acção)
 * Requer: npx playwright install chromium (executado automaticamente se necessário)
 */

import { chromium } from 'playwright';
import { mkdirSync, renameSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const VIDEOS_DIR = join(ROOT, 'docs', 'videos');
const TMP_DIR    = join(ROOT, 'docs', 'videos', '_tmp');
const BASE_URL   = 'http://portaltradedatahub';

const USERS = {
  admin:      { email: 'admin@tradehub.com',            password: 'admin123' },
  formadora:  { email: 'ana.silva@banco.pt',             password: 'Demo1234!' },
  formador:   { email: 'carlos.santos@banco.pt',         password: 'Demo1234!' },
  tutor:      { email: 'joao.costa@banco.pt',            password: 'Demo1234!' },
  chefe:      { email: 'maria.pereira@banco.pt',         password: 'Demo1234!' },
  gerente:    { email: 'antonio.faria@banco.pt',         password: 'Demo1234!' },
  estudante1: { email: 'paula.ferreira@banco.pt',        password: 'Demo1234!' },
  estudante2: { email: 'rui.oliveira@banco.pt',          password: 'Demo1234!' },
  estudante3: { email: 'sofia.rodrigues@banco.pt',       password: 'Demo1234!' },
  estudante4: { email: 'pedro.lima@banco.pt',            password: 'Demo1234!' },
  estudante5: { email: 'ines.martins@banco.pt',          password: 'Demo1234!' },
  trainer:    { email: 'trainer_test@tradehub.com',      password: 'Test1234!' },
  tutorTest:  { email: 'tutor_test@tradehub.com',        password: 'Test1234!' },
  liberador:  { email: 'liberador_test@tradehub.com',    password: 'Test1234!' },
  referente:  { email: 'referente_test@tradehub.com',    password: 'Test1234!' },
  chefeTest:  { email: 'chefe_test@tradehub.com',        password: 'Test1234!' },
  manager:    { email: 'manager_test@tradehub.com',      password: 'Test1234!' },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function log(msg) {
  const ts = new Date().toTimeString().slice(0, 8);
  console.log(`[${ts}] ${msg}`);
}

async function newCtx(browser, actionLabel) {
  const ctx = await browser.newContext({
    recordVideo: {
      dir: TMP_DIR,
      size: { width: 1280, height: 800 },
    },
    viewport: { width: 1280, height: 800 },
    locale: 'pt-PT',
  });
  ctx._actionLabel = actionLabel;
  return ctx;
}

async function saveVideo(ctx, page, filename) {
  const videoPath = await page.video().path();
  await ctx.close();          // flush / save the video file
  const dest = join(VIDEOS_DIR, filename.endsWith('.webm') ? filename : filename + '.webm');
  if (existsSync(videoPath)) {
    renameSync(videoPath, dest);
    log(`  ✓ guardado → ${dest.replace(ROOT, '.')}`);
  } else {
    log(`  ✗ vídeo não encontrado (${videoPath})`);
  }
}

async function login(page, user) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await pause(800);
  await page.locator('input[type="email"], input[name="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('load');
  await pause(800);
}

async function slow(page) {
  page.setDefaultTimeout(15000);
}

async function pause(ms = 1200) {
  return new Promise(r => setTimeout(r, ms));
}

async function highlight(page, selector) {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.outline = '3px solid #EC0000';
        el.style.outlineOffset = '2px';
        setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
      }
    }, selector);
  } catch {}
}

// ── ACÇÕES ─────────────────────────────────────────────────────────────────

const ACTIONS = [

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────

  {
    id: '01', title: 'Fazer Login',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await pause(800);
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill('paula.ferreira@banco.pt');
      await pause(600);
      await page.locator('input[type="password"]').fill('Demo1234!');
      await pause(600);
      await highlight(page, 'button[type="submit"]');
      await pause(600);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
      await page.waitForLoadState('load');
      await pause(1500);
      return page;
    }
  },

  {
    id: '02', title: 'Registar Nova Conta',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'load' });
      await pause(800);
      const inputs = page.locator('input');
      const count = await inputs.count();
      if (count > 0) {
        await inputs.nth(0).fill('Beatriz Demo');
        await pause(400);
        if (count > 1) await inputs.nth(1).fill('beatriz.demo.video@banco.pt');
        await pause(400);
        if (count > 2) await inputs.nth(2).fill('Demo1234!');
        if (count > 3) await inputs.nth(3).fill('Demo1234!');
        await pause(800);
      }
      await pause(1500);
      return page;
    }
  },

  {
    id: '03', title: 'Recuperar Palavra-passe',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'load' });
      await pause(800);
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count()) {
        await emailInput.fill('rui.oliveira@banco.pt');
        await pause(600);
        await highlight(page, 'button[type="submit"]');
        await pause(600);
      }
      await pause(1500);
      return page;
    }
  },

  // ── ESTUDANTE ─────────────────────────────────────────────────────────────

  {
    id: '04', title: 'Dashboard do Estudante',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante1);
      await pause(1000);
      await page.goto(BASE_URL, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(1000);
      return page;
    }
  },

  {
    id: '05', title: 'Ver e Inscrever-se em Cursos',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante2);
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'load' });
      await pause(1500);
      const firstCourse = page.locator('article, .course-card, [data-testid="course-card"]').first();
      if (await firstCourse.count()) {
        await firstCourse.hover();
        await pause(600);
        await firstCourse.click();
        await page.waitForLoadState('load');
        await pause(1500);
        const enrollBtn = page.getByRole('button', { name: /inscrev|enroll|matricul/i }).first();
        if (await enrollBtn.count()) {
          await highlight(page, 'button');
          await pause(600);
        }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '06', title: 'Ver Planos de Formação (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante3);
      await page.goto(`${BASE_URL}/my-plans`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(1000);
      const firstPlan = page.locator('article, [class*="plan-card"], [class*="card"]').first();
      if (await firstPlan.count()) {
        await firstPlan.hover();
        await pause(800);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '07', title: 'Consumir uma Lição',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante4);
      await page.goto(`${BASE_URL}/my-lessons`, { waitUntil: 'load' });
      await pause(1500);
      const firstLesson = page.locator('article, a[href*="/lessons/"]').first();
      if (await firstLesson.count()) {
        await firstLesson.hover();
        await pause(600);
        await firstLesson.click();
        await page.waitForLoadState('load');
        await pause(2000);
        await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
        await pause(800);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '08', title: 'Executar um Desafio (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante5);
      await page.goto(`${BASE_URL}/my-challenges`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(1000);
      const execBtn = page.getByRole('button', { name: /iniciar|executar|start/i }).first();
      if (await execBtn.count()) {
        await execBtn.hover();
        await pause(700);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '09', title: 'Ver Resultado de Desafio',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante1);
      await page.goto(`${BASE_URL}/my-challenges`, { waitUntil: 'load' });
      await pause(1500);
      const resultBtn = page.getByRole('button', { name: /resultado|result|ver/i }).first();
      if (await resultBtn.count()) {
        await resultBtn.hover();
        await pause(600);
        await resultBtn.click();
        await page.waitForLoadState('load');
        await pause(2000);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '10', title: 'Ver Certificados (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante3);
      await page.goto(`${BASE_URL}/certificates`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(1000);
      const firstCert = page.locator('article, [class*="cert"]').first();
      if (await firstCert.count()) {
        await firstCert.hover();
        await pause(700);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '11', title: 'Relatórios Pessoais (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante2);
      await page.goto(`${BASE_URL}/reports`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await pause(600);
      return page;
    }
  },

  // ── FORMADOR ──────────────────────────────────────────────────────────────

  {
    id: '12', title: 'Dashboard do Formador',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(BASE_URL, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(1000);
      return page;
    }
  },

  {
    id: '13', title: 'Criar um Curso (Formador)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formador);
      await page.goto(`${BASE_URL}/course/new`, { waitUntil: 'load' });
      await pause(2500);
      // Tenta preencher o título se o form estiver visível
      const titleInput = page.locator('input[type="text"], input').first();
      const isVisible = await titleInput.isVisible().catch(() => false);
      if (isVisible) {
        await titleInput.fill('Liquidação de Títulos — Nível I (Demo)');
        await pause(500);
        const descInput = page.locator('textarea').first();
        if (await descInput.count()) {
          await descInput.fill('Curso introdutório sobre liquidação de títulos no mercado de capitais.');
          await pause(400);
        }
      }
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(1000);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await pause(600);
      return page;
    }
  },

  {
    id: '14', title: 'Editar um Curso Existente',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'load' });
      await pause(1500);
      const editBtn = page.getByRole('button', { name: /editar|edit/i }).first();
      if (await editBtn.count()) {
        await editBtn.hover();
        await pause(600);
        await editBtn.click();
        await page.waitForLoadState('load');
        await pause(1500);
      } else {
        const firstCourse = page.locator('article').first();
        if (await firstCourse.count()) {
          await firstCourse.click();
          await page.waitForLoadState('load');
          await pause(1500);
        }
      }
      return page;
    }
  },

  {
    id: '15', title: 'Adicionar Lição a Curso',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formador);
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'load' });
      await pause(1000);
      const firstCourse = page.locator('article, [class*="course"]').first();
      if (await firstCourse.count()) {
        await firstCourse.click();
        await page.waitForLoadState('load');
        await pause(1000);
        const addLessonBtn = page.getByRole('link', { name: /nova lição|adicionar lição|add lesson/i }).first();
        if (await addLessonBtn.count()) {
          await addLessonBtn.hover();
          await pause(700);
          await addLessonBtn.click();
          await page.waitForLoadState('load');
          await pause(800);
          const inputs = page.locator('input[name="title"], input').first();
          await inputs.fill('Tipos de Mercado de Capitais (Demo)');
          await pause(500);
          const textarea = page.locator('textarea').first();
          if (await textarea.count()) {
            await textarea.fill('Nesta lição exploramos os mercados primário e secundário.');
          }
          await pause(800);
        }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '16', title: 'Adicionar Desafio a Curso',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'load' });
      await pause(1000);
      const firstCourse = page.locator('article').first();
      if (await firstCourse.count()) {
        await firstCourse.click();
        await page.waitForLoadState('load');
        await pause(1000);
        const addChalBtn = page.getByRole('link', { name: /novo desafio|adicionar desafio/i }).first();
        if (await addChalBtn.count()) {
          await addChalBtn.hover();
          await pause(700);
          await addChalBtn.click();
          await page.waitForLoadState('load');
          await pause(800);
          const inputs = page.locator('input').first();
          await inputs.fill('Desafio — Liquidação T+2 (Demo)');
          await pause(600);
          await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
          await pause(800);
        }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '17', title: 'Criar Plano de Formação (Formador)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/training-plan/new`, { waitUntil: 'load' });
      await pause(2000);
      const inputs = page.locator('input[type="text"]').first();
      const isVisible = await inputs.isVisible().catch(() => false);
      if (isVisible) {
        await inputs.fill('Onboarding Equipa Custódia Q2 (Demo)');
      }
      await pause(500);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(1000);
      await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
      await pause(1000);
      return page;
    }
  },

  {
    id: '18', title: 'Adicionar Formador ao Plano',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/training-plans`, { waitUntil: 'load' });
      await pause(1200);
      const firstPlan = page.locator('article, [class*="plan"]').first();
      if (await firstPlan.count()) {
        await firstPlan.click();
        await page.waitForLoadState('load');
        await pause(1500);
        await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }));
        await pause(800);
        const addTrainerBtn = page.getByRole('button', { name: /adicionar formador|add trainer/i }).first();
        if (await addTrainerBtn.count()) {
          await addTrainerBtn.hover();
          await pause(700);
          await addTrainerBtn.click();
          await pause(1000);
        }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '19', title: 'Rever Submissão de Desafio',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/pending-reviews`, { waitUntil: 'load' });
      await pause(2000);
      const reviewBtn = page.getByRole('button', { name: /rever|review/i }).first();
      if (await reviewBtn.count()) {
        await reviewBtn.hover();
        await pause(700);
        await reviewBtn.click();
        await page.waitForLoadState('load');
        await pause(2000);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await pause(800);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '20', title: 'Ver Estudantes Atribuídos',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/students`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '21', title: 'Relatórios do Formador',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.formadora);
      await page.goto(`${BASE_URL}/reports`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  {
    id: '22', title: 'Dashboard do Admin',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(BASE_URL, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(1000);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await pause(600);
      return page;
    }
  },

  {
    id: '23', title: 'Gerir Utilizadores — Listar',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/users`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const searchInput = page.locator('input[placeholder*="pesqui" i], input[type="search"]').first();
      if (await searchInput.count()) {
        await searchInput.fill('paula');
        await pause(1000);
        await searchInput.clear();
        await pause(500);
      }
      return page;
    }
  },

  {
    id: '24', title: 'Criar Utilizador (Admin)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/users`, { waitUntil: 'load' });
      await pause(1000);
      const newUserBtn = page.getByRole('button', { name: /novo utilizador|new user|criar/i }).first();
      if (await newUserBtn.count()) {
        await newUserBtn.hover();
        await pause(600);
        await newUserBtn.click();
        await pause(1000);
        const inputs = page.locator('input[type="text"], input[name="full_name"]').first();
        if (await inputs.count()) {
          await inputs.fill('Beatriz Demo Video');
          await pause(400);
          const allInputs = page.locator('input[type="text"], input[type="email"]');
          const cnt = await allInputs.count();
          if (cnt > 1) await allInputs.nth(1).fill('beatriz.demo@banco.pt');
          await pause(600);
        }
        await pause(1000);
      }
      return page;
    }
  },

  {
    id: '25', title: 'Editar e Activar/Desactivar Utilizador',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/users`, { waitUntil: 'load' });
      await pause(1200);
      const editBtn = page.locator('[aria-label*="editar" i], [title*="editar" i], button[class*="edit"]').first();
      if (await editBtn.count()) {
        await editBtn.hover();
        await pause(600);
        await editBtn.click();
        await pause(1000);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '26', title: 'Aprovar Formador Pendente',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/trainer-validation`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(800);
      const approveBtn = page.getByRole('button', { name: /aprovar|approve/i }).first();
      if (await approveBtn.count()) {
        await approveBtn.hover();
        await pause(700);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '27', title: 'Todos os Planos de Formação (Admin)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/training-plans`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      const firstPlan = page.locator('article').first();
      if (await firstPlan.count()) {
        await firstPlan.hover();
        await pause(600);
      }
      return page;
    }
  },

  {
    id: '28', title: 'Relatórios Avançados (Admin)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/advanced-reports`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const tabs = page.locator('[role="tab"], button[class*="tab"]');
      const tabCount = await tabs.count();
      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        await tabs.nth(i).hover();
        await pause(400);
      }
      await pause(800);
      return page;
    }
  },

  {
    id: '29', title: 'Matriz de Conhecimento',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/knowledge-matrix`, { waitUntil: 'load' });
      await pause(2500);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '30', title: 'Avaliações (Ratings)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.gerente);
      await page.goto(`${BASE_URL}/relatorios/ratings`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  // ── TUTORIA ────────────────────────────────────────────────────────────────

  {
    id: '31', title: 'Portal de Tutoria — Dashboard',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.chefe);
      await page.goto(`${BASE_URL}/tutoria`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '32', title: 'Registar Erro / Incidente',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante1);
      await page.goto(`${BASE_URL}/tutoria/errors/new`, { waitUntil: 'load' });
      await pause(800);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      const inputs = page.locator('input:not([type="date"]):not([type="checkbox"]):not([type="radio"]):not([type="number"]), textarea').first();
      if (await inputs.count()) {
        await inputs.fill('Erro de liquidação — transação T+2 (Demo)');
        await pause(400);
      }
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '33', title: 'Ver Lista de Erros',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/errors`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const firstError = page.locator('article, tr, [class*="error-row"]').first();
      if (await firstError.count()) {
        await firstError.hover();
        await pause(600);
      }
      return page;
    }
  },

  {
    id: '34', title: 'Analisar um Erro (Chefe)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.chefe);
      await page.goto(`${BASE_URL}/tutoria/analysis`, { waitUntil: 'load' });
      await pause(1500);
      const firstError = page.locator('article, tr, a[href*="/tutoria/errors/"]').first();
      if (await firstError.count()) {
        await firstError.click();
        await page.waitForLoadState('load');
        await pause(2000);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await pause(800);
      }
      return page;
    }
  },

  {
    id: '35', title: 'Revisão do Tutor',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/tutor-review`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '36', title: 'Criar Plano de Acção (Tutoria)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/plans/new`, { waitUntil: 'load' });
      await pause(800);
      const titleInput = page.locator('input[name="title"], input').first();
      if (await titleInput.count()) {
        await titleInput.fill('Formação em Procedimentos de Liquidação (Demo)');
        await pause(400);
      }
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '37', title: 'Planos de Acção — Listar e Gerir',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/plans`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const firstPlan = page.locator('article').first();
      if (await firstPlan.count()) {
        await firstPlan.hover();
        await pause(700);
        await firstPlan.click();
        await page.waitForLoadState('load');
        await pause(2000);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await pause(800);
      }
      return page;
    }
  },

  {
    id: '38', title: 'Os Meus Planos de Acção (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante1);
      await page.goto(`${BASE_URL}/tutoria/my-plans`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '39', title: 'Fichas de Aprendizagem (Tutor)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/learning-sheets`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '40', title: 'As Minhas Fichas (Estudante)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante2);
      await page.goto(`${BASE_URL}/tutoria/my-learning-sheets`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '41', title: 'Erros Internos — Listar e Registar',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/internal-errors`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(700);
      const newBtn = page.getByRole('link', { name: /registar|novo/i }).first();
      if (await newBtn.count()) {
        await newBtn.hover();
        await pause(600);
        await newBtn.click();
        await page.waitForLoadState('load');
        await pause(1500);
        await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
        await pause(700);
      }
      return page;
    }
  },

  {
    id: '42', title: 'Censos (Sensos)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.chefe);
      await page.goto(`${BASE_URL}/tutoria/censos`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '43', title: 'Cápsulas Formativas (Tutor)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/capsulas`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(700);
      const newBtn = page.getByRole('button', { name: /nova cápsula|new/i }).first();
      if (await newBtn.count()) {
        await newBtn.hover();
        await pause(600);
        await newBtn.click();
        await pause(1000);
        const inputs = page.locator('input[type="text"]').first();
        if (await inputs.count()) {
          await inputs.fill('Câmbio à Vista — Fundamentos (Demo)');
          await pause(500);
        }
        await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
        await pause(600);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '44', title: 'Side-by-Side (Tutor)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.chefe);
      await page.goto(`${BASE_URL}/tutoria/side-by-side`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '45', title: 'Feedback de Liberadores',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/feedback`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '46', title: 'Responder Feedback (Liberador)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/tutoria/feedback/respond`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '47', title: 'Notificações da Tutoria',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante1);
      await page.goto(`${BASE_URL}/tutoria/notifications`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const markAllBtn = page.getByRole('button', { name: /marcar todas|mark all/i }).first();
      if (await markAllBtn.count()) {
        await markAllBtn.hover();
        await pause(600);
      }
      return page;
    }
  },

  // ── RELATÓRIOS ─────────────────────────────────────────────────────────────

  {
    id: '48', title: 'Visão Geral de Relatórios',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante2);
      await page.goto(`${BASE_URL}/relatorios`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '49', title: 'Relatório de Formações',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.gerente);
      await page.goto(`${BASE_URL}/relatorios/formacoes`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '50', title: 'Relatório de Tutoria',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.chefe);
      await page.goto(`${BASE_URL}/relatorios/tutoria`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '51', title: 'Relatório de Equipas',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/relatorios/teams`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '52', title: 'Relatório de Membros',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.gerente);
      await page.goto(`${BASE_URL}/relatorios/members`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '53', title: 'Relatório de Incidentes',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/relatorios/incidents`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '54', title: 'Relatório Tutoria Detalhado',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/relatorios/tutoria-report`, { waitUntil: 'load' });
      await pause(2500);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '55', title: 'Dashboard Feedback (Relatórios)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.tutor);
      await page.goto(`${BASE_URL}/relatorios/feedback-dashboard`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '56', title: 'Reports Avançados',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/relatorios/advanced-reports`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      const tabs = page.locator('[role="tab"]');
      const cnt = await tabs.count();
      for (let i = 0; i < Math.min(cnt, 3); i++) {
        await tabs.nth(i).click();
        await pause(700);
      }
      return page;
    }
  },

  // ── DADOS MESTRES ─────────────────────────────────────────────────────────

  {
    id: '57', title: 'Gerir Bancos (Dados Mestres)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const newBtn = page.getByRole('button', { name: /novo banco|new bank/i }).first();
      if (await newBtn.count()) {
        await newBtn.hover();
        await pause(600);
        await newBtn.click();
        await pause(800);
        const inputs = page.locator('input[type="text"]').first();
        if (await inputs.count()) {
          await inputs.fill('Millennium BCP (Demo)');
          await pause(400);
        }
        const closeBtn = page.getByRole('button', { name: /cancelar|fechar|close/i }).first();
        if (await closeBtn.count()) {
          await pause(600);
          await closeBtn.click();
        }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '58', title: 'Gerir Produtos (Dados Mestres)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/products`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const newBtn = page.getByRole('button', { name: /novo produto|new product/i }).first();
      if (await newBtn.count()) {
        await newBtn.hover();
        await pause(600);
        await newBtn.click();
        await pause(800);
        const inputs = page.locator('input[type="text"]').first();
        if (await inputs.count()) await inputs.fill('Custódia de Valores (Demo)');
        await pause(500);
        const closeBtn = page.getByRole('button', { name: /cancelar|fechar/i }).first();
        if (await closeBtn.count()) { await pause(400); await closeBtn.click(); }
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '59', title: 'Gerir Equipas e Membros',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/teams`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      const firstTeam = page.locator('article, tr').first();
      if (await firstTeam.count()) {
        await firstTeam.hover();
        await pause(600);
        await firstTeam.click();
        await page.waitForLoadState('load');
        await pause(2000);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await pause(700);
      }
      return page;
    }
  },

  {
    id: '60', title: 'Gerir Categorias de Erro',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/categories`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '61', title: 'Gerir Impactos, Origens e Tipologias',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      const tabs = [
        `${BASE_URL}/master-data/impacts`,
        `${BASE_URL}/master-data/origins`,
        `${BASE_URL}/master-data/error-types`,
        `${BASE_URL}/master-data/departments`,
      ];
      for (const url of tabs) {
        await page.goto(url, { waitUntil: 'load' });
        await pause(1000);
      }
      return page;
    }
  },

  {
    id: '62', title: 'Utilizadores — Dados Mestres',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/master-data/users`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  // ── CHAMADOS ──────────────────────────────────────────────────────────────

  {
    id: '63', title: 'Portal de Chamados — Kanban',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante3);
      await page.goto(`${BASE_URL}/chamados`, { waitUntil: 'load' });
      await pause(2500);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(800);
      return page;
    }
  },

  {
    id: '64', title: 'Criar um Chamado',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante3);
      await page.goto(`${BASE_URL}/chamados`, { waitUntil: 'load' });
      await pause(1200);
      const newBtn = page.getByRole('button', { name: /novo chamado|novo ticket|criar|new/i }).first();
      if (await newBtn.count()) {
        await newBtn.hover();
        await pause(600);
        await newBtn.click();
        await pause(800);
        const titleInput = page.locator('input[name="title"], input[placeholder*="título" i], input').first();
        if (await titleInput.count()) {
          await titleInput.fill('Erro ao carregar página de certificados');
          await pause(400);
        }
        const descInput = page.locator('textarea').first();
        if (await descInput.count()) {
          await descInput.fill('Ao clicar em Certificados, a página fica a carregar indefinidamente em Firefox e Chrome.');
          await pause(500);
        }
        await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
        await pause(800);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '65', title: 'Comentar num Chamado',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.estudante4);
      await page.goto(`${BASE_URL}/chamados`, { waitUntil: 'load' });
      await pause(1200);
      const firstCard = page.locator('[class*="card"], article, [class*="ticket"]').first();
      if (await firstCard.count()) {
        await firstCard.hover();
        await pause(600);
        await firstCard.click();
        await page.waitForLoadState('load');
        await pause(1500);
        const commentInput = page.locator('textarea').first();
        if (await commentInput.count()) {
          await commentInput.fill('Este erro também acontece em Firefox versão 122.');
          await pause(500);
        }
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
        await pause(800);
      }
      await pause(1000);
      return page;
    }
  },

  {
    id: '66', title: 'Actualizar Estado de Chamado (Admin)',
    async run(ctx) {
      const page = await ctx.newPage();
      await slow(page);
      await login(page, USERS.admin);
      await page.goto(`${BASE_URL}/chamados`, { waitUntil: 'load' });
      await pause(2000);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
      await pause(600);
      const firstCard = page.locator('[class*="card"], article').first();
      if (await firstCard.count()) {
        await firstCard.hover();
        await pause(600);
        const editBtn = firstCard.getByRole('button', { name: /editar|edit/i }).first();
        if (await editBtn.count()) {
          await editBtn.hover();
          await pause(500);
          await editBtn.click();
          await pause(1000);
          await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
          await pause(700);
        }
      }
      await pause(1000);
      return page;
    }
  },

];

// ── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(VIDEOS_DIR, { recursive: true });
  mkdirSync(TMP_DIR,    { recursive: true });

  const browser = await chromium.launch({
    headless: false,           // mostra o browser → mais natural no vídeo
    slowMo: 80,               // pequeno delay em cada acção → mais fluido
    args: ['--start-maximized'],
  });

  const total   = ACTIONS.length;
  let   success = 0;
  let   failed  = 0;

  log(`═══ Início da gravação — ${total} vídeos ═══`);
  log(`URL: ${BASE_URL}`);
  log(`Destino: ${VIDEOS_DIR}`);
  log('');

  for (const action of ACTIONS) {
    const label = `ac-${action.id}-${action.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'')}`;
    const destFile = join(VIDEOS_DIR, label + '.webm');

    // Salta se o vídeo já existe de uma execução anterior
    if (existsSync(destFile)) {
      log(`⏭  [${action.id}/${total}] ${action.title} (já existe — a saltar)`);
      success++;
      continue;
    }

    log(`⏺  [${action.id}/${total}] ${action.title}...`);

    const ctx = await newCtx(browser, label);
    let page;
    try {
      page = await action.run(ctx);
      if (page) {
        await saveVideo(ctx, page, label);
        success++;
      } else {
        await ctx.close();
        log(`  ⚠ sem página devolvida`);
        failed++;
      }
    } catch (err) {
      log(`  ✗ Erro: ${err.message}`);
      try { if (page) await saveVideo(ctx, page, label + '-error'); } catch {}
      try { await ctx.close(); } catch {}
      failed++;
    }

    // Pequena pausa entre vídeos para o browser recuperar
    await pause(1500);
  }

  await browser.close();

  log('');
  log(`═══ Concluído ═══`);
  log(`✓ ${success} vídeos gravados`);
  if (failed > 0) log(`✗ ${failed} falharam`);
  log(`Pasta: ${VIDEOS_DIR}`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
