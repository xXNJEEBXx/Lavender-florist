<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$products = DB::table('products')->whereJsonContains('occasions', 'general')->inRandomOrder()->limit(10)->get();
foreach($products as $p) {
    $occ = json_decode($p->occasions, true);
    if(!in_array('eid', $occ)) {
        $occ[] = 'eid';
        DB::table('products')->where('id', $p->id)->update(['occasions' => json_encode($occ)]);
    }
}
echo "Updated eid occasions\n";
