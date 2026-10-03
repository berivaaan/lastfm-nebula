# Last.fm Nebula – 3D Music Information Retrieval and Semantic Network Visualization


**Live-Demonstration:** (https://lastfm-nebula.vercel.app) 

---

## Abstract
...

## Abstract

Last.fm Nebula ist eine webbasierte Anwendung zur interaktiven Exploration und räumlichen Repräsentation von Musikähnlichkeitsnetzwerken im dreidimensionalen Raum. Das System verbindet methodische Ansätze des Music Information Retrieval (MIR) auf zweierlei Ebenen: der semantischen Analyse kontextueller Metadaten (Collaborative Filtering, User-Generated Folksonomies) sowie der inhaltsbasierten Extraktion von Audio-Deskriptoren (Content-Based Audio Analysis). Die Übertragung hochdimensionaler Ähnlichkeitsbeziehungen in einen interaktiven euklidischen Koordinatenraum ermöglicht eine explorative Wissensentdeckung (Exploratory Search) und die Veranschaulichung musikalischer Kontexte.

---

## 1. Theoretischer Hintergrund & MIR-Architektur

Die Anwendung demonstriert die Integration und Gegenüberstellung der zwei Kernparadigmen des Music Information Retrieval:

### 1.1 Context-Based MIR (Kollaborative Daten & Soziale Semantik)
* **Kollaboratives Filtern:** Nutzung der Last.fm Web-API zur Extraktion von Künstlernetzwerken. Die Ähnlichkeitsmetrik basiert auf Co-Occurrence- und Hörgewohnheitsdaten einer globalen Nutzerbasis.
* **Folksonomien & Tag-Filterung:** Aggregation unstrukturierter Community-Tags zur Identifikation musikalischer Subgenres. Ein selektiver Filtermodus isoliert semantische Cluster, indem unkorrelierte Entitäten im Rendering abgedunkelt werden.
* **Räumliches Mapping:** Die metrische Distanz zum Seed-Knoten (Zentrum) wird invers proportional zum normalisierten Ähnlichkeitskoeffizienten ($1 - \text{match}$) abgebildet. Die winkelbasierte Verteilung folgt einer sphärischen Fibonacci-Verteilung nach dem Prinzip des Goldenen Schnitts ($\Phi$), um Überlappungen von Knoten im Raum zu minimieren und eine organische kosmische Struktur zu erzeugen.

### 1.2 Content-Based MIR (Digitale Audiosignalverarbeitung)
* **Echtzeit-Merkmalsextraktion:** Anbindung von 30-sekündigen Audiovorschauen über die Web Audio API unter Nutzung einer Fast-Fourier-Transformation (FFT, FFT-Größe: 64 Bins via `AnalyserNode`).
* **Spectral Centroid (Spektraler Schwerpunkt):** Berechnung des gewichteten Mittelwerts der Frequenzmagnituden pro Analyseframe zur quantitativen Erfassung der wahrgenommenen Timbre-Helligkeit:
  $$\text{Centroid} = \frac{\sum_{k=0}^{N-1} f(k) \cdot \vert{}X(k)\vert{}}{\sum_{k=0}^{N-1} \vert{}X(k)\vert{}}$$
* **Root Mean Square (RMS / Signalenergie):** Dynamische Schätzung der Signalamplitude zur Veranschaulichung der Lautheitsdichte.
* **Audio-Reaktives Rendering:** Verknüpfung der extrahierten Niederfrequenzbänder (Bass) mit den geometrischen Skalierungsfaktoren der 3D-Knoten (`lerp`-Interpolation) sowie Kopplung höherer Frequenzbänder an die Materialemissivität.

---

## 2. Systemarchitektur & Technische Implementierung

* **Frontend Framework:** React 18, Vite
* **3D-Grafikpipeline & Shader:** WebGL, Three.js, React Three Fiber (R3F), React Three Drei
* **Post-Processing:** `@react-three/postprocessing` (Luminance-Thresholding für selektive Bloom-Illumination)
* **Audiosignalverarbeitung:** Web Audio API (`AudioContext`, `AnalyserNode`)
* **Schnittstellen (APIs):** Last.fm REST API, iTunes Search API
* **Typografie & UI-Layer:** Lucide-React, modulares CSS-in-JS

---

## 3. Funktionale Merkmale

* **Explorative Graph-Navigation:** Fortlaufende Traversierung des Musikgraphen über den Navigationspfad (Breadcrumbs) zur schrittweisen Erforschung semantischer Nachbarschaften.
* **Interaktives Kamera-Tracking:** Automatisierte Ausrichtung und Transition der Kameraposition (`CameraControls`) auf ausgewählte Zielknoten.
* **Dynamische Linien- und Knotengewichtung:** Die visuelle Opazität der Verbindungskanten reflektiert die berechnete Kantenstärke (Match-Score).

---

## 4. Installation und Ausführung

Die Anwendung kann direkt und ohne lokale Installation über die bereitgestellte Web-Instanz unter (https://lastfm-nebula.vercel.app) ausgeführt werden.

Zur Inbetriebnahme der Anwendung wird eine Node.js-Laufzeitumgebung (Version 18 oder höher) vorausgesetzt. Nach dem Klonen des Repositories über Git (`git clone https://github.com/berivaaan/lastfm-nebula.git`) und dem Wechsel in das Projektverzeichnis (`cd lastfm-nebula`) werden alle projektspezifischen Abhängigkeiten mittels `npm install` eingerichtet.

Die Abfrage von Ähnlichkeitsgraphen und Künstler-Metadaten erfordert einen persönlichen API-Schlüssel von Last.fm. Hierzu wird im Wurzelverzeichnis der Anwendung eine Umgebungsvariablendatei mit dem Namen `.env` angelegt, die den Eintrag `VITE_LASTFM_API_KEY=ihr_lastfm_api_schluessel` enthält; eine Referenzvorlage ist in der Datei `.env.example` hinterlegt. 

Der lokale Entwicklungsserver wird anschließend über den Befehl `npm run dev` gestartet. Die Webanwendung ist daraufhin im Webbrowser unter der Standardadresse `http://localhost:5173` erreichbar.