// Simple mapping of dates to Bible citations
// This is a small sample - you can expand it
const liturgicalReadings = {
  // Format: "MM-DD": { yearCycle: { readings } }
  
  // March 19 - St. Joseph (always same)
  "03-19": {
    readings: [
      { title: "1st Reading", citation: "2 Sm 7:4-5, 12-14, 16" },
      { title: "Psalm", citation: "Ps 89:2-3, 4-5, 27, 29" },
      { title: "2nd Reading", citation: "Rom 4:13, 16-18, 22" },
      { title: "Gospel", citation: "Mt 1:16, 18-21, 24a" }
    ]
  },
  
  // March 17 - St. Patrick
  "03-17": {
    readings: [
      { title: "1st Reading", citation: "1 Thes 2:2-8" },
      { title: "Psalm", citation: "Ps 117:1, 2" },
      { title: "Gospel", citation: "Mt 10:16-23" }
    ]
  },
  
  // March 25 - Annunciation
  "03-25": {
    readings: [
      { title: "1st Reading", citation: "Is 7:10-14, 8:10" },
      { title: "Psalm", citation: "Ps 40:7-11" },
      { title: "2nd Reading", citation: "Heb 10:4-10" },
      { title: "Gospel", citation: "Lk 1:26-38" }
    ]
  },
  
  // Sundays of Lent (by week number)
  "sunday-lent-1": {
    readings: [
      { title: "1st Reading", citation: "Deut 26:4-10" },
      { title: "Psalm", citation: "Ps 91:1-2, 10-15" },
      { title: "2nd Reading", citation: "Rom 10:8-13" },
      { title: "Gospel", citation: "Lk 4:1-13" }
    ]
  },
  
  "sunday-lent-2": {
    readings: [
      { title: "1st Reading", citation: "Gen 15:5-12, 17-18" },
      { title: "Psalm", citation: "Ps 27:1, 7-9, 13-14" },
      { title: "2nd Reading", citation: "Phil 3:17–4:1" },
      { title: "Gospel", citation: "Lk 9:28-36" }
    ]
  },
  
  "sunday-lent-3": {
    readings: [
      { title: "1st Reading", citation: "Ex 3:1-8, 13-15" },
      { title: "Psalm", citation: "Ps 103:1-4, 6-8, 11" },
      { title: "2nd Reading", citation: "1 Cor 10:1-6, 10-12" },
      { title: "Gospel", citation: "Lk 13:1-9" }
    ]
  },
  
  "sunday-lent-4": {
    readings: [
      { title: "1st Reading", citation: "Jos 5:9-12" },
      { title: "Psalm", citation: "Ps 34:2-7" },
      { title: "2nd Reading", citation: "2 Cor 5:17-21" },
      { title: "Gospel", citation: "Lk 15:1-3, 11-32" }
    ]
  },
  
  "sunday-lent-5": {
    readings: [
      { title: "1st Reading", citation: "Is 43:16-21" },
      { title: "Psalm", citation: "Ps 126:1-6" },
      { title: "2nd Reading", citation: "Phil 3:8-14" },
      { title: "Gospel", citation: "Jn 8:1-11" }
    ]
  },
  
  // Weekdays of Lent (simplified - just one set per week)
  "weekday-lent-1": {
    readings: [
      { title: "1st Reading", citation: "Lev 19:1-2, 11-18" },
      { title: "Psalm", citation: "Ps 19:8-10, 15" },
      { title: "Gospel", citation: "Mt 25:31-46" }
    ]
  },
  
  "weekday-lent-2": {
    readings: [
      { title: "1st Reading", citation: "Dan 9:4-10" },
      { title: "Psalm", citation: "Ps 79:8-9, 11, 13" },
      { title: "Gospel", citation: "Lk 6:36-38" }
    ]
  },
  
  "weekday-lent-3": {
    readings: [
      { title: "1st Reading", citation: "2 Kgs 5:1-15" },
      { title: "Psalm", citation: "Ps 42:2-3, 43:3-4" },
      { title: "Gospel", citation: "Lk 4:24-30" }
    ]
  },
  
  "weekday-lent-4": {
    readings: [
      { title: "1st Reading", citation: "Is 65:17-21" },
      { title: "Psalm", citation: "Ps 30:2, 4-6, 11-13" },
      { title: "Gospel", citation: "Jn 4:43-54" }
    ]
  },
  
  "weekday-lent-5": {
    readings: [
      { title: "1st Reading", citation: "Is 43:16-21" },
      { title: "Psalm", citation: "Ps 126:1-6" },
      { title: "Gospel", citation: "Jn 8:1-11" }
    ]
  },
  
  // Default for ordinary time
  "default": {
    readings: [
      { title: "1st Reading", citation: "Is 1:10, 16-20" },
      { title: "Psalm", citation: "Ps 50:8-9, 16-17, 21, 23" },
      { title: "Gospel", citation: "Mt 23:1-12" }
    ]
  }
};

module.exports = liturgicalReadings;