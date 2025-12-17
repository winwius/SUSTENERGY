const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

/**
 * DOCX XML Inspector
 * 
 * This script extracts and analyzes the internal XML structure of a DOCX file.
 * Usage: node inspect-docx.js <path-to-docx-file>
 */

const inspectDOCX = (docxPath) => {
    console.log('\n=== DOCX XML Inspector ===\n');
    console.log(`Inspecting: ${docxPath}\n`);

    if (!fs.existsSync(docxPath)) {
        console.error(`Error: File not found: ${docxPath}`);
        process.exit(1);
    }

    try {
        // Extract the DOCX (which is a ZIP file)
        const zip = new AdmZip(docxPath);
        const zipEntries = zip.getEntries();

        console.log('📦 Files in DOCX archive:');
        console.log('=' + '='.repeat(50));
        zipEntries.forEach(entry => {
            console.log(`  ${entry.entryName} (${entry.header.size} bytes)`);
        });
        console.log('\n');

        // 1. Check [Content_Types].xml
        console.log('📄 [Content_Types].xml:');
        console.log('=' + '='.repeat(50));
        const contentTypes = zip.readAsText('[Content_Types].xml');
        console.log(contentTypes);
        console.log('\n');

        // Look for image content types
        const imageTypes = contentTypes.match(/<Default[^>]*Extension="(png|jpg|jpeg|gif)"[^>]*>/g);
        if (imageTypes) {
            console.log('✅ Image types registered:');
            imageTypes.forEach(type => console.log(`  ${type}`));
        } else {
            console.log('❌ No image content types found!');
        }
        console.log('\n');

        // 2. Check word/_rels/document.xml.rels
        console.log('🔗 word/_rels/document.xml.rels:');
        console.log('=' + '='.repeat(50));
        const rels = zip.readAsText('word/_rels/document.xml.rels');
        console.log(rels);
        console.log('\n');

        // Count relationships
        const relMatches = rels.match(/<Relationship /g);
        const imageRelMatches = rels.match(/Type="[^"]*image"/g);
        console.log(`Total Relationships: ${relMatches ? relMatches.length : 0}`);
        console.log(`Image Relationships: ${imageRelMatches ? imageRelMatches.length : 0}`);
        console.log('\n');

        // Extract all rIds
        const rIdMatches = rels.match(/Id="(rId\d+)"/g);
        if (rIdMatches) {
            const rIds = rIdMatches.map(m => m.match(/Id="(rId\d+)"/)[1]);
            console.log('📋 Relationship IDs found:');
            rIds.forEach(id => console.log(`  ${id}`));
            console.log('\n');

            // Check for duplicates
            const duplicates = rIds.filter((item, index) => rIds.indexOf(item) !== index);
            if (duplicates.length > 0) {
                console.log('❌ DUPLICATE rIds FOUND (THIS IS THE PROBLEM!):');
                duplicates.forEach(id => console.log(`  ${id}`));
            } else {
                console.log('✅ No duplicate rIds found');
            }
            console.log('\n');
        }

        // 3. Check word/document.xml (sample only - it's usually very large)
        console.log('📝 word/document.xml (image references sample):');
        console.log('=' + '='.repeat(50));
        const documentXml = zip.readAsText('word/document.xml');

        // Find image references
        const blipMatches = documentXml.match(/<a:blip[^>]*r:embed="[^"]*"[^>]*>/g);
        if (blipMatches) {
            console.log(`Found ${blipMatches.length} image references:`);
            blipMatches.slice(0, 5).forEach((match, i) => {
                console.log(`  ${i + 1}. ${match}`);
            });
            if (blipMatches.length > 5) {
                console.log(`  ... and ${blipMatches.length - 5} more`);
            }
        } else {
            console.log('❌ No image references found in document.xml');
        }
        console.log('\n');

        // 4. Check word/media/ folder
        console.log('🖼️  word/media/ contents:');
        console.log('=' + '='.repeat(50));
        const mediaFiles = zipEntries.filter(entry => entry.entryName.startsWith('word/media/'));
        if (mediaFiles.length > 0) {
            mediaFiles.forEach(file => {
                console.log(`  ${file.entryName} (${file.header.size} bytes)`);
            });
        } else {
            console.log('❌ No media files found!');
        }
        console.log('\n');

        // 5. Validation Summary
        console.log('📊 Validation Summary:');
        console.log('=' + '='.repeat(50));

        const hasContentTypes = imageTypes && imageTypes.length > 0;
        const hasRels = imageRelMatches && imageRelMatches.length > 0;
        const hasMedia = mediaFiles.length > 0;
        const hasBlips = blipMatches && blipMatches.length > 0;
        const hasDuplicates = rIdMatches && rIds && duplicates && duplicates.length > 0;

        console.log(`✅ Image content types registered: ${hasContentTypes ? 'YES' : 'NO'}`);
        console.log(`✅ Image relationships defined: ${hasRels ? 'YES' : 'NO'}`);
        console.log(`✅ Media files present: ${hasMedia ? 'YES' : 'NO'}`);
        console.log(`✅ Image references in document: ${hasBlips ? 'YES' : 'NO'}`);
        console.log(`✅ No duplicate rIds: ${!hasDuplicates ? 'YES' : 'NO (PROBLEM!)'}`);

        console.log('\n');

        if (hasContentTypes && hasRels && hasMedia && hasBlips && !hasDuplicates) {
            console.log('✅ DOCX structure appears valid for Microsoft Word');
        } else {
            console.log('❌ DOCX structure has issues that may cause Word to reject it');
        }

    } catch (error) {
        console.error('Error inspecting DOCX:', error);
        process.exit(1);
    }
};

// Run the inspector
const docxPath = process.argv[2];
if (!docxPath) {
    console.error('Usage: node inspect-docx.js <path-to-docx-file>');
    process.exit(1);
}

inspectDOCX(docxPath);
