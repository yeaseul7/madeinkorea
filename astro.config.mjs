import { defineConfig } from 'astro/config';
const repository = process.env.GITHUB_REPOSITORY;
const [owner, name] = (repository || '').split('/');
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'https://example.com'),
  base: process.env.BASE_PATH ?? (name && !name.endsWith('.github.io') ? `/${name}` : '/'),
  trailingSlash: 'always',
});
