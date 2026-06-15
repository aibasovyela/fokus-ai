/**
 * ФОКУС ИИ — приём домашних заданий на Google Drive.
 *
 * КАК ПОДКЛЮЧИТЬ (5 минут):
 * 1. Создай папку в своём Google Drive (например «Фокус ИИ — ДЗ»).
 *    Открой её и скопируй ID из адреса:
 *    drive.google.com/drive/folders/ВОТ_ЭТОТ_ID
 * 2. Зайди на script.google.com → New project. Вставь весь этот код.
 * 3. Впиши свой ID папки в строку FOLDER_ID ниже.
 * 4. Deploy → New deployment → тип «Web app»:
 *       Execute as:      Me (твой аккаунт)
 *       Who has access:  Anyone
 *    Нажми Deploy, разреши доступ. Скопируй «Web app URL».
 * 5. Вставь этот URL в файл js/data.js → homeworkEndpoint: "ВСТАВЬ_СЮДА".
 * Готово — работы участников будут падать прямо в папку на Drive.
 */

const FOLDER_ID = 'PUT_YOUR_DRIVE_FOLDER_ID_HERE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(FOLDER_ID);

    const now = new Date();
    const stamp = Utilities.formatDate(now, 'GMT+5', 'yyyy-MM-dd HH:mm');
    const who = (data.name || 'аноним') + ' · ' + (data.module || 'без модуля');

    if (data.type === 'file' && data.fileData) {
      const bytes = Utilities.base64Decode(data.fileData);
      const blob = Utilities.newBlob(bytes, data.fileMime || 'application/octet-stream', data.fileName || 'file');
      const file = folder.createFile(blob);
      file.setName(stamp + ' — ' + who + ' — ' + (data.fileName || 'file'));
    } else {
      const body = data.type === 'link'
        ? ('Ссылка: ' + (data.content || ''))
        : (data.content || '');
      folder.createFile(stamp + ' — ' + who + '.txt', body, MimeType.PLAIN_TEXT);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Фокус ИИ — приём ДЗ работает.');
}
