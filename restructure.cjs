const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

console.log("Creating client directory...");
if (!fs.existsSync('client')) fs.mkdirSync('client');

// Move frontend files
const filesToMove = ['src', 'public', 'components.json', 'tsconfig.json', 'vite.config.ts', 'eslint.config.js', 'styles.css', 'index.html', 'bun.lockb', 'bunfig.toml', 'postcss.config.js', 'tailwind.config.ts', 'tailwind.config.js'];
for (const f of filesToMove) {
  if (fs.existsSync(f)) {
    console.log(`Moving ${f}...`);
    try {
      fs.renameSync(f, path.join('client', f));
    } catch (err) {
      console.log(`Rename failed for ${f}, trying copy...`);
      fs.cpSync(f, path.join('client', f), { recursive: true });
      fs.rmSync(f, { recursive: true, force: true });
    }
  }
}

// Create client/package.json
const clientPkg = {
  name: 'canteen-client',
  version: '1.0.0',
  private: true,
  type: 'module',
  scripts: {
    dev: 'vite dev',
    build: 'vite build',
    preview: 'vite preview'
  },
  dependencies: { ...pkg.dependencies },
  devDependencies: { ...pkg.devDependencies }
};

// Remove backend deps from client
const backendDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'dotenv', 'cors'];
for (const d of backendDeps) {
  if (clientPkg.dependencies) delete clientPkg.dependencies[d];
  if (clientPkg.devDependencies) delete clientPkg.devDependencies[d];
}
// Remove lovable config
if (clientPkg.dependencies) delete clientPkg.dependencies['@lovable.dev/vite-tanstack-config'];
if (clientPkg.devDependencies) delete clientPkg.devDependencies['@lovable.dev/vite-tanstack-config'];

// Add standard vite plugins
if (!clientPkg.dependencies) clientPkg.dependencies = {};
clientPkg.dependencies['@vitejs/plugin-react'] = '^4.2.1';
clientPkg.dependencies['tailwindcss'] = '^3.4.1';
clientPkg.dependencies['autoprefixer'] = '^10.4.17';
clientPkg.dependencies['postcss'] = '^8.4.35';

console.log("Writing client/package.json...");
fs.writeFileSync('client/package.json', JSON.stringify(clientPkg, null, 2));

// Update root package.json
const rootPkg = {
  name: 'canteen-monorepo',
  version: '1.0.0',
  private: true,
  scripts: {
    'dev': 'concurrently -n CLIENT,SERVER -c cyan,green "npm run dev:client" "npm run dev:server"',
    'dev:client': 'cd client && npm run dev',
    'dev:server': 'cd server && node --watch index.js',
    'seed': 'node server/seed.js',
    'install:all': 'npm install && cd client && npm install && cd ../server && npm install'
  },
  dependencies: {
    'concurrently': '^8.2.2'
  }
};
console.log("Writing root package.json...");
fs.writeFileSync('package.json', JSON.stringify(rootPkg, null, 2));

// Remove supabase
console.log("Removing supabase...");
if (fs.existsSync('supabase')) fs.rmSync('supabase', { recursive: true, force: true });
if (fs.existsSync('client/src/integrations/supabase')) fs.rmSync('client/src/integrations/supabase', { recursive: true, force: true });

// Create clean vite.config.ts in client
const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true
  }
});
`;
console.log("Writing standard vite config...");
fs.writeFileSync('client/vite.config.ts', viteConfig);

console.log('Restructuring complete!');
