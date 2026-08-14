// require("dns").setDefaultResultOrder("ipv4first");
// require('dotenv').config();
// const path = require('path');
// const mongoose = require('mongoose');
// const xlsx = require('xlsx');
// const Voter = require('../models/Voter');

// const FILE_PATH = process.argv[2] || path.join(__dirname, '../data/Link_Data_File.xlsx');
// const SHEET_NAME = 'Master Voter List';
// const BATCH_SIZE = 1000; // insert in chunks so 53k+ rows never hit one giant request

// // Never let a blank cell disappear from the row -- turn null/undefined into ''.
// const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

// async function main() {
//   if (!process.env.MONGO_URI) {
//     throw new Error('MONGO_URI is not set (check your .env file)');
//   }

//   console.log(`Reading ${FILE_PATH} ...`);
//   const workbook = xlsx.readFile(FILE_PATH, { cellDates: false });

//   const sheet = workbook.Sheets[SHEET_NAME];
//   if (!sheet) {
//     throw new Error(
//       `Sheet "${SHEET_NAME}" not found. Sheets in file: ${workbook.SheetNames.join(', ')}`
//     );
//   }

//   // header:1 -> array-of-arrays (so we control mapping ourselves)
//   // defval:'' -> a genuinely blank cell becomes '' instead of being omitted
//   const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

//   const dataRows = rows.slice(1); // row 0 is the header
//   console.log(`Found ${dataRows.length} data rows to import`);


//   const docs = dataRows.map((r) => ({
//     district: clean(r[0]),
//     part: clean(r[1]),
//     srNo: clean(r[2]),
//     electorName: clean(r[3]),
//     mobileNo: '',
//     address: clean(r[4]),
//     institute: clean(r[5]),
//     village: clean(r[6]),
//     taluka: clean(r[7]),
//     status: 'pending',
//   }));
//   console.log('Connecting to MongoDB...');
//   await mongoose.connect(process.env.MONGO_URI);
//   console.log('Connected.');

//   let inserted = 0;
//   let failed = 0;

//   for (let i = 0; i < docs.length; i += BATCH_SIZE) {
//     const batch = docs.slice(i, i + BATCH_SIZE);
//     try {
//       const result = await Voter.insertMany(batch, { ordered: false });
//       inserted += result.length;
//     } catch (err) {
//       const okCount = err.insertedDocs ? err.insertedDocs.length : 0;
//       inserted += okCount;
//       failed += batch.length - okCount;
//       console.error(
//         `Rows ${i}-${i + batch.length}: ${batch.length - okCount} failed (${err.message})`
//       );
//     }
//     console.log(`Progress: ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
//   }

//   console.log(`\nDone. Inserted: ${inserted}, Failed: ${failed}, Total in file: ${docs.length}`);
//   await mongoose.disconnect();
// }

// main().catch((err) => {
//   console.error('Fatal error:', err);
//   process.exit(1);
// });


require("dns").setDefaultResultOrder("ipv4first");
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Voter = require('../models/Voter');

const FILE_PATH = process.argv[2] || path.join(__dirname, '../data/Link_Data_File.xlsx');
const SHEET_NAME = process.argv[3] || 'Combined_121_140'; // pass a 2nd CLI arg to override
const BATCH_SIZE = 1000; // insert in chunks so 40k+ rows never hit one giant request

// Never let a blank cell disappear from the row -- turn null/undefined into ''.
const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set (check your .env file)');
  }

  console.log(`Reading ${FILE_PATH} ...`);
  const workbook = xlsx.readFile(FILE_PATH, { cellDates: false });

  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(
      `Sheet "${SHEET_NAME}" not found. Sheets in file: ${workbook.SheetNames.join(', ')}`
    );
  }

  // header:1 -> array-of-arrays (so we control mapping ourselves)
  // defval:'' -> a genuinely blank cell becomes '' instead of being omitted
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

  const dataRows = rows.slice(1); // row 0 is the header
  console.log(`Found ${dataRows.length} data rows to import`);

  // Actual column layout in this file:
  // 0 Dist | 1 Part | 2 Page | 3 Sr No | 4 Elector Name | 5 Address
  // 6 Institute | 7 Village | 8 Taluka | 9 Age | 10 Gender | 11 Mob.No
  // (Age/Gender are dropped -- Voter schema has no field for them;
  //  Mob.No is empty in this file but mapped in case future files fill it in)
  const docs = dataRows.map((r) => ({
    district: clean(r[0]),
    part: clean(r[1]),
    srNo: clean(r[3]),
    electorName: clean(r[4]),
    address: clean(r[5]),
    institute: clean(r[6]),
    village: clean(r[7]),
    taluka: clean(r[8]),
    mobileNo: clean(r[11]),
    status: 'pending',
  }));

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    try {
      const result = await Voter.insertMany(batch, { ordered: false });
      inserted += result.length;
    } catch (err) {
      const okCount = err.insertedDocs ? err.insertedDocs.length : 0;
      inserted += okCount;
      failed += batch.length - okCount;
      console.error(
        `Rows ${i}-${i + batch.length}: ${batch.length - okCount} failed (${err.message})`
      );
    }
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Failed: ${failed}, Total in file: ${docs.length}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
