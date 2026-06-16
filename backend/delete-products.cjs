const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, 'database/seeders/products-catalog.json');
let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const productsToDelete = [
    'عقد تخرج جوري أحمر وأبيض',
    'عقد تخرج أبيض'
];

let deletedCount = 0;

catalog = catalog.filter(p => {
    // Check if the product name matches exactly or closely
    for (const nameToDelete of productsToDelete) {
        if (p.nameAr.includes(nameToDelete) || p.professionalName.includes(nameToDelete)) {
            console.log(`[DELETED] ${p.nameAr}`);
            deletedCount++;
            return false;
        }
    }
    return true;
});

console.log(`\nDeleted ${deletedCount} products.`);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Successfully updated products-catalog.json (deleted products).');
