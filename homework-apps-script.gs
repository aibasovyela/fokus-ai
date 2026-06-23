/**
 * ФОКУС ИИ → Google Drive. Дублирует домашние задания в папку на Drive.
 * Папка уже вписана ниже (FOLDER_ID). Тебе нужно только опубликовать скрипт.
 *
 * КАК ПОДКЛЮЧИТЬ (2 минуты):
 * 1. Открой script.google.com → New project. Удали пример, вставь ВЕСЬ этот код.
 * 2. Сверху: Deploy → New deployment → шестерёнка → тип «Web app».
 *       Execute as:      Me (твой Google)
 *       Who has access:  Anyone
 *    Нажми Deploy → Authorize access → выбери свой аккаунт → Allow.
 * 3. Скопируй «Web app URL» (вида https://script.google.com/macros/s/…/exec)
 *    и пришли его мне. Я подключу — и домашки начнут падать в папку.
 */

const FOLDER_ID = '1FlDcKg-B1MRlr0JZTEWLWNOhudWZ7VMk';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const stamp = Utilities.formatDate(new Date(), 'GMT+5', 'yyyy-MM-dd HH:mm');

    if (d.type === 'profile') {
      folder.createFile(stamp + ' — ПРОФИЛЬ — ' + (d.name || 'аноним') + '.txt',
        'Имя: ' + (d.name || '') + '\nСфера: ' + (d.sphere || ''), MimeType.PLAIN_TEXT);
      return ok();
    }

    const who = (d.name || 'аноним') + ' · ' + (d.homework || d.module || '');
    if (d.type === 'file' && d.fileData) {
      const blob = Utilities.newBlob(Utilities.base64Decode(d.fileData),
        d.fileMime || 'application/octet-stream', d.fileName || 'file');
      folder.createFile(blob).setName(stamp + ' — ' + who + ' — ' + (d.fileName || 'file'));
    } else {
      const body = d.type === 'link' ? ('Ссылка: ' + (d.content || '')) : (d.content || '');
      folder.createFile(stamp + ' — ' + who + '.txt', body, MimeType.PLAIN_TEXT);
    }
    return ok();
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function ok() { return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return ContentService.createTextOutput('Фокус ИИ → Drive: работает.'); }
