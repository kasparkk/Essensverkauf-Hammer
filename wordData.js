// Bausteine für die Wortschmiede.
// firstParts = "Bestimmungswort" (das Vorderglied), liefert die konkrete Alltagsszene.
// secondParts = "Grundwort" (das Hinterglied), liefert die abstrakte Gefühls-/Zustandskategorie
// und bestimmt (wie im echten Deutsch) das grammatische Geschlecht des Kompositums.

const firstParts = [
  { stem: "Montag", fugen: "s", clause: "man am Montagmorgen den Wecker dreimal wegdrückt, bevor man endlich aufsteht" },
  { stem: "Kaffee", fugen: "", clause: "die Kaffeemaschine ausgerechnet dann streikt, wenn man sie am dringendsten braucht" },
  { stem: "Handy", fugen: "", clause: "das Handy im wichtigsten Moment nur noch ein Prozent Akku hat" },
  { stem: "Socke", fugen: "n", clause: "nach dem Wäschewaschen eine einzelne Socke spurlos verschwunden ist" },
  { stem: "Chef", fugen: "", clause: "der Chef genau in dem Moment vorbeikommt, in dem man gerade gar nichts tut" },
  { stem: "Nachbar", fugen: "n", clause: "der Nachbar schon wieder samstags um acht Uhr zu bohren anfängt" },
  { stem: "Wolke", fugen: "n", clause: "man am liebsten wie eine Wolke einfach wegtreiben würde, mitten im Meeting" },
  { stem: "Keller", fugen: "", clause: "der Keller nach jedem Umzug doch wieder voller Kisten steht" },
  { stem: "Wecker", fugen: "", clause: "der Wecker ausgerechnet am freien Tag viel zu früh klingelt" },
  { stem: "Toast", fugen: "", clause: "der Toast beim Herunterfallen garantiert auf der Marmeladenseite landet" },
  { stem: "Regen", fugen: "", clause: "es zu regnen anfängt, genau nachdem man die Wäsche aufgehängt hat" },
  { stem: "Warteschlange", fugen: "n", clause: "man an der Kasse ausgerechnet die langsamste Schlange erwischt" },
  { stem: "Homeoffice", fugen: "", clause: "man erst mitten in der Videokonferenz merkt, dass das Mikro die ganze Zeit an war" },
  { stem: "Drucker", fugen: "", clause: "der Drucker genau dann einen Papierstau hat, wenn es besonders eilig ist" },
  { stem: "Katze", fugen: "n", clause: "die eigene Katze einen ansieht, als hätte man gerade etwas sehr Dummes getan" },
  { stem: "Urlaub", fugen: "s", clause: "am ersten Tag nach dem Urlaub schon fünfhundert ungelesene E-Mails warten" },
  { stem: "Sonntag", fugen: "s", clause: "am Sonntagabend plötzlich wieder alles auf einmal erledigt werden soll" },
  { stem: "Serie", fugen: "n", clause: "man sich fest vornimmt, nur noch eine Folge zu schauen, und es dann drei werden" },
  { stem: "Fahrstuhl", fugen: "", clause: "man im Fahrstuhl unerwartet dem eigenen Chef gegenübersteht und nichts zu sagen weiß" },
  { stem: "Akkustand", fugen: "s", clause: "der Akkustand des Laptops genau während der wichtigsten Präsentation auf zwei Prozent fällt" },
  { stem: "Supermarkt", fugen: "", clause: "man im Supermarkt merkt, dass man den Einkaufszettel zu Hause vergessen hat" },
  { stem: "Wochenende", fugen: "s", clause: "das Wochenende am Sonntagabend gefühlt schon wieder vorbei ist, bevor es richtig angefangen hat" },
];

const secondParts = [
  { suffix: "angst", gender: "die", build: (c) => `die Angst davor, dass ${c}` },
  { suffix: "glück", gender: "das", build: (c) => `das kleine Glück, das man empfindet, wenn ${c}` },
  { suffix: "schmerz", gender: "der", build: (c) => `der stille Schmerz, der entsteht, wenn ${c}` },
  { suffix: "freude", gender: "die", build: (c) => `die klammheimliche Freude darüber, dass ${c}` },
  { suffix: "panik", gender: "die", build: (c) => `die kurze Panik in dem Moment, in dem ${c}` },
  { suffix: "sehnsucht", gender: "die", build: (c) => `die diffuse Sehnsucht danach, dass ${c}` },
  { suffix: "zwang", gender: "der", build: (c) => `der innere Zwang, den man spürt, wenn ${c}` },
  { suffix: "neid", gender: "der", build: (c) => `der leise Neid, der aufkommt, wenn ${c}` },
  { suffix: "stolz", gender: "der", build: (c) => `der stille Stolz darüber, dass ${c}` },
  { suffix: "kater", gender: "der", build: (c) => `der übertragene Kater, der folgt, nachdem ${c}` },
  { suffix: "reflex", gender: "der", build: (c) => `der Reflex, sofort in Habachtstellung zu gehen, sobald ${c}` },
  { suffix: "trotz", gender: "der", build: (c) => `der kleine Trotz, der sich meldet, wenn ${c}` },
];

const exampleTemplates = [
  (word) => `Ich glaube, ich habe gerade akute ${word}.`,
  (word) => `Schon wieder dieser klassische Anfall von ${word}.`,
  (word) => `Man nennt das ${word} – jeder kennt es, aber kaum einer spricht drüber.`,
  (word) => `Warnung: ${word} kann jeden treffen, auch dich.`,
  (word) => `${word} ist keine offizielle Diagnose, fühlt sich aber manchmal ganz danach an.`,
  (word) => `Die fünf Stufen der ${word} beginnen meistens ganz harmlos.`,
];
