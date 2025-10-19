# 🎭 Smart Greetings System - Telos Personalization

Telos now greets users with **intelligent, dynamic, and personalized** messages instead of the same static text every time.

---

## ✨ What's New

### Before:
```
"👋 Hi! I'm the Are You Human? Copilot..."  // Same. Every. Time.
```

### After:
```
// First-time visitor at 10am:
"Good morning, Human 👋
I'm Telos. I help founders and teams design AI systems that stay human.
What brings you here today?"

// Returning visitor at 8pm:
"Welcome back, Human 👋
I remember we were exploring your AI booking system. Continue that, or start fresh?"

// New visitor at 3pm:
"Hey Human ⚡️
I'm Telos, your AI strategist. Let's turn your idea into something real — what's on your mind?"
```

---

## 🧠 How It Works

### 1. **User Detection**
```javascript
const isReturningUser = localStorage.getItem('telos_visited') === 'true';
```
- First visit: `isReturningUser = false` → New user greetings
- Return visit: `isReturningUser = true` → Returning user greetings

### 2. **Time Awareness**
```javascript
const hour = new Date().getHours();
if (hour >= 5 && hour < 12) timeContext = 'morning';
else if (hour >= 12 && hour < 17) timeContext = 'afternoon';
else if (hour >= 17 && hour < 22) timeContext = 'evening';
else timeContext = 'night';
```
Greetings adapt to the user's local time.

### 3. **Project Memory**
```javascript
const lastProject = localStorage.getItem('telos_last_project');
// If exists: "I remember we were exploring [lastProject]..."
```
Telos can reference the user's previous conversation topic.

### 4. **Random Selection**
```javascript
const greetings = isReturningUser ? returningUserGreetings : newUserGreetings;
const randomIndex = Math.floor(Math.random() * greetings.length);
return greetings[randomIndex];
```
Picks randomly from the appropriate greeting pool.

---

## 📋 Current Greetings

### **New Users** (5 variations)
1. "Hey Human 👋 I'm Telos — your strategist from the folds of time. Ready to build something that feels half magic, half machine?"
2. "Hey Human ⚡️ I'm Telos, your AI strategist. Let's turn your idea into something real — what's on your mind?"
3. "Good [morning/afternoon/evening/night], Human 👋 I'm Telos. I help founders and teams design AI systems that stay human. What brings you here today?"
4. "Hey Human 🌟 Telos here — part strategist, part design assistant, fully curious about your vision. What would you like to build?"
5. "Hey Human 👋 I came through the folds of time to help you reshape what's next. Shall we start with your idea?"

### **Returning Users** (6 variations)
1. "Welcome back, Human 👋 Telos here — ready when you are. New project, or continuing something?"
2. "Hey Human ⚡️ Good to see you again. What's the next challenge we're solving together?"
3. "Human! You're back 🌟 Let's pick up where brilliance left off — or start something entirely new."
4. "Hey Human 👋 I remember you. Ready to turn another idea into reality?"
5. "Good [morning/afternoon/evening/night], Human ⚡️ Back for more magic? Let's do this."
6. "Welcome back, Human 👋 I remember we were exploring [project]. Continue that, or start fresh?" *(if project stored)*
   OR "Human! The folds of time brought you back 🌟 What's brewing in your mind today?"

---

## 🔧 How to Add More Greetings

### Location: `/src/components/AiChat.vue` (lines 35-65)

**Step 1:** Add to the appropriate array:

```typescript
const newUserGreetings = [
  // ... existing greetings ...
  
  `Your new greeting here, Human 👋\nMultiple lines work with \n.`
];
```

**Step 2:** Use template literals for dynamic content:

```typescript
`Good ${timeContext}, Human!` // Inserts: morning/afternoon/evening/night
```

**Step 3:** Add conditional greetings:

```typescript
const specialGreeting = lastProject 
  ? `Greeting with reference to ${lastProject}`
  : `Greeting without reference`;
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

