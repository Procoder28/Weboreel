export const PARAGRAPHS: string[] = [
  "The quiet hum of the city at dawn carries a strange kind of peace. Streets that will soon overflow with footsteps and conversation rest for a moment, holding their breath before the rush begins again.",
  "Learning to type quickly is less about speed and more about rhythm. When your fingers find a steady cadence, the words begin to flow without thought, and the keyboard becomes an extension of your mind.",
  "Somewhere between the first cup of coffee and the last line of code, ideas tend to appear. They arrive quietly, almost shyly, and only stay if you write them down before they wander off again.",
  "A good book does not demand your attention; it earns it. Page by page it builds a small world inside your head, until you forget the chair you are sitting in and the time that has slipped past.",
  "Practice is rarely glamorous. It is the same motion repeated until it becomes invisible, the same mistake corrected until it disappears. Mastery is simply the residue of patience and repetition combined.",
  "The mountain did not care that we were tired. It stood exactly as it had for a thousand years, indifferent and beautiful, and somehow that indifference made the climb feel meaningful instead of cruel.",
  "Technology moves fastest when nobody is watching. The tools we take for granted today were once strange experiments, dismissed by serious people who could not yet imagine how the future would look.",
  "Write the sentence you are afraid to write. Then write the next one. Slowly the fear becomes a paragraph, and the paragraph becomes a page, and the page becomes something you are proud to share.",
];

export function pickParagraph(prev?: string): string {
  if (PARAGRAPHS.length === 1) return PARAGRAPHS[0];
  let next = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
  while (next === prev) {
    next = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
  }
  return next;
}
