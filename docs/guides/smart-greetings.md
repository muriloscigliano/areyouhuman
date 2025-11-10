# 🎭 Smart Greetings System - Telos Personalization

Telos now greets users with **intelligent, dynamic, and data-driven** messages using a condition-based JSON system.

---

## ✨ Architecture Overview

### **Data-Driven Design**
Greetings are stored in `/src/data/context/greetings.json` — **no hardcoded messages in the component**.

This means:
- ✅ Non-developers can update greetings
- ✅ Easy A/B testing
- ✅ Version control for copy changes
- ✅ Translatable for i18n
- ✅ Follows the same pattern as the prompt system

### Before:
```
"👋 Hi! I'm the Are You Human? Copilot..."  // Hardcoded. Static. Boring.
```

### After (Data-Driven):
```json
{
  "id": "morning-new",
  "condition": { "time": "morning", "isReturning": false },
  "message": "Good morning, Human ☀️ I'm Telos — woven from code and curiosity..."
}
```

### Examples in Action:
```
// First-time visitor at 10am:
"Good morning, Human ☀️ I'm Telos — woven from code and curiosity. Ready to shape something extraordinary together?"

// Returning visitor at 8pm:
"Evening again, Human 🌆 The best ideas come when the world slows down. Ready to create?"

// Weekend morning return:
"Weekend return, Human 🎨 No deadlines, just pure creation. Let's build something beautiful."
```

---

## 🧠 How It Works

### 1. **Context Detection**
```javascript
const currentContext = {
  time: timeContext,          // morning/afternoon/evening/night
  isReturning: isReturningUser,  // true/false
  hasProject: !!lastProject,     // true/false
  intent: lastIntent,            // curious/project/focused
  isWeekend: day === 0 || day === 6  // true/false
};
```

### 2. **Condition Matching**
The system loads all greetings from `greetings.json` and filters for matches:

```javascript
const matchingGreetings = greetingsData.greetings.filter((greeting) => {
  return matchesCondition(greeting.condition, currentContext);
});
```

### 3. **First Match Wins**
Greetings are processed in order. The first greeting where **all conditions match** gets included in the pool.

Example:
```json
{
  "condition": { "time": "morning", "isReturning": true, "hasProject": true }
}
```
This only matches if:
- Current time is morning ✅
- User is returning ✅
- User has a stored project ✅

### 4. **Random Selection**
From all matching greetings, one is randomly chosen:

```javascript
const randomIndex = Math.floor(Math.random() * matchingGreetings.length);
return matchingGreetings[randomIndex].message;
```

### 5. **Template Variables**
Messages can include placeholders:
```json
"message": "Welcome back, Human 👋 I remember we were exploring {{projectName}}..."
```

These are replaced with actual values:
```javascript
message = message.replace('{{projectName}}', lastProject);
```

---

## 📋 Greeting Categories (15 total in JSON)

| Category | Count | Conditions |
|----------|-------|------------|
| **Morning** | 2 | Time: morning, New/Returning |
| **Afternoon** | 2 | Time: afternoon, New/Returning |
| **Evening** | 2 | Time: evening, New/Returning |
| **Night** | 2 | Time: night, New/Returning |
| **Intent-Based** | 2 | Returning + curious/project intent |
| **Project Memory** | 1 | Returning + hasProject |
| **Weekend** | 2 | Weekend + New/Returning |
| **Defaults** | 2 | Fallback for any unmatched state |

View all greetings in: `/src/data/context/greetings.json`

---

## 🔧 How to Add More Greetings

### **Location: `/src/data/context/greetings.json`**

**No code changes needed!** Just edit the JSON file.

### Step 1: Add a New Greeting Object

```json
{
  "id": "your-unique-id",
  "condition": { 
    "time": "morning", 
    "isReturning": true 
  },
  "message": "Your greeting message here, Human 🌟"
}
```

### Step 2: Define Conditions

Available condition properties:

| Property | Type | Values |
|----------|------|---------|
| `time` | string | `"morning"`, `"afternoon"`, `"evening"`, `"night"` |
| `isReturning` | boolean | `true`, `false` |
| `hasProject` | boolean | `true`, `false` |
| `intent` | string | `"curious"`, `"project"`, `"focused"` |
| `isWeekend` | boolean | `true`, `false` |

### Step 3: Use Template Variables (Optional)

```json
{
  "message": "Welcome back, Human! Working on {{projectName}} again?"
}
```

Available variables:
- `{{projectName}}` - Replaced with stored project name

### Step 4: Test Your Greeting

1. Save the JSON file
2. Rebuild: `npm run build`
3. Test locally: `npm run dev`
4. Set localStorage to match your conditions:
```javascript
localStorage.setItem('telos_visited', 'true');
localStorage.setItem('telos_last_project', 'AI Dashboard');
```

---

## 🎯 Personalization Features

### Currently Active:
- ✅ **Time of day** (morning/afternoon/evening/night)
- ✅ **New vs returning user** detection
- ✅ **Project memory** (optional - stored when project title collected)
- ✅ **Random rotation** (prevents repetition)

### Ready to Implement:
- 🔲 **Location-based** ("Good morning from [timezone]")
- 🔲 **Referral source** ("Welcome from [LinkedIn/Twitter/Google]")
- 🔲 **Previous quote status** ("Your quote from last week is ready!")
- 🔲 **Conversation stage** ("Let's continue your briefing")
- 🔲 **Device type** (Different greeting for mobile vs desktop)

---

## 💾 localStorage Keys Used

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `telos_visited` | Tracks if user has been here before | `"true"` |
| `telos_last_project` | Stores project name from last visit | `"AI Booking System"` |

### How to Store Project Name:
Add this when collecting the project title:
```typescript
localStorage.setItem('telos_last_project', projectTitle);
```

---

## 🧪 Testing the Greetings

### Test New User Experience:
```javascript
// In browser console:
localStorage.clear(); // Reset
location.reload();    // See new user greeting
```

### Test Returning User:
```javascript
// Visit once (sets flag)
location.reload();    // Should show returning greeting
```

### Test Project Memory:
```javascript
localStorage.setItem('telos_last_project', 'AI Dashboard');
location.reload();    // May show project reference
```

### Test Time Variations:
Change your system time and reload to see different time contexts.

---

## 🚀 Advanced Ideas

### 1. **Emotional Intelligence**
Match greeting energy to user's last interaction:
```typescript
const lastMood = localStorage.getItem('telos_last_mood');
// 'excited' → energetic greeting
// 'confused' → gentle, clarifying greeting
// 'frustrated' → empathetic greeting
```

### 2. **Conversation Continuity**
```typescript
const lastStage = localStorage.getItem('telos_stage');
if (lastStage === 'briefing-incomplete') {
  return "Hey Human 👋 Want to finish that project brief we started?";
}
```

### 3. **Achievement Recognition**
```typescript
const quotesGenerated = localStorage.getItem('telos_quotes_count');
if (quotesGenerated > 3) {
  return "Human! You're on a roll 🔥 Project #4 incoming?";
}
```

### 4. **Seasonal Awareness**
```typescript
const month = new Date().getMonth();
if (month === 11) { // December
  return "Happy holidays, Human! 🎄 Building something special before the year ends?";
}
```

---

## 📊 Analytics Ideas

Track which greetings perform best:
```typescript
localStorage.setItem('telos_greeting_shown', greetingIndex);
// Later: correlate with conversion rates
```

---

## ✨ Best Practices

1. **Keep it fresh** - Add new greetings monthly
2. **Stay on brand** - Use Telos voice (curious, philosophical, warm)
3. **Test variations** - A/B test different styles
4. **Avoid repetition** - Minimum 5 variations per category
5. **Make it meaningful** - Personalization should feel natural, not forced

---

## 🎯 Summary

**Before**: Static, boring, robotic  
**After**: Dynamic, intelligent, personalized

Every user interaction now feels like a continuation of a relationship, not a reset button.

**Stay Human. Stay Ahead.** ⚡️

