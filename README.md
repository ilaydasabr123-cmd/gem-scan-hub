# Gem Scan Hub

Baue eine responsive Web-App „Perlen-Manager & Perlenatelier“ im eleganten Cashmere-Blush-Design (warme Creme-, Sand- und softe Rosétöne, Tailwind CSS, Lucide Icons, optimiert für iPad-Touch und Desktop).

Die App arbeitet vollständig lokal mit IndexedDB (keine Cloud-Kosten, speichert Fotos und Daten direkt im Browser) und bietet einen vollständigen JSON-Import und -Export zur Datensicherung.

Die App besteht aus folgenden festen Bereichen:

1. Übersicht (Dashboard)
- Kennzahlen-Karten: Anzahl Perlen im Bestand, belegte Referenzfarben (aus 126 hinterlegten Tönen), Lagerorte (Boxen & Dosen) und erstellte Muster.
- Schnellaktionen: „Neuer Foto-Scan“, „Neues Armband planen“, „Bestand ansehen“.
- Lager-Schnellübersicht mit visuellen Belegungsbalken je Box und Dosen-Set.

2. Foto-Scan & Farberkennung (Kästen & Dosen)
- Sortierkasten-Scan:
  - Beliebige Rasterteilung (z. B. 4×7 Fächer), Foto-Upload oder Kamera.
  - 4-Punkt-Perspektivenentzerrung mit ziehbaren Eckpunkten.
  - Schieberegler für Randabschlag (blendet Kastenstege und Schatten aus).
  - Button „Raster-Ausrichtung fertig“, um Griffe gegen versehentliches Verschieben bei Touch/Scrollen zu sperren.
  - Button: „Fächer analysieren“.
- Dosen-Scan:
  - Eingabe der Anzahl kleiner und großer Dosen.
  - Schalterleiste [Dose 1], [Dose 2]... zur schnellen Markierung großer Dosen per Klick.
  - Frei verschiebbare vertikale Trennlinien für gemischte Dosenbreiten.
  - Button: „Dosen analysieren“ (misst den Doseninhalt ohne Reflexionen der Ränder).
- Farbanalyse:
  - Glanz- und Schattenfilter zur Entfernung von Plastikreflexionen.
  - Stabiler Median-Farbwert (RGB, HEX, CIELAB).
  - Farbabgleich über CIEDE2000 (ΔE00) gegen die 126 fest hinterlegten Referenztöne mit Top-Treffern.
  - Entwurfs-Tabelle: Erkannte Farben und Fächer/Dosen werden angezeigt und können per Klick in den Bestand übernommen werden.

3. Bestand & Lagerverwaltung
- Übersichtliche Tabelle und Kachelansicht aller Perlen mit Farbfeld, Farbcode, Perlengröße (mm), Form (Rocaille, Bicone etc.), Material und aktuellem Lagerort.
- Perlen manuell anlegen, bearbeiten und löschen.
- Lagerverwaltung:
  - Anlegen von Sortierboxen (mit Spalten und Zeilen) sowie kleinen und großen Dosen.
  - Visuelle Box-Ansicht: Fächer mit Farbpunkten der darin liegenden Perlen.

4. Etiketten- & Sticker-Drucker
- Schnelle Druckvorschau für Dosen-Aufkleber (rund) und Fächer-Beschriftungen (rechteckig).
- Zeigt Farbpunkt, Farbcode, Farbname und Lagerplatz an.
- 1-Klick-Export als hochauflösendes PNG-Bild zum direkten Drucken.

5. Perlenatelier & Armband-Designer (Digitaler Basteltisch)
- Virtuelle Perlenmatte (Muster erstellen wie im echten Leben):
  - Oben liegen konfigurierbare Perlen-Schälchen (z. B. Schälchen A: 2 mm Rocaille in Wunschfarbe, Schälchen B: 4 mm Bicone).
  - Durch Antippen der Schälchen werden die Perlen der Reihe nach auf den virtuellen Faden aufgefädelt und als Kette/Glied angezeigt.
  - Durch Tippen auf eine bereits aufgefädelte Perle kann der Faden erneut hindurchgeführt oder gekreuzt werden (für Blüten, Kreise, Rauten).
  - Unterstützung für 2 Fäden/Nadeln (z. B. Nadel A und Nadel B farblich unterscheidbar).
- Baukasten-System für Armbänder:
  - Erstellte Musterabschnitte (z. B. „Blume“, „Kreuzglied“) können als Bausteine gespeichert werden.
  - Armband zusammenstellen: Bausteine frei hintereinanderreihen oder abwechselnd wiederholen (z. B. Blume -> Kreuz -> Blume).
  - Längeneingabe (z. B. 17 cm): Berechnet automatisch die nötige Wiederholung, die Gesamtzahl aller benötigten Perlen und zeigt eine 2D-Vorschau des fertigen Armbands.

6. Datensicherung & Einstellungen
- Vollständiges JSON-Backup herunterladen und wiederherstellen.
- Einsicht in die 126 Referenz-Farbtöne.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gem-scan-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8bf40458-208c-441d-b972-b127e3760123).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
