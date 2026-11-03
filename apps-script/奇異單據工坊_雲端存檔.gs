/**
 * 奇異單據工坊・雲端存檔服務（Google Apps Script）
 * 作用：讓網站版不用登入，也能把 PDF / Google 文件存進你的雲端硬碟。
 * 密碼：在「專案設定 → 指令碼屬性」新增 PASSWORD，值就是同事要輸入的密碼。
 * 需要：左側「服務」＋ 加入「Drive API」（v3）。
 */

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var pw = PropertiesService.getScriptProperties().getProperty('PASSWORD');
    if (!pw || req.password !== pw) return out({ ok: false, error: 'wrong_password' });

    if (req.action === 'check') return out({ ok: true });

    var parent = req.parentId ? DriveApp.getFolderById(req.parentId) : DriveApp.getRootFolder();

    if (req.action === 'folder') {
      var it = parent.getFoldersByName(req.title);
      var folder = it.hasNext() ? it.next() : parent.createFolder(req.title);
      return out({ ok: true, id: folder.getId(), url: folder.getUrl() });
    }

    if (req.action === 'upload') {
      var blob = Utilities.newBlob(Utilities.base64Decode(req.base64), req.mime || 'application/pdf', req.title);
      var file = parent.createFile(blob);
      return out({ ok: true, id: file.getId(), url: file.getUrl() });
    }

    if (req.action === 'gdoc') {
      var html = Utilities.newBlob(req.html, 'text/html', req.title + '.html');
      var doc = Drive.Files.create(
        { name: req.title, mimeType: 'application/vnd.google-apps.document', parents: [parent.getId()] },
        html
      );
      return out({ ok: true, id: doc.id, url: 'https://docs.google.com/document/d/' + doc.id + '/edit' });
    }

    return out({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return out({ ok: true, service: '奇異單據工坊 雲端存檔' });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
