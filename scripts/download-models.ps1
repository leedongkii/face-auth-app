# face-api.js 모델 파일 다운로드 스크립트 (Windows PowerShell)
# 실행: powershell -ExecutionPolicy Bypass -File scripts/download-models.ps1

$ModelDir = "public/models"
$BaseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null

$Files = @(
  "tiny_face_detector_model-shard1",
  "tiny_face_detector_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
  "face_recognition_model-weights_manifest.json"
)

Write-Host "face-api.js 모델 다운로드 시작..."

foreach ($File in $Files) {
  Write-Host "다운로드 중: $File"
  Invoke-WebRequest -Uri "$BaseUrl/$File" -OutFile "$ModelDir/$File"
}

Write-Host "모델 다운로드 완료!"
