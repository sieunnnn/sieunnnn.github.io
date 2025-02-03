const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

const TEMP_DIR = "./temp";
const DEST_DIR = "./assets/post";
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];

let processingQueue = [];
let movedFiles = new Set();
let maxImageNumber = 0;

function initializeMaxImageNumber() {
  const files = fs.readdirSync(DEST_DIR)
    .filter(file => VALID_EXTENSIONS.includes(path.extname(file)))
    .map(file => {
      const match = file.match(/^post-img(\d+)\.\w+$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null)
    .sort((a, b) => a - b);

  maxImageNumber = files.length > 0 ? files[files.length - 1] : 0;
  console.log(`📂 초기 이미지 번호 설정: ${maxImageNumber}`);
}

function getNextFileName(extension) {
  maxImageNumber++;
  return `post-img${String(maxImageNumber).padStart(2, '0')}${extension}`;
}

async function waitForFileReady(filePath, retries = 10, delay = 500) {
  return new Promise((resolve, reject) => {
    let lastSize = -1;

    const checkFile = () => {
      if (!fs.existsSync(filePath)) {
        if (retries-- > 0) {
          console.log(`⏳ 파일이 아직 준비되지 않음 (${retries}회 남음): ${filePath}`);
          setTimeout(checkFile, delay);
        } else {
          reject(new Error(`❎ 파일이 최종적으로 존재하지 않음: ${filePath}`));
        }
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err) {
          reject(new Error(`❎ 파일 상태 확인 오류: ${err.message}`));
          return;
        }

        if (stats.size > 0 && stats.size === lastSize) {
          resolve(true);
        } else {
          lastSize = stats.size;
          if (retries-- > 0) {
            console.log(`⏳ 파일 크기 변화 감지 중 (${retries}회 남음): ${filePath}`);
            setTimeout(checkFile, delay);
          } else {
            reject(new Error(`❎ 파일 크기가 안정되지 않음: ${filePath}`));
          }
        }
      });
    };

    setTimeout(checkFile, 500);
  });
}

async function processQueue() {
  if (processingQueue.length === 0) return;

  const filePath = processingQueue.shift();
  if (!fs.existsSync(filePath)) {
    console.log(`❎ 파일이 존재하지 않음: ${filePath}`);
    return;
  }

  try {
    await waitForFileReady(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const newFileName = getNextFileName(ext);
    const destPath = path.join(DEST_DIR, newFileName);

    movedFiles.add(destPath);

    fs.rename(filePath, destPath, err => {
      if (err) {
        console.error(`❎ 파일 이동 오류: ${err}`);
      } else {
        console.log(`✅ ${filePath} → ${destPath} 로 이름 변경 완료`);

        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error(`❎ 원본 파일 삭제 오류: ${err}`);
            } else {
              console.log(`🗑️ ${filePath} 삭제 완료`);
            }
          });
        }
      }
    });

  } catch (error) {
    console.error(`❎ ${error.message}`);
  }

  setTimeout(processQueue, 500);
}

initializeMaxImageNumber();

chokidar.watch(TEMP_DIR, { persistent: true, ignoreInitial: true })
  .on("add", filePath => {
    if (movedFiles.has(filePath)) return;

    console.log(`📥 새 파일 감지: ${filePath}`);
    processingQueue.push(filePath);
    processQueue();
  });

console.log(`📂 "${TEMP_DIR}" 폴더를 감시 중...`);
