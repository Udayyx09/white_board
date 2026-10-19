# Wait for backend health
Write-Host "Waiting for backend at http://localhost:8080/api/health..." -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "UP") {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $healthy) {
    Write-Error "Backend failed to become healthy in time."
    exit 1
}

Write-Host "Backend is UP and HEALTHY!" -ForegroundColor Green

$passCount = 0
$totalTests = 0

function Assert-Step($title, [scriptblock]$action) {
    $global:totalTests++
    Write-Host "`n[$global:totalTests] Testing: $title" -ForegroundColor Cyan
    try {
        & $action
        $global:passCount++
        Write-Host "  --> PASS" -ForegroundColor Green
    } catch {
        Write-Host "  --> FAILED: $_" -ForegroundColor Red
    }
}

$rand = Get-Random -Minimum 1000 -Maximum 9999
$username = "e2e_user_$rand"
$email = "e2e_$rand@test.com"
$password = "StrongPass123!"
$jwtToken = ""
$drawingId = ""

# 1. Register
Assert-Step "User Registration (POST /api/auth/register)" {
    $body = @{ username = $username; email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.success) { throw "Register response not successful" }
}

# 2. Login
Assert-Step "User Login (POST /api/auth/login)" {
    $body = @{ usernameOrEmail = $username; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $res.data.token
    if (-not $token) { $token = $res.data.accessToken }
    if (-not $token) { throw "No token in response" }
    $global:jwtToken = $token
}

# 3. Current User Info
Assert-Step "Get Current User Profile (GET /api/auth/me)" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/me" -Method Get -Headers $headers
    if ($res.data.username -ne $username) { throw "Username mismatch: $($res.data.username) != $username" }
}

# 4. Save Drawing
Assert-Step "Create/Save Drawing (POST /api/drawings)" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $drawingBody = @{
        title = "Architecture Diagram"
        elementsJson = '[{"id":"el1","type":"rectangle","x":100,"y":100,"width":200,"height":100}]'
        appStateJson = '{"zoom":1,"scrollX":0,"scrollY":0}'
        isPublic = $false
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings" -Method Post -Headers $headers -Body $drawingBody -ContentType "application/json"
    if (-not $res.data.id) { throw "No drawing id returned" }
    $global:drawingId = $res.data.id
}

# 5. List Drawings
Assert-Step "List User Drawings (GET /api/drawings)" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings" -Method Get -Headers $headers
    $found = $res.data | Where-Object { $_.id -eq $global:drawingId }
    if (-not $found) { throw "Created drawing not found in user list" }
}

# 6. Fetch Drawing by ID (Authenticated)
Assert-Step "Get Drawing By ID (GET /api/drawings/{id})" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings/$global:drawingId" -Method Get -Headers $headers
    if ($res.data.title -ne "Architecture Diagram") { throw "Title mismatch: $($res.data.title)" }
}

# 7. Update Drawing (Partial Update: Rename and make public)
Assert-Step "Update Drawing (PUT /api/drawings/{id})" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $updateBody = @{
        title = "Updated Public Architecture Diagram"
        isPublic = $true
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings/$global:drawingId" -Method Put -Headers $headers -Body $updateBody -ContentType "application/json"
    if ($res.data.title -ne "Updated Public Architecture Diagram") { throw "Title did not update: $($res.data.title)" }
    $isPub = $res.data.isPublic
    if ($null -eq $isPub) { $isPub = $res.data.public }
    if (-not $isPub) { throw "isPublic was not set to true" }
}

# 8. Fetch Public Drawing (Anonymous / No Token)
Assert-Step "Anonymous Access to Public Drawing (GET /api/drawings/public/{id})" {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings/public/$global:drawingId" -Method Get
    if ($res.data.title -ne "Updated Public Architecture Diagram") { throw "Failed to read public drawing anonymously" }
}

# 9. Delete Drawing
Assert-Step "Delete Drawing (DELETE /api/drawings/{id})" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/drawings/$global:drawingId" -Method Delete -Headers $headers
    if (-not $res.success) { throw "Delete request failed" }
}

# 10. Confirm 404 after Deletion
Assert-Step "Verify Deleted Drawing Returns 404" {
    $headers = @{ Authorization = "Bearer $global:jwtToken" }
    $got404 = $false
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/drawings/$global:drawingId" -Method Get -Headers $headers
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            $got404 = $true
        }
    }
    if (-not $got404) { throw "Expected 404 for deleted drawing, but did not get it" }
}

# 11. Test Frontend HTTP Server
Assert-Step "Frontend Dev Server Availability (GET http://localhost:5173/)" {
    $res = Invoke-WebRequest -Uri "http://localhost:5173/" -Method Get -TimeoutSec 5
    if ($res.StatusCode -ne 200) { throw "Frontend responded with status $($res.StatusCode)" }
}

$summaryColor = "Red"
if ($passCount -eq $totalTests) { $summaryColor = "Green" }
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "E2E TEST SUMMARY: $passCount / $totalTests Passed" -ForegroundColor $summaryColor
Write-Host "==========================================" -ForegroundColor Cyan

if ($passCount -ne $totalTests) {
    exit 1
}
