// Bausteine für die Wortschmiede.
// Neue Wörter werden aus deutschen Lautbausteinen (Anlaut/Vokal/Auslaut)
// zusammengesetzt und bekommen je nach Wortart eine passende Endung.
// Klang und Bedeutung sind bewusst unabhängig voneinander – wie bei jedem
// echten Wort auch – deshalb kommt die Bedeutung aus einer eigenen Bank.

const onsets = [
  "", "", "b", "d", "f", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z",
  "sch", "sp", "st", "pf", "kn", "kl", "gr", "bl", "tr", "dr", "fl", "fr",
  "schl", "schm", "schn", "schw", "str", "gl", "kr", "pr", "zw", "qu",
];

const nuclei = ["a", "a", "e", "e", "i", "i", "o", "o", "u", "u", "ä", "ö", "ü", "ei", "au", "eu", "ie", "ie"];

const codas = [
  "", "", "", "b", "ch", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "sch", "t", "z",
  "nd", "ng", "rk", "lz", "tz", "ss", "ff", "mm", "nn", "ll", "nk", "rst",
];

const nounEndings = [
  { suffix: "ung", gender: "die" },
  { suffix: "heit", gender: "die" },
  { suffix: "keit", gender: "die" },
  { suffix: "nis", gender: "das" },
  { suffix: "tum", gender: "das" },
  { suffix: "ling", gender: "der" },
  { suffix: "er", gender: "der" },
  { suffix: "chen", gender: "das" },
  { suffix: "", gender: "der" },
  { suffix: "", gender: "die" },
  { suffix: "", gender: "das" },
];

const verbEndings = ["en", "en", "en", "eln", "ern"];
const adjEndings = ["ig", "lich", "isch", "sam", "haft", "bar"];

const scenarios = [
  "man am Montagmorgen den Wecker dreimal wegdrückt, bevor man endlich aufsteht",
  "die Kaffeemaschine ausgerechnet dann streikt, wenn man sie am dringendsten braucht",
  "das Handy im wichtigsten Moment nur noch ein Prozent Akku hat",
  "nach dem Wäschewaschen eine einzelne Socke spurlos verschwunden ist",
  "der Chef genau in dem Moment vorbeikommt, in dem man gerade gar nichts tut",
  "der Nachbar schon wieder samstags um acht Uhr zu bohren anfängt",
  "man am liebsten wie eine Wolke einfach wegtreiben würde, mitten im Meeting",
  "der Keller nach jedem Umzug doch wieder voller Kisten steht",
  "der Wecker ausgerechnet am freien Tag viel zu früh klingelt",
  "der Toast beim Herunterfallen garantiert auf der Marmeladenseite landet",
  "es zu regnen anfängt, genau nachdem man die Wäsche aufgehängt hat",
  "man an der Kasse ausgerechnet die langsamste Schlange erwischt",
  "man erst mitten in der Videokonferenz merkt, dass das Mikro die ganze Zeit an war",
  "der Drucker genau dann einen Papierstau hat, wenn es besonders eilig ist",
  "die eigene Katze einen ansieht, als hätte man gerade etwas sehr Dummes getan",
  "am ersten Tag nach dem Urlaub schon fünfhundert ungelesene E-Mails warten",
  "am Sonntagabend plötzlich wieder alles auf einmal erledigt werden soll",
  "man sich fest vornimmt, nur noch eine Folge zu schauen, und es dann drei werden",
  "man im Fahrstuhl unerwartet dem eigenen Chef gegenübersteht und nichts zu sagen weiß",
  "der Akkustand des Laptops genau während der wichtigsten Präsentation auf zwei Prozent fällt",
  "man im Supermarkt merkt, dass man den Einkaufszettel zu Hause vergessen hat",
  "das Wochenende am Sonntagabend gefühlt schon wieder vorbei ist, bevor es richtig angefangen hat",
];

const nounTemplates = [
  (s) => `Bezeichnung für die Situation, dass ${s}`,
  (s) => `Beschreibt den Moment, in dem ${s}`,
  (s) => `Steht für das Gefühl, das entsteht, wenn ${s}`,
  (s) => `Wird verwendet, wenn ${s}`,
  (s) => `Umschreibt den Zustand, in dem ${s}`,
];

const verbActions = [
  "heimlich mehr Kaffee zu trinken, als man zugibt",
  "so zu tun, als hätte man die Nachricht nicht gesehen",
  "kurz vor Feierabend noch schnell etwas anzufangen, das drei Stunden dauert",
  "im Stehen zu googeln, wie man das eigentlich macht, das man gerade tut",
  "beim Videocall zu nicken, ohne wirklich zuzuhören",
  "den Wecker zu stellen und ihn trotzdem zu verschlafen",
  "eine Nachricht dreimal umzuschreiben, bevor man sie abschickt",
  "am Kühlschrank zu stehen und zu hoffen, dass sich etwas Neues findet",
  "ein Fenster zu schließen, kurz bevor der Chef vorbeikommt",
  "sich mehr Notizen zu machen, als man je wieder liest",
  "beim Aufräumen mehr Dinge wiederzufinden, als man gesucht hat",
  "ein Meeting zu verlängern, indem man es zusammenfasst",
];

const adjQualities = [
  "so erschöpft, dass sogar Kaffee keine Wirkung mehr zeigt",
  "in dem Zustand, in dem man drei Tabs offen hat und alle das Gleiche sagen",
  "unentschlossen zwischen Aufstehen und noch fünf Minuten",
  "sichtbar genervt, aber zu höflich, um es zu sagen",
  "voller Tatendrang, der spätestens nach dem ersten Kaffee wieder verpufft",
  "innerlich schon im Feierabend, äußerlich noch im Meeting",
  "auf eine Art müde, die kein Schlaf mehr repariert",
  "bereit für alles, außer für das, was gerade passiert",
  "so aufgeräumt, dass man selbst überrascht ist",
  "leicht überfordert von der eigenen To-do-Liste",
  "entschlossen, morgen bestimmt früher anzufangen",
  "innerlich schon am Kühlschrank, obwohl man gerade erst gegessen hat",
];

const nounExamples = [
  (w) => `Ich glaube, ich habe gerade akute ${w}.`,
  (w) => `Schon wieder dieser klassische Anfall von ${w}.`,
  (w) => `Man nennt das ${w} – jeder kennt es, aber kaum einer spricht drüber.`,
  (w) => `Warnung: ${w} kann jeden treffen, auch dich.`,
  (w) => `${w} ist keine offizielle Diagnose, fühlt sich aber manchmal ganz danach an.`,
];

const verbExamples = [
  (w) => `Man sollte nicht immer sofort ${w}.`,
  (w) => `Er neigt dazu, in stressigen Momenten zu ${w}.`,
  (w) => `Wer zu lange wartet, fängt irgendwann an zu ${w}.`,
  (w) => `Bitte nicht am Schreibtisch ${w}.`,
  (w) => `Manche Leute können einfach nicht aufhören zu ${w}.`,
];

const adjExamples = [
  (w) => `Das war ziemlich ${w} von dir.`,
  (w) => `Sie wirkte heute ungewöhnlich ${w}.`,
  (w) => `Manchmal fühlt sich das Leben einfach ${w} an.`,
  (w) => `Ehrlich gesagt bist du gerade ein bisschen ${w}.`,
  (w) => `Montags ist einfach alles ${w}.`,
];

const wordClasses = ["noun", "noun", "verb", "adj"];
