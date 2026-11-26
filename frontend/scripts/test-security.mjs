import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n🔒 Running Smakr Automated Security Test Suite...\n');

// 1. Next.js Security Headers Test
console.log('[Test 1] Next.js HTTP Security Headers Configuration');
const nextConfigContent = fs.readFileSync(path.resolve('next.config.ts'), 'utf8');
assert(nextConfigContent.includes('X-Frame-Options'), 'Configures X-Frame-Options (anti-clickjacking)');
assert(nextConfigContent.includes('SAMEORIGIN'), 'X-Frame-Options set to SAMEORIGIN');
assert(nextConfigContent.includes('X-Content-Type-Options') && nextConfigContent.includes('nosniff'), 'Configures X-Content-Type-Options: nosniff');
assert(nextConfigContent.includes('Referrer-Policy'), 'Configures Referrer-Policy');
assert(nextConfigContent.includes('Permissions-Policy'), 'Configures Permissions-Policy');
assert(nextConfigContent.includes('Strict-Transport-Security'), 'Configures Strict-Transport-Security (HSTS)');
assert(nextConfigContent.includes('Content-Security-Policy'), 'Configures top-level Content-Security-Policy header');
assert(!nextConfigContent.includes('hostname: "**"') && !nextConfigContent.includes("hostname: '**'"), 'next/image remotePatterns avoids wildcard **');
assert(nextConfigContent.includes('contentSecurityPolicy'), 'Configures SVG Image Sandbox Policy');

// 2. Secret Key Isolation Test
console.log('\n[Test 2] Secret Key Client Isolation');
function checkDirForClientSecrets(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        checkDirForClientSecrets(fullPath);
      }
    } else if (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !fullPath.includes(path.join('app', 'api')))) {
      const code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('SUPABASE_SERVICE_ROLE_KEY') || code.includes('SUPABASE_SECRET_KEY')) {
        return false;
      }
    }
  }
  return true;
}
const secretsIsolated = checkDirForClientSecrets(path.resolve('src'));
assert(secretsIsolated, 'SUPABASE_SERVICE_ROLE_KEY is never imported or used in non-API client files');

// 3. Supabase Row-Level Security (RLS) Coverage
console.log('\n[Test 3] Supabase Row Level Security (RLS) Migrations');
const migrationsDir = path.resolve('supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
let allSql = '';
for (const f of migrationFiles) {
  allSql += fs.readFileSync(path.join(migrationsDir, f), 'utf8') + '\n';
}

const requiredTables = [
  'profiles',
  'venues',
  'food_posts',
  'venue_kitchen_tokens',
  'partner_claims',
  'weekly_picks',
  'beta_feedback',
  'post_likes',
  'post_saves',
];

for (const table of requiredTables) {
  const rlsRegex = new RegExp(`alter\\s+table\\s+(public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
  assert(rlsRegex.test(allSql), `Table "${table}" has Row Level Security (RLS) explicitly enabled`);
}

// 4. Admin API Route Authorization Verification
console.log('\n[Test 4] Admin Route Handlers Authorization Guards');
function collectAdminRoutes(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectAdminRoutes(fullPath));
    } else if (entry.name === 'route.ts') {
      found.push(fullPath);
    }
  }
  return found.sort();
}

const adminApiRoot = path.resolve('src', 'app', 'api', 'admin');
for (const routeFile of collectAdminRoutes(adminApiRoot)) {
  const label = path.relative(adminApiRoot, path.dirname(routeFile)).replace(/\\/g, '/') || '.';
  const code = fs.readFileSync(routeFile, 'utf8');
  assert(code.includes('requireAdmin()'), `/api/admin/${label} enforces server-side admin check`);
  assert(!code.includes('NODE_ENV !== "development"') && !code.includes("NODE_ENV !== 'development'"), `/api/admin/${label} has no development auth bypass`);
}

const middlewareCode = fs.readFileSync(path.resolve('src', 'middleware.ts'), 'utf8');
assert(middlewareCode.includes('isAdminRoute') && middlewareCode.includes('!user'), 'Middleware intercepts unauthenticated access to admin and lab routes');
assert(middlewareCode.includes('.from("profiles")') && middlewareCode.includes('"admin"'), 'Middleware verifies profiles.role === "admin" for admin and lab routes');
assert(middlewareCode.includes('/ad-reel') && middlewareCode.includes('/boot-lab'), 'Middleware includes /ad-reel and /boot-lab in admin route protection');

// 5. Sensitive Non-Admin Route Authorization Guards
console.log('\n[Test 5] Sensitive Partner, Places, AI & Reaction Guards');
const guardedRoutes = [
  ['partner/upload', 'requireAdmin()', ['src', 'app', 'api', 'partner', 'upload', 'route.ts']],
  ['partner/propose', 'requireAdmin()', ['src', 'app', 'api', 'partner', 'propose', 'route.ts']],
  ['places/details', 'requireAuthenticatedUser()', ['src', 'app', 'api', 'places', 'details', 'route.ts']],
  ['places/dish', 'requireAdmin()', ['src', 'app', 'api', 'places', 'dish', 'route.ts']],
  ['places/search', 'requireAuthenticatedUser()', ['src', 'app', 'api', 'places', 'search', 'route.ts']],
  ['places/photos/ingest', 'requireAdmin()', ['src', 'app', 'api', 'places', 'photos', 'ingest', 'route.ts']],
  ['ai/extract-food-post', 'requireAdmin()', ['src', 'app', 'api', 'ai', 'extract-food-post', 'route.ts']],
  ['reactions/reconcile', 'requireAuthenticatedUser()', ['src', 'app', 'api', 'reactions', 'reconcile', 'route.ts']],
];
for (const [label, guard, segments] of guardedRoutes) {
  const code = fs.readFileSync(path.resolve(...segments), 'utf8');
  assert(code.includes(guard), `/api/${label} enforces ${guard}`);
}

console.log(`\n==========================================`);
console.log(`  Tests completed: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`==========================================\n`);

if (failed > 0) {
  process.exit(1);
}
