#!/usr/bin/env node

/**
 * Fix Bundle Names - Shorter Names for Production
 */

import { neon } from '@neondatabase/serverless';

async function fixBundleNames() {
  console.log('🔄 Fixing bundle names to shorter versions...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('📊 Current bundle names check...');
    
    // Check current bundle names
    const currentBundles = await sql`SELECT id, name FROM bundles WHERE id IN ('bundle2', 'bundle3') ORDER BY id`;
    console.log('Current Bundle Names:');
    currentBundles.forEach(bundle => {
      console.log(`  ${bundle.id}: "${bundle.name}"`);
    });
    
    console.log('\n🔧 Updating to shorter names...');
    
    // Update Bundle 2 to shorter name
    const bundle2Update = await sql`
      UPDATE bundles 
      SET name = 'Team Bundle 1' 
      WHERE id = 'bundle2'
      RETURNING id, name
    `;
    console.log('✅ Bundle 2 updated:', bundle2Update[0]);
    
    // Update Bundle 3 to shorter name
    const bundle3Update = await sql`
      UPDATE bundles 
      SET name = 'Team Bundle 2' 
      WHERE id = 'bundle3'
      RETURNING id, name
    `;
    console.log('✅ Bundle 3 updated:', bundle3Update[0]);
    
    console.log('\n📋 Final verification...');
    
    // Verify final names
    const finalBundles = await sql`SELECT id, name FROM bundles WHERE id IN ('bundle2', 'bundle3') ORDER BY id`;
    console.log('Final Bundle Names:');
    finalBundles.forEach(bundle => {
      console.log(`  ${bundle.id}: "${bundle.name}"`);
    });
    
    console.log('\n🎉 Bundle names fixed successfully!');
    console.log('📝 Changes:');
    console.log('• Bundle 2 → "Team Bundle 1" (short name)');
    console.log('• Bundle 3 → "Team Bundle 2" (short name)');
    
  } catch (error) {
    console.error('❌ Error fixing bundle names:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixBundleNames().catch(console.error);