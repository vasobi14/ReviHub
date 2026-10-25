import type { TitleType } from '../types/title.types.js';

// Demo content for showing the site. Descriptions and reviews are written
// for this project; reviewers are fictional

export const REVIEWERS = [
  'Alex Morgan',
  'Priya Nair',
  'Tom Becker',
  'Lena Novak',
  'Diego Alvarez',
  'Mia Chen',
  'Sam Okafor',
  'Elena Petrova',
  'Jonas Weber',
  'Kate Ryan',
] as const;

// [reviewer index, score 1-10, text]; an empty text is a score-only review
type SeedReview = [number, number, string];

interface SeedTitle {
  name: string;
  type: TitleType;
  releaseYear: number;
  description: string;
  reviews: SeedReview[];
}

export const TITLES: SeedTitle[] = [
  // Movies
  {
    name: 'The Shawshank Redemption',
    type: 'movie',
    releaseYear: 1994,
    description:
      'A banker sentenced to life for a crime he insists he did not commit spends two decades in a brutal prison, holding on to hope and an unlikely friendship.',
    reviews: [
      [
        0,
        10,
        'Every rewatch hits just as hard. The ending earns every second of the slow build.',
      ],
      [
        3,
        9,
        'Quiet, patient storytelling. Morgan Freeman narrating is half the magic.',
      ],
      [6, 10, 'The friendship at the center of it is what stays with me.'],
      [8, 8, 'A little sentimental in places, but it absolutely works.'],
      [9, 10, ''],
    ],
  },
  {
    name: 'Inception',
    type: 'movie',
    releaseYear: 2010,
    description:
      "A thief who steals secrets from dreams is offered a way home if he can do the reverse: plant an idea deep inside a target's mind.",
    reviews: [
      [
        1,
        9,
        'The hallway fight still looks incredible. Smart blockbuster done right.',
      ],
      [2, 8, 'A lot of exposition, but the last hour is pure momentum.'],
      [4, 9, "Hans Zimmer's score carries so much of the tension."],
      [7, 7, 'Clever puzzle box, slightly cold emotionally.'],
      [5, 9, ''],
      [0, 8, "I argued about the ending for a week. That's a good sign."],
    ],
  },
  {
    name: 'Spirited Away',
    type: 'movie',
    releaseYear: 2001,
    description:
      'Lost in a world of spirits after her parents are transformed, a ten-year-old girl takes a job at a bathhouse for gods to find a way back.',
    reviews: [
      [5, 10, 'Endlessly inventive. Every frame could be a painting.'],
      [3, 10, 'Watched it as a kid and again as an adult — it grows with you.'],
      [9, 9, 'No Face is one of the best movie creatures ever.'],
      [6, 9, 'Strange, gentle and a little scary in the best way.'],
    ],
  },
  {
    name: 'The Matrix',
    type: 'movie',
    releaseYear: 1999,
    description:
      'A hacker learns that the world he knows is a simulation built by machines, and that he may be the one to break humanity free.',
    reviews: [
      [2, 9, 'Still feels fresh. The lobby scene alone is worth it.'],
      [8, 8, 'Some effects aged, the ideas did not.'],
      [0, 9, ''],
      [4, 8, 'Cool, stylish and surprisingly philosophical.'],
      [7, 7, 'Great first half, the action takes over a bit at the end.'],
    ],
  },
  {
    name: 'Parasite',
    type: 'movie',
    releaseYear: 2019,
    description:
      'A struggling family cons its way into working for a wealthy household, until a discovery in the basement turns the scheme into something much darker.',
    reviews: [
      [1, 10, 'Funny, then tense, then devastating. Perfectly controlled.'],
      [6, 9, 'The house is basically a character of its own.'],
      [9, 10, 'Best film of its decade for me.'],
      [3, 9, 'I did not see the second half coming at all.'],
      [5, 8, ''],
    ],
  },
  {
    name: 'Interstellar',
    type: 'movie',
    releaseYear: 2014,
    description:
      'With Earth slowly dying, a former pilot leaves his children behind to travel through a wormhole in search of a new home for humanity.',
    reviews: [
      [4, 9, 'The docking scene had me holding my breath.'],
      [0, 10, 'Big ideas, bigger emotions. The father–daughter story got me.'],
      [2, 7, 'Visually stunning, though the third act is a stretch.'],
      [8, 8, 'Organ-heavy soundtrack is unforgettable.'],
    ],
  },
  {
    name: 'The Dark Knight',
    type: 'movie',
    releaseYear: 2008,
    description:
      "Batman, a determined police lieutenant and a new district attorney try to dismantle Gotham's crime syndicates, until an anarchist known as the Joker arrives.",
    reviews: [
      [
        2,
        10,
        'Heath Ledger is terrifying. The interrogation scene is a masterclass.',
      ],
      [6, 9, 'A crime thriller that happens to have Batman in it.'],
      [9, 9, ''],
      [7, 8, 'Runs a bit long, but rarely drags.'],
      [
        4,
        10,
        'Set the bar for superhero movies and nobody has cleared it since.',
      ],
      [1, 8, 'Two-Face deserved his own movie.'],
    ],
  },
  {
    name: 'Pulp Fiction',
    type: 'movie',
    releaseYear: 1994,
    description:
      "Two hitmen, a boxer, a gangster's wife and a pair of diner robbers cross paths in a series of darkly funny stories told out of order.",
    reviews: [
      [8, 9, 'The dialogue is the action. Endlessly quotable.'],
      [3, 7, 'Fun, but the violence is not really my thing.'],
      [0, 8, 'The non-linear structure is so satisfying when it clicks.'],
    ],
  },
  {
    name: 'Mad Max: Fury Road',
    type: 'movie',
    releaseYear: 2015,
    description:
      'In a desert wasteland, a drifter and a rebel commander flee a tyrant across the sand in a war rig, carrying the women he holds captive.',
    reviews: [
      [4, 10, 'Two hours of controlled chaos. Practical effects rule.'],
      [5, 9, 'Furiosa is the real lead and the movie knows it.'],
      [2, 8, "Barely any dialogue and it doesn't need any."],
      [9, 9, ''],
    ],
  },
  {
    name: 'Amélie',
    type: 'movie',
    releaseYear: 2001,
    description:
      'A shy waitress in Montmartre decides to quietly improve the lives of the people around her, while avoiding the chance to change her own.',
    reviews: [
      [3, 9, 'Pure charm. The colors and the music make me happy.'],
      [7, 8, 'Whimsical without being too sweet.'],
      [1, 7, 'Lovely, though a little too quirky at times.'],
    ],
  },
  {
    name: 'Dune',
    type: 'movie',
    releaseYear: 2021,
    description:
      'The heir of a noble family is sent with his people to the most dangerous planet in the universe, the only source of its most valuable substance.',
    reviews: [
      [
        0,
        8,
        'Huge, heavy and beautiful. Watch it on the biggest screen you can.',
      ],
      [6, 7, 'Feels like half a story, because it is.'],
      [8, 9, 'The sound design is unreal.'],
      [5, 8, ''],
      [2, 6, 'Gorgeous, but I wanted more character moments.'],
    ],
  },
  {
    name: 'Everything Everywhere All at Once',
    type: 'movie',
    releaseYear: 2022,
    description:
      'A laundromat owner in the middle of a tax audit discovers she can borrow skills from her other selves across the multiverse — and must save all of them.',
    reviews: [
      [1, 9, 'Absurd, loud and somehow deeply moving about family.'],
      [9, 10, "The googly eye scene made me cry. I can't explain it."],
      [7, 6, 'Too much for me, but I respect the ambition.'],
      [4, 8, 'Never seen anything like it.'],
    ],
  },

  // Games
  {
    name: 'The Witcher 3: Wild Hunt',
    type: 'game',
    releaseYear: 2015,
    description:
      'A monster hunter searches a war-torn open world for his adopted daughter, who is pursued by a spectral army.',
    reviews: [
      [2, 10, "Side quests better than most games' main stories."],
      [4, 9, 'The Bloody Baron questline is unforgettable.'],
      [8, 9, 'Combat is clunky early on, the writing makes up for it.'],
      [0, 10, ''],
      [6, 9, 'Hearts of Stone might be my favorite expansion ever.'],
      [7, 8, 'Gwent ate 40 hours of my life. No regrets.'],
    ],
  },
  {
    name: 'Red Dead Redemption 2',
    type: 'game',
    releaseYear: 2018,
    description:
      'An outlaw rides with a fading gang through the last years of the American frontier, torn between loyalty and his own conscience.',
    reviews: [
      [0, 10, 'Arthur Morgan is one of the best characters in gaming.'],
      [
        3,
        8,
        'Slow and deliberate. Some people will hate the pacing, I loved it.',
      ],
      [6, 9, 'The world feels alive in a way few games manage.'],
      [9, 7, 'Beautiful, but the controls feel heavy.'],
    ],
  },
  {
    name: 'The Legend of Zelda: Breath of the Wild',
    type: 'game',
    releaseYear: 2017,
    description:
      'A knight wakes from a hundred-year sleep in a ruined kingdom and is free to explore it in any order to defeat the calamity at its center.',
    reviews: [
      [5, 10, 'The sense of freedom is unmatched. See a mountain, climb it.'],
      [1, 9, 'Weapon durability annoyed me, everything else is brilliant.'],
      [7, 9, ''],
      [4, 10, 'Changed how I think about open worlds.'],
    ],
  },
  {
    name: 'Hollow Knight',
    type: 'game',
    releaseYear: 2017,
    description:
      'A silent bug knight descends into a vast underground kingdom full of secrets, tough bosses and a melancholic history.',
    reviews: [
      [8, 10, 'Hard, fair and hauntingly beautiful.'],
      [2, 9, 'The map design is a work of art.'],
      [5, 8, 'Some late bosses tested my patience, but worth it.'],
      [6, 9, ''],
      [3, 7, 'Gorgeous, but I got lost a lot.'],
    ],
  },
  {
    name: 'Portal 2',
    type: 'game',
    releaseYear: 2011,
    description:
      'A test subject wakes in a crumbling science facility and solves physics puzzles with a portal gun, guided by a robot and taunted by an AI.',
    reviews: [
      [1, 10, "Funniest game I've played. Wheatley is perfect."],
      [9, 10, 'Co-op with a friend is pure joy.'],
      [4, 9, 'Every puzzle teaches you something without saying a word.'],
    ],
  },
  {
    name: 'Elden Ring',
    type: 'game',
    releaseYear: 2022,
    description:
      'In a shattered land ruled by demigods, a nameless exile sets out to restore the Elden Ring and become its lord.',
    reviews: [
      [4, 10, 'The first time you step out into Limgrave is magic.'],
      [
        0,
        9,
        'Hard, but you can always go somewhere else and come back stronger.',
      ],
      [7, 6, 'Too punishing for me, I gave up halfway.'],
      [2, 9, ''],
      [8, 8, 'Late-game balance is rough, the world is incredible.'],
    ],
  },
  {
    name: 'Stardew Valley',
    type: 'game',
    releaseYear: 2016,
    description:
      "Tired of city life, you inherit your grandfather's neglected farm and slowly rebuild it while getting to know a small town.",
    reviews: [
      [3, 10, 'My comfort game. One more day, then bed. Five days later…'],
      [5, 9, 'Unbelievable that one person made all of this.'],
      [9, 8, 'Relaxing, though the early energy limits are annoying.'],
      [1, 9, ''],
    ],
  },
  {
    name: 'Hades',
    type: 'game',
    releaseYear: 2020,
    description:
      'The son of the god of the dead tries again and again to fight his way out of the underworld, with help from the gods of Olympus.',
    reviews: [
      [6, 10, 'Dying actually moves the story forward. Brilliant design.'],
      [2, 9, 'Combat feels amazing, voice acting is top tier.'],
      [8, 9, "The best roguelike for people who don't like roguelikes."],
      [0, 8, ''],
    ],
  },
  {
    name: 'Disco Elysium',
    type: 'game',
    releaseYear: 2019,
    description:
      'A detective with no memory investigates a murder in a run-down city, arguing with his own thoughts along the way.',
    reviews: [
      [
        7,
        10,
        "The best writing I've seen in a game. Your skills talk back to you.",
      ],
      [3, 9, "More of a novel than a game, and that's a compliment."],
      [4, 6, 'Brilliant but exhausting to read through.'],
    ],
  },
  {
    name: 'Celeste',
    type: 'game',
    releaseYear: 2018,
    description:
      'A young woman climbs a mountain full of tricky platforming challenges while facing her anxiety along the way.',
    reviews: [
      [5, 9, 'Tough platforming with a surprisingly personal story.'],
      [9, 9, 'Assist mode is a great example of accessibility done right.'],
      [1, 8, 'The B-sides broke me.'],
    ],
  },
  {
    name: 'Minecraft',
    type: 'game',
    releaseYear: 2011,
    description:
      'A sandbox of blocks where you gather resources, survive the night and build anything you can imagine, alone or with friends.',
    reviews: [
      [6, 9, 'Endless. Still playing it with my friends years later.'],
      [0, 8, 'Survival mode can feel aimless without a goal.'],
      [2, 9, ''],
      [7, 7, 'Fun, but I need mods to keep it interesting.'],
      [9, 10, 'The most creative game ever made.'],
    ],
  },
  {
    name: "Baldur's Gate 3",
    type: 'game',
    releaseYear: 2023,
    description:
      'A party of adventurers infected with a mind-controlling parasite searches for a cure in a story where almost every choice matters.',
    reviews: [
      [8, 10, 'The amount of reactivity is absurd. It remembers everything.'],
      [3, 9, 'Companions feel like real people.'],
      [4, 8, 'Act 3 has some performance problems, the rest is outstanding.'],
      [1, 10, ''],
      [5, 9, 'Turn-based combat finally clicked for me here.'],
    ],
  },

  // Books
  {
    name: '1984',
    type: 'book',
    releaseYear: 1949,
    description:
      'In a totalitarian state that watches everyone and rewrites the past, a minor official begins a dangerous private rebellion.',
    reviews: [
      [7, 10, 'More relevant every year, which is not a comforting thought.'],
      [3, 9, 'The last part is genuinely hard to read.'],
      [9, 8, 'Bleak, but essential.'],
      [0, 9, ''],
    ],
  },
  {
    name: 'The Hobbit',
    type: 'book',
    releaseYear: 1937,
    description:
      'A home-loving hobbit is swept into a quest with a band of dwarves to reclaim their mountain home from a dragon.',
    reviews: [
      [5, 9, 'Cozy adventure. Perfect to read aloud.'],
      [2, 8, 'Lighter than The Lord of the Rings, and better for it.'],
      [6, 9, 'The riddle game with Gollum is the best chapter.'],
    ],
  },
  {
    name: 'Dune',
    type: 'book',
    releaseYear: 1965,
    description:
      "On a desert planet that produces the universe's most precious resource, a young heir becomes caught up in politics, religion and ecology.",
    reviews: [
      [0, 9, 'Dense at first, then impossible to put down.'],
      [8, 10, 'The worldbuilding is unbelievably detailed.'],
      [4, 7, 'Brilliant ideas, very dry prose.'],
      [6, 9, ''],
    ],
  },
  {
    name: 'To Kill a Mockingbird',
    type: 'book',
    releaseYear: 1960,
    description:
      'In a small Southern town, a girl watches her father defend a Black man accused of a crime, and learns about justice and prejudice.',
    reviews: [
      [3, 10, "Told through a child's eyes, which makes it hit harder."],
      [
        1,
        9,
        "Atticus Finch is the moral center of so many readers' childhoods.",
      ],
      [7, 8, ''],
    ],
  },
  {
    name: 'The Master and Margarita',
    type: 'book',
    releaseYear: 1967,
    description:
      'The devil and his strange entourage visit Soviet Moscow, while a story about Pontius Pilate unfolds in parallel.',
    reviews: [
      [7, 10, 'Satire, romance and philosophy in one wild book.'],
      [2, 9, 'Behemoth the cat steals every scene.'],
      [9, 9, 'Needs a reread to catch everything.'],
      [5, 8, ''],
    ],
  },
  {
    name: 'Crime and Punishment',
    type: 'book',
    releaseYear: 1866,
    description:
      'A poor former student in St. Petersburg commits a murder to prove a theory about himself, and then has to live with it.',
    reviews: [
      [8, 9, 'A psychological thriller written 150 years early.'],
      [0, 8, 'Slow in places, but the tension is incredible.'],
      [
        3,
        9,
        "Porfiry's conversations are some of the best scenes in literature.",
      ],
    ],
  },
  {
    name: 'The Little Prince',
    type: 'book',
    releaseYear: 1943,
    description:
      'A pilot stranded in the desert meets a small boy from another planet who tells him about the strange adults he met on his travels.',
    reviews: [
      [5, 10, "A children's book that is really for adults."],
      [1, 9, 'Short enough to read in an evening, deep enough for a lifetime.'],
      [6, 8, ''],
      [9, 9, '“What is essential is invisible to the eye.”'],
    ],
  },
  {
    name: 'Project Hail Mary',
    type: 'book',
    releaseYear: 2021,
    description:
      'A science teacher wakes alone on a spaceship with no memory of how he got there, and realizes the fate of Earth depends on him.',
    reviews: [
      [4, 10, 'Rocky is the best character of the decade. Fist my bump.'],
      [2, 9, 'Science problem after science problem and it never gets boring.'],
      [9, 9, 'Funnier than I expected.'],
      [7, 8, ''],
      [0, 9, 'Read it in two days.'],
    ],
  },
  {
    name: 'The Name of the Wind',
    type: 'book',
    releaseYear: 2007,
    description:
      'A legendary hero, now hiding as an innkeeper, tells the true story of his life: an orphan, a magic university and a search for the truth.',
    reviews: [
      [6, 9, 'The prose is gorgeous. Pity about the wait for book three.'],
      [5, 7, 'Kvothe is a bit too good at everything.'],
      [8, 8, ''],
    ],
  },
  {
    name: 'Sapiens',
    type: 'book',
    releaseYear: 2011,
    description:
      'A short history of humankind, from the first humans to the present, asking how one species came to rule the planet.',
    reviews: [
      [1, 8, 'Makes big history easy to read.'],
      [7, 6, 'Interesting, but some claims are very simplified.'],
      [3, 8, 'Great conversation starter.'],
    ],
  },
  {
    name: "Harry Potter and the Philosopher's Stone",
    type: 'book',
    releaseYear: 1997,
    description:
      'An orphan raised by his unkind relatives learns on his eleventh birthday that he is a wizard, and goes to a school of magic.',
    reviews: [
      [5, 9, 'Pure nostalgia, still charming.'],
      [9, 8, 'Simple compared to the later books, but the magic starts here.'],
      [2, 8, ''],
      [6, 9, 'The first trip to Diagon Alley is the best scene.'],
    ],
  },
  {
    name: 'The Martian',
    type: 'book',
    releaseYear: 2011,
    description:
      'Left behind on Mars after an accident, an astronaut has to use his engineering skills and sense of humor to survive until rescue.',
    reviews: [
      [4, 9, 'Problem solving as entertainment. Mark Watney is hilarious.'],
      [0, 8, 'Very technical, which I loved.'],
      [8, 9, ''],
    ],
  },
];
