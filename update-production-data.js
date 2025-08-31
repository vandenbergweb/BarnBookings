#!/usr/bin/env node

/**
 * Production Database Update Script
 * Updates Space B pricing and Team Bundle names to match current requirements
 * 
 * IMPORTANT: This should be run in production environment or with production DATABASE_URL
 */

import { neon } from '@neondatabase/serverless';

async function updateProductionData() {
  console.log('🔄 Starting production data update...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('📊 Current state check...');
    
    // Check current space B pricing
    const currentSpaces = await sql`SELECT id, name, hourly_rate FROM spaces WHERE id = 'B'`;
    console.log('Current Space B:', currentSpaces[0]);
    
    // Check current bundle names
    const currentBundles = await sql`SELECT id, name, hourly_rate, is_active FROM bundles ORDER BY id`;
    console.log('Current Bundles:');
    currentBundles.forEach(bundle => {
      console.log(`  ${bundle.id}: "${bundle.name}" - $${bundle.hourly_rate}/hr - Active: ${bundle.is_active}`);
    });
    
    console.log('\n🔧 Applying updates...');
    
    // Update Space B pricing to $30.00
    const spaceUpdate = await sql`
      UPDATE spaces 
      SET hourly_rate = 30.00 
      WHERE id = 'B'
      RETURNING id, name, hourly_rate
    `;
    console.log('✅ Space B updated:', spaceUpdate[0]);
    
    // Update Bundle names and deactivate Bundle 1
    const bundle1Update = await sql`
      UPDATE bundles 
      SET is_active = false 
      WHERE id = 'bundle1'
      RETURNING id, name, is_active
    `;
    console.log('✅ Bundle 1 deactivated:', bundle1Update[0]);
    
    const bundle2Update = await sql`
      UPDATE bundles 
      SET name = 'Team Bundle 1 - Spaces A, B & C - Practice + batting cages' 
      WHERE id = 'bundle2'
      RETURNING id, name
    `;
    console.log('✅ Bundle 2 renamed:', bundle2Update[0]);
    
    const bundle3Update = await sql`
      UPDATE bundles 
      SET name = 'Team Bundle 2 - Entire Facility - Spaces A, B, C & D' 
      WHERE id = 'bundle3'
      RETURNING id, name
    `;
    console.log('✅ Bundle 3 renamed:', bundle3Update[0]);
    
    console.log('\n📋 Final verification...');
    
    // Verify all updates
    const finalSpaces = await sql`SELECT id, name, hourly_rate FROM spaces WHERE id = 'B'`;
    const finalBundles = await sql`SELECT id, name, hourly_rate, is_active FROM bundles ORDER BY id`;
    
    console.log('Final Space B:', finalSpaces[0]);
    console.log('Final Bundles:');
    finalBundles.forEach(bundle => {
      console.log(`  ${bundle.id}: "${bundle.name}" - $${bundle.hourly_rate}/hr - Active: ${bundle.is_active}`);
    });
    
    console.log('\n🎉 Production data update completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('• Space B pricing updated to $30.00/hr');
    console.log('• Bundle 1 deactivated (no longer shown to users)');
    console.log('• Bundle 2 renamed to "Team Bundle 1 - Spaces A, B & C - Practice + batting cages"');
    console.log('• Bundle 3 renamed to "Team Bundle 2 - Entire Facility - Spaces A, B, C & D"');
    
  } catch (error) {
    console.error('❌ Error updating production data:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the update
updateProductionData().catch(console.error);