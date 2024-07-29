function doGet() {
  var template = HtmlService.createTemplateFromFile('Page');
  return template.evaluate();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getOverallInsights() {
  var postsData = getPostData();
  var demographicsData = getDemographicsData();
  var keywordData = getKeywordData();
  var followersData = getFollowersData();

  return {
    engagementOverview: calculateEngagementOverview(postsData),
    audienceDemographics: calculateAudienceDemographics(demographicsData),
    keywordDistribution: keywordData,
    audienceGrowth: calculateAudienceGrowth(followersData),
    engagementByPlatform: calculateEngagementByPlatform(postsData)
  };
}

function getPostData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Posts");
  var postsData = sheet.getDataRange().getValues();
  postsData.shift(); // Remove header row
  return postsData;
}

function getDemographicsData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Demographics");
  var demographicsData = sheet.getDataRange().getValues();
  demographicsData.shift(); // Remove header row
  return demographicsData;
}

function getFollowersData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Followers");
  var followersData = sheet.getDataRange().getValues();
  followersData.shift(); // Remove header row
  return followersData;
}

function calculateEngagementOverview(postsData) {
  var engagementByDate = {};

  postsData.forEach(function (row) {
    var date = new Date(row[3]).toISOString().split('T')[0];
    if (!engagementByDate[date]) {
      engagementByDate[date] = { likes: 0, comments: 0, shares: 0 };
    }
    engagementByDate[date].likes += row[5];
    engagementByDate[date].comments += row[6];
    engagementByDate[date].shares += row[7];
  });

  var sortedDates = Object.keys(engagementByDate).sort();
  return {
    labels: sortedDates,
    likes: sortedDates.map(date => engagementByDate[date].likes),
    comments: sortedDates.map(date => engagementByDate[date].comments),
    shares: sortedDates.map(date => engagementByDate[date].shares)
  };
}

function calculateAudienceDemographics(demographicsData) {
  var ageGroups = {};

  demographicsData.forEach(function (row) {
    var ageGroup = row[1];
    ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
  });

  return {
    labels: Object.keys(ageGroups),
    values: Object.values(ageGroups)
  };
}

function calculateAudienceGrowth(followersData) {
  var growthByDate = {};

  followersData.forEach(function (row) {
    var date = new Date(row[1]).toISOString().split('T')[0];
    growthByDate[date] = (growthByDate[date] || 0) + row[2]; // New Followers
  });

  var sortedDates = Object.keys(growthByDate).sort();
  return {
    labels: sortedDates,
    values: sortedDates.map(date => growthByDate[date])
  };
}

function calculateEngagementByPlatform(postsData) {
  var engagementByPlatform = {};

  postsData.forEach(function (row) {
    var platform = row[1];
    engagementByPlatform[platform] = (engagementByPlatform[platform] || 0) + row[5] + row[6] + row[7]; // Sum of likes, comments, shares
  });

  return {
    labels: Object.keys(engagementByPlatform),
    values: Object.values(engagementByPlatform)
  };
}

function analyzePosts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Posts");
  var postsData = sheet.getDataRange().getValues();

  return postsData.slice(1).map(row => {
    var content = row[2];
    var sentimentScore = Math.random(); // Simulating sentiment score
    return [content, sentimentScore.toFixed(2)];
  });
}

function getAnalyticsData() {
  var data = getPostData();
  data.sort((a, b) => new Date(a[3]) - new Date(b[3]));

  return {
    weekly: calculatePeriodData(data, 7),
    monthly: calculatePeriodData(data, 30)
  };
}

function calculatePeriodData(data, days) {
  var periodData = {};
  var currentDate = new Date(data[0][3]);
  var endDate = new Date(data[data.length - 1][3]);

  while (currentDate <= endDate) {
    var periodEnd = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
    var periodPosts = data.filter(row => new Date(row[3]) >= currentDate && new Date(row[3]) < periodEnd);

    var totalLikes = periodPosts.reduce((sum, row) => sum + (row[5] || 0), 0);
    var totalComments = periodPosts.reduce((sum, row) => sum + (row[6] || 0), 0);
    var totalShares = periodPosts.reduce((sum, row) => sum + (row[7] || 0), 0);

    var label = formatDate(currentDate) + ' - ' + formatDate(new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000));
    periodData[label] = { likes: totalLikes, comments: totalComments, shares: totalShares };

    currentDate = periodEnd;
  }

  return {
    labels: Object.keys(periodData),
    likes: Object.values(periodData).map(d => d.likes),
    comments: Object.values(periodData).map(d => d.comments),
    shares: Object.values(periodData).map(d => d.shares)
  };
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd/yyyy');
}

function getContentRecommendations() {
  var url = 'https://api.openai.com/v1/engines/davinci-codex/completions';
  var payload = { prompt: 'Generate content recommendations based on past posts...', max_tokens: 100 };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer YOUR_OPENAI_API_KEY' },
    payload: JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    return result.choices[0].text;
  } catch (e) {
    Logger.log('Error fetching content recommendations: ' + e.message);
    return 'Error fetching content recommendations';
  }
}

function analyzeSentiment(text) {
  var url = 'https://language.googleapis.com/v1/documents:analyzeSentiment?key=YOUR_GOOGLE_API_KEY';
  var payload = { document: { type: 'PLAIN_TEXT', content: text }, encodingType: 'UTF8' };

  var options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    return result.documentSentiment;
  } catch (e) {
    Logger.log('Error analyzing sentiment: ' + e.message);
    return { score: null, magnitude: null };
  }
}

// This function same as getPostData()
function getKeywordExtractedData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Keyword Extracted");
  var data = sheet.getDataRange().getValues();
  data.shift(); // Remove header row
  Logger.log(data); // Add this line to check if data is fetched correctly
  return data;
}

function getKeywordData() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Keyword Extracted");
    if (!sheet) {
      throw new Error("Sheet 'Keyword Extracted' not found");
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log("Data retrieved: " + data.length + " rows");
    
    var keywordCount = {};
   
    // Skip the header row
    for (var i = 1; i < data.length; i++) {
      if (data[i].length <= 8) {
        Logger.log("Row " + i + " does not have enough columns: " + data[i].length);
        continue;
      }
      var keywordsCell = data[i][8]; // Keywords are in column I (index 8)
      if (typeof keywordsCell !== 'string') {
        Logger.log("Keywords cell is not a string in row " + i + ": " + typeof keywordsCell);
        continue;
      }
      var keywords = keywordsCell.split(', ');
      keywords.forEach(function(keyword) {
        if (keyword.trim() !== '') {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        }
      });
    }
   
    Logger.log("Keyword count: " + Object.keys(keywordCount).length);
    
    var sortedKeywords = Object.entries(keywordCount).sort((a, b) => b[1] - a[1]);
    var topKeywords = sortedKeywords.slice(0, 10);
   
    return {
      labels: topKeywords.map(item => item[0]),
      values: topKeywords.map(item => item[1])
    };
  } catch (error) {
    Logger.log("Error in getKeywordData: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    throw error;
  }
}

function testGetKeywordData() {
  try {
    var result = getKeywordData();
    Logger.log("getKeywordData result: " + JSON.stringify(result));
  } catch (error) {
    Logger.log("Error in testGetKeywordData: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
  }
}
