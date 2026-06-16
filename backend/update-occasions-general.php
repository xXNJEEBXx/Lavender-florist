<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$products = DB::table('products')->whereJsonContains('occasions', 'get-well')->orWhereJsonContains('occasions', 'birthday')->get();
foreach($products as $p) {
    $occ = json_decode($p->occasions, true);
    $occ = array_map(function($o) {
        return ($o === 'get-well' || $o === 'birthday') ? 'general' : $o;
    }, $occ);
    // remove duplicates
    $occ = array_values(array_unique($occ));
    DB::table('products')->where('id', $p->id)->update(['occasions' => json_encode($occ)]);
}
echo "Updated general occasions\n";
