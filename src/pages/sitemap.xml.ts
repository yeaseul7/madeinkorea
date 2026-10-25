import type { APIRoute } from 'astro';
import { seoLocales, seoRoutes } from '../data/seo';
export const GET: APIRoute = ({ site }) => {
 const base = import.meta.env.BASE_URL.replace(/\/$/, '');
 const url = (lang:string, path:string) => new URL(`${base}/${lang}/${path}`, site).href;
 const escape = (s:string) => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 const entries = seoRoutes.flatMap(path => Object.keys(seoLocales).map(lang => {
  const alternates = Object.entries(seoLocales).flatMap(([code,locale]) => [code,locale.region].map(tag => `<xhtml:link rel="alternate" hreflang="${tag}" href="${escape(url(code,path))}"/>`)).join('');
  return `<url><loc>${escape(url(lang,path))}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${escape(url('en',path))}"/></url>`;
 })).join('');
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
