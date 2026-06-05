<?php
$token = '8945356345:AAFU9Bu5V5nwXKWqAugox9mdC1hUdSGmdPs';
while(true) {
    $res = file_get_contents("https://api.telegram.org/bot{$token}/getUpdates");
    $data = json_decode($res, true);
    if (!empty($data['result'])) {
        file_put_contents('telegram_updates.json', $res);
        break;
    }
    sleep(2);
}
