#!/bin/bash
# face-api.js 모델 파일 다운로드 스크립트
# 실행: bash scripts/download-models.sh

MODEL_DIR="public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

mkdir -p "$MODEL_DIR"

echo "face-api.js 모델 다운로드 시작..."

FILES=(
  "tiny_face_detector_model-shard1"
  "tiny_face_detector_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
  "face_recognition_model-weights_manifest.json"
)

for FILE in "${FILES[@]}"; do
  echo "다운로드 중: $FILE"
  curl -L "$BASE_URL/$FILE" -o "$MODEL_DIR/$FILE"
done

echo "모델 다운로드 완료!"
