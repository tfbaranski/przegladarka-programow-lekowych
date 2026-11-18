# Przeglądarka programów lekowych

Statyczna strona internetowa (HTML + JSON + PDF), bez serwera aplikacyjnego i bazy danych.

**Zawartość:**

- 145 programów lekowych z obwieszczenia MZ (stan 10/2026), z treścią podzieloną na sekcje: kwalifikacja, leczenie i dawkowanie, badania i monitorowanie, kryteria wyłączenia, pełny tekst.
- Dane z zarządzenia Prezesa NFZ nr 75/2026/DGL, ze zmianą wprowadzoną zarządzeniem nr 110/2026/DGL. Obejmują wymagania wobec świadczeniodawców, ryczałty diagnostyczne oraz dokumenty zespołów koordynacyjnych (PDF).
- Program B.162 ma formularze online: wniosek o kwalifikację, wniosek o zmianę leczenia oraz decyzję zespołu. Każdy formularz pozwala generować PDF.
- Lista ośrodków realizujących B.162 pochodzi z API NFZ „Informator o umowach” i obejmuje umowy na 2026 r. z kodem 03.0000.462.02.
- Wersje offline: aktywne PDF-y i plik Excel.

## Prywatność danych

Dane wpisane w formularzach zapisują się wyłącznie w przeglądarce użytkownika (localStorage). Strona nie wysyła ich na żaden serwer.

Zapisy są przypisane do domeny: dokumenty zapisane pod innym adresem przenosi się funkcją „Eksport JSON” / „Import JSON”.

## Publikacja

Opcje A–C publikują folder z tym plikiem (zawierający `index.html`), opcja D – katalog `B162`. Strona korzysta z adresów typu `#B162`, więc nie wymaga konfiguracji przekierowań.

### A. Netlify Drop (najszybciej)

1. Otwórz https://app.netlify.com/drop.
2. Przeciągnij rozpakowany folder.
3. Własną domenę dodasz w *Domain management → Add a domain* (wpis CNAME u rejestratora domeny).

### B. GitHub Pages

1. Umieść pliki w repozytorium.
2. Wejdź w *Settings → Pages → Source: Deploy from a branch → main / (root)*.
3. Własną domenę wpisz w *Custom domain*, a u rejestratora domeny dodaj CNAME na `<login>.github.io`.

### C. Cloudflare Pages / dowolny hosting

1. Wgraj zawartość folderu do katalogu publicznego serwera (np. przez FTP).
2. Nie jest potrzebny PHP, Node ani baza danych.

### D. Uruchomienie lokalne

Uruchom w terminalu:

```
python3 -m http.server 8000
```

Następnie otwórz http://localhost:8000.

Strony nie da się otworzyć podwójnym kliknięciem `index.html`, bo przeglądarki blokują wtedy wczytywanie plików JSON.

## Struktura

| Ścieżka | Zawartość |
|---|---|
| `index.html` | aplikacja |
| `data/index.json` | lista programów |
| `data/p/*.json` | treść każdego programu |
| `data/osrodki_b162.json` | ośrodki B.162 |
| `modules/b162-form.js` | moduł formularzy B.162 |
| `vendor/` | pdfmake (licencja MIT) |
| `docs/` | PDF-y dokumentów z zarządzenia NFZ |
| `docs/offline/` | formularze offline |

## Aktualizacja

Po nowym obwieszczeniu lub zarządzeniu trzeba ponownie wygenerować katalogi `data/` i `docs/` ze źródłowych plików Word.
