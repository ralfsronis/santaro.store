# RichCarsDetailing – mājaslapa

Statiska vienas lapas mājaslapa (bez atkarībām). Gatavā versija ir mapē `dist/` – to var augšupielādēt jebkurā hostingā (Netlify, Cloudflare Pages, GitHub Pages, parasts hostings).

## Kur ko mainīt

| Ko | Kur |
| --- | --- |
| WhatsApp / tālruņa numurs | `site.config.json` → `whatsappNumber` (bez `+`, ar 371) un `phoneDisplay` |
| Domēns (canonical, sitemap, OG, JSON-LD) | `site.config.json` → `siteUrl` |
| WhatsApp ziņu teksti | `site.config.json` → `whatsappMessages` |
| Adrese | `site.config.json` → `address` |
| Lapas teksti | `src/index.html` |
| Fotogrāfijas | `src/img/` (`bmw-*` ievadā, `mercedes-*` sadaļā „Pirms un pēc”). Aizstājot saglabā tos pašus nosaukumus un 3:4 proporciju. |
| Stils | `src/styles.css` |
| Uzraksts „RichCars Detailing” | Lapā tas ir teksts (`src/index.html`, klase `wordmark`). Faili sociālajiem tīkliem: `logo/` |
| Biežākie jautājumi | `src/faq.json` (no šī faila top gan redzamās atbildes, gan Google strukturētie dati) |

## Būvēšana

```bash
node build.mjs               # melnraksts – brīdina, ja domēns vēl ir vietturis
node build.mjs --production  # neizdodas, ja palicis kāds vietturis
```

Pēc izmaiņām vienmēr palaid būvēšanu un augšupielādē mapes `dist/` saturu.
