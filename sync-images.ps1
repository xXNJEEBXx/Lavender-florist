$baseUrl = "https://lavender-florist-production.up.railway.app/api/sync-images"
$folders = @("products", "components")

foreach ($folder in $folders) {
    $folderPath = "C:\xXNJEEBXx\Projects\lavender-flowers\backend\storage\app\public\$folder"
    if (Test-Path $folderPath) {
        $files = Get-ChildItem -Path $folderPath -File -Recurse
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($folderPath.Length + 1)
            $targetPath = "$folder/$relativePath".Replace('\', '/')
            Write-Host "Uploading $targetPath..."
            
            $boundary = [System.Guid]::NewGuid().ToString()
            $bodyLines = @(
                "--$boundary",
                "Content-Disposition: form-data; name=`"path`"",
                "",
                $targetPath,
                "--$boundary",
                "Content-Disposition: form-data; name=`"file`"; filename=`"$($file.Name)`"",
                "Content-Type: application/octet-stream",
                ""
            )
            
            $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $bodyString = [string]::Join("`r`n", $bodyLines) + "`r`n"
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyString)
            
            $endBoundaryString = "`r`n--$boundary--`r`n"
            $endBoundaryBytes = [System.Text.Encoding]::UTF8.GetBytes($endBoundaryString)
            
            $payload = New-Object byte[] ($bodyBytes.Length + $fileBytes.Length + $endBoundaryBytes.Length)
            [System.Array]::Copy($bodyBytes, 0, $payload, 0, $bodyBytes.Length)
            [System.Array]::Copy($fileBytes, 0, $payload, $bodyBytes.Length, $fileBytes.Length)
            [System.Array]::Copy($endBoundaryBytes, 0, $payload, $bodyBytes.Length + $fileBytes.Length, $endBoundaryBytes.Length)
            
            try {
                $response = Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Headers @{"X-Sync-Key"="lavender-sync-999"} -Body $payload
                Write-Host "Uploaded $targetPath successfully."
            } catch {
                Write-Host "Failed to upload $targetPath" -ForegroundColor Red
            }
        }
    }
}
