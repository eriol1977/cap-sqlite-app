export const songsVersionUpgrades = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE song(
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        artist_name varchar NOT NULL, 
        song_name varchar NOT NULL
        );`,
    ],
  },
  {
    toVersion: 2,
    statements: [`ALTER TABLE song ADD COLUMN stars integer;`],
  },
];
