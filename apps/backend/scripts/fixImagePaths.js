// scripts/fixImagePaths.js - Fix image paths to match actual filenames
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Actual image filenames from the properties folder
const imageFiles = [
  'hotel_001_MA82mPIZeGI.jpg',
  'hotel_002__pPHgeHz1uk.jpg',
  'hotel_003_emqnSQwQQDo.jpg',
  'hotel_004_zSG-kd-L6vw.jpg',
  'hotel_005_2P_ifaetDm0.jpg',
  'hotel_006_jW7zki2f3qc.jpg',
  'hotel_007_9d7vmtrfAFQ.jpg',
  'hotel_008_xEaAoizNFV8.jpg',
  'hotel_009_i56w4ah3wAY.jpg',
  'hotel_010_Koei_7yYtIo.jpg',
  'hotel_011_uI5WSGDdkhQ.jpg',
  'hotel_012_N8QncNI5i_M.jpg',
  'hotel_013_DGa0LQ0yDPc.jpg',
  'hotel_014_Jyg7xHRmXiU.jpg',
  'hotel_015_pZDi3kgzWTY.jpg',
  'hotel_016_R5v8Xtc0ecg.jpg',
  'hotel_017_3syTDiVAc7w.jpg',
  'hotel_018_BQLFUB4_EJw.jpg',
  'hotel_019_FbyJ2kKwino.jpg',
  'hotel_020_Z76GWwaTCjQ.jpg',
  'hotel_021_YCW4BEhKluw.jpg',
  'hotel_022_nfF5-G6cFwY.jpg',
  'hotel_023_SLNksSRdLak.jpg',
  'hotel_024_6hXO_QJYUKc.jpg',
  'hotel_025_ym_EI-DTS1g.jpg',
  'hotel_026_rlwE8f8anOc.jpg',
  'hotel_027_d-eWGvLCZfQ.jpg',
  'hotel_028_rpcvQHr2qsI.jpg',
  'hotel_029_yB6WFHbkX40.jpg',
  'hotel_030_bpvWdfSnt0Q.jpg',
  'hotel_031_M7GddPqJowg.jpg',
  'hotel_032_xc4oxgAbDmw.jpg',
  'hotel_033_cbxynt_6Aao.jpg',
  'hotel_034_b87_egH5mos.jpg',
  'hotel_035_tR4b1mjGdng.jpg',
  'hotel_036__4qQsmE4VdA.jpg',
  'hotel_037_YH7KYtYMET0.jpg',
  'hotel_038_IxKvNGXuAIM.jpg',
  'hotel_039_2gOxKj594nM.jpg',
  'hotel_040_TAgGZWz6Qg8.jpg',
  'hotel_041_7O1mQ9sXys0.jpg',
  'hotel_042_igilpGU_ml0.jpg',
  'hotel_043_8CDuHXff3zo.jpg',
  'hotel_044_Vl5DAQxNBbM.jpg',
  'hotel_045_WWYF8Lts8Ho.jpg',
  'hotel_046_JNoJ-eisUuY.jpg',
  'hotel_047_3n7bxyRYQ24.jpg',
  'hotel_048_eNwPokqVAn0.jpg',
  'hotel_049_alSZkWagD54.jpg',
  'hotel_050_HzsNeQQqPkA.jpg',
  'hotel_051_UHmwZc0lG00.jpg',
  'hotel_052_fBdlytm6Hp8.jpg',
  'hotel_053_XA6vchunFJk.jpg',
  'hotel_054_PibraWHb4h8.jpg',
  'hotel_055_UPmJc4OF62U.jpg',
  'hotel_056_iAftdIcgpFc.jpg',
  'hotel_057_fzmMaeN44po.jpg',
  'hotel_058_aapSemzfsOk.jpg',
  'hotel_059_pSDe7ePo0Tc.jpg',
  'hotel_060_p77qNCTFEJQ.jpg',
  'hotel_061_al1siBLP7QM.jpg',
  'hotel_062_67-sOi7mVIk.jpg',
  'hotel_063_NlxyCPK2vLg.jpg',
  'hotel_064_qvB0m1runPs.jpg',
  'hotel_065_BrRUz98UobI.jpg',
  'hotel_066__6leEoWt7aI.jpg',
  'hotel_067_5vnb4slzacs.jpg',
  'hotel_068_TD00EblxBRQ.jpg',
  'hotel_069_BUXArnECLxg.jpg',
  'hotel_070_UiKSeMEftPs.jpg',
  'hotel_071_XEr5JtR6gnw.jpg',
  'hotel_072_OcFAoeRZqoM.jpg',
  'hotel_073_dYyBb1Kgcms.jpg',
  'hotel_074_dsoWEYWtYYM.jpg',
  'hotel_075_7YBhszMWnkA.jpg',
  'hotel_076_XqwlmPTrq40.jpg',
  'hotel_077_0zzv_Sngo8s.jpg',
  'hotel_078_SJ0fEt4Q8Fs.jpg',
  'hotel_079_27m2a1UZoN4.jpg',
  'hotel_080_HxjLVAtK8OE.jpg',
  'hotel_081_cUUReBB9tK0.jpg',
  'hotel_082_AdRrZe59c9M.jpg',
  'hotel_083_96xFaFuSy3I.jpg',
  'hotel_084_7DVAiyyT1NE.jpg',
  'hotel_085_ATprPSzYu00.jpg',
  'hotel_086_JVtCoqIacmY.jpg',
  'hotel_087_67DQVOLWN3c.jpg',
  'hotel_088_qOWmakQfIfM.jpg',
  'hotel_089_wyVkzZwu4WA.jpg',
  'hotel_090_EMZ4ubvYvqE.jpg',
  'hotel_091_lz6k8rhBJIk.jpg',
  'hotel_092_oF7t781Bh0M.jpg',
  'hotel_093_B5fzqOl7BdE.jpg',
  'hotel_094__sEGDsfPlKc.jpg',
  'hotel_095_oi7Zkz1Kchg.jpg',
  'hotel_096_lLT8jXU0mx0.jpg',
  'hotel_097_hEAGekaiJ8g.jpg',
  'hotel_098_Bebi3LbgDXo.jpg',
  'hotel_099_lBSS8IbwNFc.jpg',
  'hotel_100_pt0ZBfB06gI.jpg'
];

async function fixImagePaths() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const properties = await db.collection('properties').find({}).sort({ createdAt: 1 }).toArray();
    
    console.log(`📊 Found ${properties.length} properties to update\n`);
    
    let updateCount = 0;
    
    for (let i = 0; i < properties.length && i < imageFiles.length; i++) {
      const property = properties[i];
      const newImages = [`/images/properties/${imageFiles[i]}`];
      
      // Add second image if available
      if (i + 1 < imageFiles.length) {
        newImages.push(`/images/properties/${imageFiles[i + 1]}`);
      }
      
      await db.collection('properties').updateOne(
        { _id: property._id },
        { $set: { images: newImages } }
      );
      
      updateCount++;
      
      if (updateCount % 20 === 0) {
        console.log(`   Updated ${updateCount} properties...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updateCount} properties with correct image paths!`);
    
    // Show sample
    const sample = await db.collection('properties').findOne({});
    console.log(`\n📸 Sample property images:`);
    console.log(`   ${sample.property_name}`);
    console.log(`   Images: ${JSON.stringify(sample.images)}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixImagePaths();

