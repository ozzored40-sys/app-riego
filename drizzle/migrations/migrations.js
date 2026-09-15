// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_sharp_jean_grey.sql';
import m0001 from './0001_nasty_santa_claus.sql';
import m0002 from './0002_tense_korath.sql';
import m0003 from './0003_aromatic_skaar.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  