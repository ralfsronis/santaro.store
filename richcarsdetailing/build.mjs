// Builds the static site into dist/ from src/ and site.config.json.
//   node build.mjs               – build (warns if the domain is still a placeholder)
//   node build.mjs --production  – build and fail if any placeholder is left
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "src");
const dist = join(root, "dist");
const production = process.argv.includes("--production");

const cfg = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const siteUrl = cfg.siteUrl.replace(/\/+$/, "");
const a = cfg.address;
const fullAddress = `${a.street}, ${a.city}, ${a.postalCode}`;

// WhatsApp links: one number from config, message text URL-encoded.
const waLink = (text) => `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(text)}`;
const wa = Object.fromEntries(Object.entries(cfg.whatsappMessages).map(([k, v]) => [k, waLink(v)]));

// Google Maps route with the address as destination.
const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

const tel = `+${cfg.whatsappNumber}`;

const waIcon =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

// Structured data – must match what is visible on the page.
const service = (name, extra = {}) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name }, ...extra });
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "@id": `${siteUrl}/#business`,
  name: cfg.businessName,
  url: `${siteUrl}/`,
  image: `${siteUrl}/img/og-pirms-pec.jpg`,
  telephone: tel,
  address: {
    "@type": "PostalAddress",
    streetAddress: a.street,
    addressLocality: a.city,
    addressRegion: a.region,
    postalCode: a.postalCode,
    addressCountry: a.country,
  },
  areaServed: { "@type": "City", name: a.city },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Auto salona kopšanas pakalpojumi",
    itemListElement: [
      service("Auto salona tīrīšana", {
        priceSpecification: { "@type": "PriceSpecification", minPrice: 30, maxPrice: 50, priceCurrency: "EUR" },
      }),
      service("Salona ķīmiskā tīrīšana"),
      service("Interjera detailings"),
      service("Salona ozonēšana"),
    ],
  },
};

const read = (p) => readFileSync(join(src, p), "utf8");
const minifyCss = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,])\s*/g, "$1").replace(/;}/g, "}").trim();

const ctx = {
  siteUrl,
  businessName: cfg.businessName,
  phoneDisplay: cfg.phoneDisplay,
  tel,
  mapsUrl,
  wa,
  address: a,
  waIcon,
  year: String(new Date().getFullYear()),
  inlineCss: minifyCss(read("styles.css")),
  inlineJs: read("main.js").trim(),
  jsonLd: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
};

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const RAW = new Set(["waIcon", "inlineCss", "inlineJs", "jsonLd"]);
let html = read("index.html").replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
  const val = key.split(".").reduce((o, k) => (o == null ? o : o[k]), ctx);
  if (typeof val !== "string") throw new Error(`Unknown template key: ${key}`);
  return RAW.has(key) ? val : escapeAttr(val);
});

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const dir of ["img", "fonts"]) cpSync(join(src, dir), join(dist, dir), { recursive: true });
cpSync(join(src, "favicon.svg"), join(dist, "favicon.svg"));
writeFileSync(join(dist, "index.html"), html);

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n</urlset>\n`
);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

// Placeholder / indexability check
const problems = [];
const all = html + readFileSync(join(dist, "sitemap.xml"), "utf8") + readFileSync(join(dist, "robots.txt"), "utf8");
if (/DOMENS|\[DOMĒNS\]|\[WHATSAPP_NUMURS\]/.test(all)) problems.push("Vietturis domēnam vai numuram vēl nav nomainīts (site.config.json → siteUrl).");
if (/\{\{[\w.]+\}\}/.test(html)) problems.push("Veidnē palikuši neaizvietoti {{…}} lauki.");
if (/noindex/i.test(html)) problems.push("Lapā ir noindex.");
if (!/^https:\/\//.test(siteUrl)) problems.push("siteUrl jāsākas ar https://");

if (problems.length) {
  const msg = problems.map((p) => "  • " + p).join("\n");
  if (production) {
    console.error("Produkcijas pārbaude neizdevās:\n" + msg);
    process.exit(1);
  }
  console.warn("Brīdinājums (melnraksts):\n" + msg);
}
console.log(`Gatavs: ${dist}`);
