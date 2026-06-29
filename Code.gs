/**
 * MCQ Quiz Live Exam Portal - Google Sheets Backend Apps Script
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor, paste this entire code block, and Save.
 * 4. Click "Deploy" -> "New deployment".
 * 5. Select "Web app" as the deployment type.
 * 6. Under "Execute as", select "Me" (your account).
 * 7. Under "Who has access", select "Anyone" (essential for static client access).
 * 8. Click "Deploy" and authorize permissions.
 * 9. Copy the generated "Web App URL" and paste it in the Setup panel of your MCQ Quiz Website.
 */

function ensureSheetsExist() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var quizSheet = ss.getSheetByName("Quizzes");
  if (!quizSheet) {
    quizSheet = ss.insertSheet("Quizzes");
    quizSheet.appendRow(["id", "title", "subject", "isLive", "questionsJson", "timestamp", "durationMinutes"]);
    // Set default teacher login credentials in D444:E444
    quizSheet.getRange("D444").setValue("admin");
    quizSheet.getRange("E444").setValue("admin123");
  }
  
  var resultsSheet = ss.getSheetByName("Results");
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet("Results");
    resultsSheet.appendRow(["id", "studentName", "quizId", "quizTitle", "subject", "score", "totalQuestions", "answersJson", "timestamp"]);
  }
  
  var activeSessionsSheet = ss.getSheetByName("ActiveSessions");
  if (!activeSessionsSheet) {
    activeSessionsSheet = ss.insertSheet("ActiveSessions");
    activeSessionsSheet.appendRow(["sessionId", "studentName", "quizId", "quizTitle", "status", "timestamp", "lastPing"]);
  }
}

// Handler for GET HTTP requests
function doGet(e) {
  ensureSheetsExist();
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "getQuizzes") {
    var sheet = ss.getSheetByName("Quizzes");
    var values = sheet.getDataRange().getValues();
    var quizzes = [];
    
    // Skip header row
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.length < 5 || !row[0]) continue;
      
      var id = row[0];
      var title = row[1];
      var subject = row[2];
      var isLive = row[3] === "true" || row[3] === true;
      var questions = [];
      try {
        questions = JSON.parse(row[4]);
      } catch(err) {}
      var timestamp = row[5] || 0;
      var durationMinutes = row[6] || 10;
      
      quizzes.push({
        quiz: { id: id, title: title, subject: subject, isLive: isLive, timestamp: timestamp, durationMinutes: durationMinutes },
        questions: questions
      });
    }
    return jsonResponse(quizzes);
  }
  
  if (action === "getResults") {
    var sheet = ss.getSheetByName("Results");
    var values = sheet.getDataRange().getValues();
    var results = [];
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.length < 8 || !row[0]) continue;
      results.push({
        id: row[0],
        studentName: row[1],
        quizId: row[2],
        quizTitle: row[3],
        subject: row[4],
        score: parseInt(row[5]) || 0,
        totalQuestions: parseInt(row[6]) || 0,
        answersJson: row[7],
        timestamp: row[8] || 0
      });
    }
    return jsonResponse(results);
  }
  
  if (action === "getActiveSessions") {
    var sheet = ss.getSheetByName("ActiveSessions");
    var values = sheet.getDataRange().getValues();
    var sessions = [];
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.length < 7 || !row[0]) continue;
      sessions.push({
        sessionId: row[0],
        studentName: row[1],
        quizId: row[2],
        quizTitle: row[3],
        status: row[4],
        timestamp: row[5] || 0,
        lastPing: row[6] || 0
      });
    }
    return jsonResponse(sessions);
  }
  
  if (action === "getCredentials") {
    var sheet = ss.getSheetByName("Quizzes");
    var username = sheet.getRange("D444").getValue();
    var password = sheet.getRange("E444").getValue();
    return jsonResponse({
      username: String(username).trim(),
      password: String(password).trim()
    });
  }
  
  return jsonResponse({ error: "Invalid action" });
}

// Handler for POST HTTP requests
function doPost(e) {
  ensureSheetsExist();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonResponse({ error: "Invalid JSON post contents" });
  }
  
  var action = postData.action;
  
  if (action === "appendQuiz") {
    var sheet = ss.getSheetByName("Quizzes");
    var q = postData.quiz;
    var questions = postData.questions;
    sheet.appendRow([
      q.id,
      q.title,
      q.subject,
      String(q.isLive),
      JSON.stringify(questions),
      String(q.timestamp),
      String(q.durationMinutes)
    ]);
    return jsonResponse({ success: true });
  }
  
  if (action === "appendResult") {
    var sheet = ss.getSheetByName("Results");
    var r = postData.result;
    sheet.appendRow([
      r.id,
      r.studentName,
      r.quizId,
      r.quizTitle,
      r.subject,
      String(r.score),
      String(r.totalQuestions),
      r.answersJson,
      String(r.timestamp)
    ]);
    return jsonResponse({ success: true });
  }
  
  if (action === "createActiveSession") {
    var sheet = ss.getSheetByName("ActiveSessions");
    var now = Date.now();
    sheet.appendRow([
      postData.sessionId,
      postData.studentName,
      postData.quizId,
      postData.quizTitle,
      "ACTIVE",
      String(now),
      String(now)
    ]);
    return jsonResponse({ success: true });
  }
  
  if (action === "updateActiveSessionStatus") {
    var sheet = ss.getSheetByName("ActiveSessions");
    var values = sheet.getDataRange().getValues();
    var sessionId = postData.sessionId;
    var newStatus = postData.status;
    var newPing = postData.lastPing || Date.now();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === sessionId) {
        var rowNumber = i + 1;
        sheet.getRange(rowNumber, 5).setValue(newStatus); // Column E: status
        sheet.getRange(rowNumber, 7).setValue(String(newPing)); // Column G: lastPing
        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ error: "Session not found" });
  }
  
  if (action === "updateAllQuizzes") {
    var sheet = ss.getSheetByName("Quizzes");
    var quizzes = postData.quizzes;
    
    // Clear and write header
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 7).setValues([["id", "title", "subject", "isLive", "questionsJson", "timestamp", "durationMinutes"]]);
    
    if (quizzes.length > 0) {
      var rows = quizzes.map(function(item) {
        var q = item.quiz;
        return [
          q.id,
          q.title,
          q.subject,
          String(q.isLive),
          JSON.stringify(item.questions),
          String(q.timestamp),
          String(q.durationMinutes)
        ];
      });
      sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    }
    
    // Restore teacher credentials placeholder D444:E444 in case it got cleared
    sheet.getRange("D444").setValue("admin");
    sheet.getRange("E444").setValue("admin123");
    
    return jsonResponse({ success: true });
  }
  
  return jsonResponse({ error: "Invalid action" });
}

// Helper to format JSON HTTP response with CORS headers
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
